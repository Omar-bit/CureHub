import { Injectable } from '@nestjs/common';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface VerificationEmailData {
  firstName?: string;
  otp: string;
  expiryMinutes: number;
}

@Injectable()
export class EmailTemplateService {
  /**
   * Generate email verification template
   * This is customizable and can be extended for different languages/themes
   */
  generateVerificationEmail(data: VerificationEmailData): EmailTemplate {
    const { firstName, otp, expiryMinutes } = data;
    const name = firstName ? `Hello ${firstName}` : 'Hello';

    const subject = 'Verify Your Email Address - CureHub';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Verification</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .otp-container {
            background-color: #f8fafc;
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
          }
          .otp-code {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            letter-spacing: 4px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3cd;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CureHub</div>
            <h1>Verify Your Email Address</h1>
          </div>
          
          <p>${name},</p>
          
          <p>Thank you for signing up for CureHub! To complete your registration, please verify your email address using the code below:</p>
          
          <div class="otp-container">
            <p><strong>Your Verification Code:</strong></p>
            <div class="otp-code">${otp}</div>
            <p><small>This code will expire in ${expiryMinutes} minutes</small></p>
          </div>
          
          <p>If you didn't create an account with CureHub, please ignore this email.</p>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this code with anyone. CureHub support will never ask for your verification code.
          </div>
          
          <div class="footer">
            <p>This is an automated message from CureHub.<br>
            If you have any questions, please contact our support team.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${name},
      
      Thank you for signing up for CureHub! 
      
      Your verification code is: ${otp}
      
      This code will expire in ${expiryMinutes} minutes.
      
      If you didn't create an account with CureHub, please ignore this email.
      
      Never share this code with anyone. CureHub support will never ask for your verification code.
      
      ---
      CureHub Team
    `;

    return { subject, html, text };
  }

  /**
   * Generate password reset template (for future use)
   */
  generatePasswordResetEmail(data: {
    firstName?: string;
    resetToken: string;
    expiryMinutes: number;
  }): EmailTemplate {
    // Implementation for password reset emails
    // This can be extended as needed
    return {
      subject: 'Reset Your Password - CureHub',
      html: '<p>Password reset functionality coming soon...</p>',
      text: 'Password reset functionality coming soon...',
    };
  }

  /**
   * Generate welcome email template (for future use)
   */
  generateWelcomeEmail(data: {
    firstName?: string;
    userRole: string;
  }): EmailTemplate {
    // Implementation for welcome emails
    // This can be extended as needed
    return {
      subject: 'Welcome to CureHub!',
      html: '<p>Welcome email functionality coming soon...</p>',
      text: 'Welcome email functionality coming soon...',
    };
  }

  /**
   * Generate patient welcome email with login credentials
   */
  generatePatientWelcomeEmail(data: {
    firstName: string;
    email: string;
    password: string;
  }): EmailTemplate {
    const { firstName, email, password } = data;

    const subject = 'Welcome to CureHub - Your Login Credentials';

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CureHub</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .credentials-container {
            background-color: #f8fafc;
            border: 2px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .credential-item:last-child {
            border-bottom: none;
          }
          .credential-label {
            font-weight: bold;
            color: #374151;
          }
          .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            margin-top: 4px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .warning {
            background-color: #fef3cd;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 12px;
            margin: 20px 0;
            font-size: 14px;
          }
          .cta-button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CureHub</div>
            <h1>Welcome to CureHub!</h1>
          </div>
          
          <p>Hello ${firstName},</p>
          
          <p>Your doctor has created a patient account for you on CureHub. You can now access our platform to manage your appointments, view your medical records, and communicate with your healthcare provider.</p>
          
          <div class="credentials-container">
            <h3>Your Login Credentials:</h3>
            <div class="credential-item">
              <div class="credential-label">Email:</div>
              <div class="credential-value">${email}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">Temporary Password:</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important Security Notice:</strong>
            <ul>
              <li>Please change your password after your first login</li>
              <li>Keep your login credentials secure and don't share them with anyone</li>
              <li>If you didn't expect this account creation, please contact your doctor immediately</li>
            </ul>
          </div>
          
          <p>You can log in to your account using the credentials above. We recommend changing your password during your first login for security purposes.</p>
          
          <div class="footer">
            <p>If you have any questions about your account, please contact your healthcare provider.<br>
            This is an automated message from CureHub.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Hello ${firstName},
      
      Your doctor has created a patient account for you on CureHub.
      
      Your Login Credentials:
      Email: ${email}
      Temporary Password: ${password}
      
      IMPORTANT SECURITY NOTICE:
      - Please change your password after your first login
      - Keep your login credentials secure and don't share them with anyone
      - If you didn't expect this account creation, please contact your doctor immediately
      
      You can log in to your account using the credentials above.
      
      ---
      CureHub Team
    `;

    return { subject, html, text };
  }

  /**
   * Generate custom email template for doctor-to-patient communication
   */
  generateCustomPatientEmail(data: {
    patientName: string;
    doctorName: string;
    subject: string;
    message: string;
  }): EmailTemplate {
    const { patientName, doctorName, subject, message } = data;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9fafb;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .message-container {
            background-color: #f8fafc;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 20px 0;
            white-space: pre-wrap;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .doctor-info {
            background-color: #eef2ff;
            border-radius: 6px;
            padding: 12px;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CureHub</div>
          </div>
          
          <p>Bonjour ${patientName},</p>
          
          <div class="message-container">
            ${message.replace(/\n/g, '<br>')}
          </div>
          
          <div class="doctor-info">
            <p><strong>Envoyé par:</strong> ${doctorName}</p>
          </div>
          
          <div class="footer">
            <p>Ceci est un message de votre médecin via CureHub.<br>
            Si vous avez des questions, veuillez contacter votre médecin directement.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bonjour ${patientName},
      
      ${message}
      
      ---
      Envoyé par: ${doctorName}
      via CureHub
    `;

    return { subject, html, text };
  }
}
