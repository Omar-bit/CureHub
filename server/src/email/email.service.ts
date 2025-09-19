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
    return {
      host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE', 'false') === 'true',
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
      this.transporter = nodemailer.createTransport({
        host: this.emailConfig.host,
        port: this.emailConfig.port,
        secure: this.emailConfig.secure,
        auth: this.emailConfig.auth,
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates in development
        },
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          this.logger.error('SMTP connection failed:', error);
        } else {
          this.logger.log('SMTP server is ready to take our messages');
        }
      });
    } catch (error) {
      this.logger.error('Failed to create email transporter:', error);
      throw error;
    }
  }

  /**
   * Send email with template
   */
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const { to, template, attachments } = options;

      const mailOptions = {
        from: `"${this.emailConfig.from.name}" <${this.emailConfig.from.email}>`,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Email sent successfully to ${to}. Message ID: ${result.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
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
