import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { EmailTemplateService, EmailTemplate } from './email-template.service';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export interface SendEmailOptions {
  to: string;
  template: EmailTemplate;
  attachments?: any[];
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private emailConfig: EmailConfig;

  constructor(
    private configService: ConfigService,
    private emailTemplateService: EmailTemplateService,
  ) {
    this.emailConfig = this.getEmailConfig();
    this.createTransporter();
  }

  private getEmailConfig(): EmailConfig {
    // Get the email provider type for potential fallback
    const emailProvider = this.configService.get('EMAIL_PROVIDER', 'gmail');

    // Default to Gmail but can be overridden for production
    let defaultHost = 'smtp.gmail.com';
    let defaultPort = 587;
    let defaultSecure = false;

    // Support for alternative providers that work better in production
    switch (emailProvider.toLowerCase()) {
      case 'sendgrid':
        defaultHost = 'smtp.sendgrid.net';
        defaultPort = 587;
        defaultSecure = false;
        break;
      case 'mailgun':
        defaultHost = 'smtp.mailgun.org';
        defaultPort = 587;
        defaultSecure = false;
        break;
      case 'ses':
        // AWS SES configuration would be region-specific
        defaultHost = 'email-smtp.us-east-1.amazonaws.com';
        defaultPort = 587;
        defaultSecure = false;
        break;
      case 'gmail':
      default:
        defaultHost = 'smtp.gmail.com';
        defaultPort = 587;
        defaultSecure = false;
        break;
    }

    return {
      host: this.configService.get('SMTP_HOST', defaultHost),
      port: parseInt(
        this.configService.get('SMTP_PORT', defaultPort.toString()),
      ),
      secure:
        this.configService.get('SMTP_SECURE', defaultSecure.toString()) ===
        'true',
      auth: {
        user: this.configService.get('SMTP_USER', ''),
        pass: this.configService.get('SMTP_PASS', ''),
      },
      from: {
        name: this.configService.get('EMAIL_FROM_NAME', 'CureHub'),
        email: this.configService.get(
          'EMAIL_FROM_ADDRESS',
          'noreply@curehub.com',
        ),
      },
    };
  }

  private createTransporter() {
    try {
      // Enhanced configuration for production environments like Render
      const transportConfig = {
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        secure: this.emailConfig.secure,
        auth: this.emailConfig.auth,
        // Enhanced timeout and connection settings for cloud hosting
        connectionTimeout: 60000, // 60 seconds
        greetingTimeout: 30000, // 30 seconds
        socketTimeout: 60000, // 60 seconds
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
        rateLimit: 14, // Gmail allows 14 messages per second
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
          ciphers: 'SSLv3', // Force SSL/TLS version
        },
        // Additional options for Gmail and cloud hosting
        requireTLS: true,
        logger: process.env.NODE_ENV === 'development', // Enable logging in development
        debug: process.env.NODE_ENV === 'development', // Enable debug in development
      };

      this.transporter = nodemailer.createTransport(transportConfig);

      // Verify connection configuration with proper error handling
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('SMTP connection failed:', error);
          // Don't throw here as it might prevent app startup
        } else {
          this.logger.log('SMTP server is ready to take our messages');
        }
      });
    } catch (error) {
      this.logger.error('Failed to create email transporter:', error);
      // Don't throw error to prevent app crash, just log it
    }
  }

  /**
   * Send email with template and retry logic
   */
  async sendEmail(
    options: SendEmailOptions,
    retryCount: number = 3,
  ): Promise<boolean> {
    const { to, template, attachments } = options;

    const mailOptions = {
      from: `"${this.emailConfig.from.name}" <${this.emailConfig.from.email}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
      attachments,
    };

    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        // Test connection before sending if this is a retry
        if (attempt > 1) {
          this.logger.log(`Retry attempt ${attempt} for email to ${to}`);
          await this.testConnection();
        }

        const result = await this.transporter.sendMail(mailOptions);
        this.logger.log(
          `Email sent successfully to ${to}. Message ID: ${result.messageId}`,
        );
        return true;
      } catch (error) {
        this.logger.error(
          `Attempt ${attempt} failed to send email to ${to}:`,
          error,
        );

        // If this is the last attempt, give up
        if (attempt === retryCount) {
          this.logger.error(
            `All ${retryCount} attempts failed for email to ${to}`,
          );
          return false;
        }

        // Wait before retrying (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        this.logger.log(`Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  /**
   * Test SMTP connection
   */
  private async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      this.logger.error('SMTP connection test failed:', error);
      // Try to recreate the transporter
      this.createTransporter();
      return false;
    }
  }

  /**
   * Send verification email with OTP
   */
  async sendVerificationEmail(
    email: string,
    otp: string,
    firstName?: string,
    expiryMinutes: number = 15,
  ): Promise<boolean> {
    try {
      const template = this.emailTemplateService.generateVerificationEmail({
        firstName,
        otp,
        expiryMinutes,
      });

      return await this.sendEmail({
        to: email,
        template,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Send password reset email (for future use)
   */
  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    firstName?: string,
    expiryMinutes: number = 30,
  ): Promise<boolean> {
    try {
      const template = this.emailTemplateService.generatePasswordResetEmail({
        firstName,
        resetToken,
        expiryMinutes,
      });

      return await this.sendEmail({
        to: email,
        template,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Send welcome email (for future use)
   */
  async sendWelcomeEmail(
    email: string,
    firstName?: string,
    userRole: string = 'PATIENT',
  ): Promise<boolean> {
    try {
      const template = this.emailTemplateService.generateWelcomeEmail({
        firstName,
        userRole,
      });

      return await this.sendEmail({
        to: email,
        template,
      });
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}:`, error);
      return false;
    }
  }

  /**
   * Send patient welcome email with login credentials
   */
  async sendPatientWelcomeEmail(
    email: string,
    firstName: string,
    password: string,
  ): Promise<boolean> {
    try {
      const template = this.emailTemplateService.generatePatientWelcomeEmail({
        firstName,
        email,
        password,
      });

      return await this.sendEmail({
        to: email,
        template,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send patient welcome email to ${email}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email configuration test successful');
      return true;
    } catch (error) {
      this.logger.error('Email configuration test failed:', error);
      return false;
    }
  }
}
