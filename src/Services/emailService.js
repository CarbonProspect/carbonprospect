// services/emailService.js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const emailService = {
  // Send verification email when user registers
  async sendVerificationEmail(email, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
    
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Carbon Prospect'
      },
      replyTo: 'support@carbonprospect.com',
      subject: 'Verify Your Carbon Prospect Account',
      categories: ['verification', 'transactional'],
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Preheader text for inbox preview -->
            <div style="display: none; max-height: 0; overflow: hidden;">
              Verify your email to complete your Carbon Prospect registration - link expires in 24 hours
            </div>
            
            <h1 style="color: #2E7D32;">Welcome to Carbon Prospect!</h1>
            <p>Hi there,</p>
            <p>Thank you for registering. Please verify your email address to complete your registration and start using Carbon Prospect.</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${verificationUrl}" 
                 style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${verificationUrl}</p>
            <p style="color: #666; margin-top: 30px;"><strong>This link will expire in 24 hours.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px;">
              If you didn't create an account with Carbon Prospect, you can safely ignore this email.
            </p>
            <p style="color: #999; font-size: 14px;">
              This is an automated message, please do not reply. For support, contact us at support@carbonprospect.com
            </p>
            
            <!-- Footer with physical address -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.</p>
              <p>Sydney, NSW, Australia</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
                <a href="${process.env.FRONTEND_URL}/terms" style="color: #999;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Carbon Prospect!

Hi there,

Thank you for registering. Please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Carbon Prospect, you can safely ignore this email.

This is an automated message, please do not reply. For support, contact us at support@carbonprospect.com

© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.
Sydney, NSW, Australia`
    };

    try {
      await sgMail.send(msg);
      console.log('Verification email sent successfully');
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Carbon Prospect'
      },
      replyTo: 'support@carbonprospect.com',
      subject: 'Reset Your Carbon Prospect Password',
      categories: ['password-reset', 'transactional'],
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      },
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Preheader text for inbox preview -->
            <div style="display: none; max-height: 0; overflow: hidden;">
              Reset your Carbon Prospect password - this link expires in 1 hour
            </div>
            
            <h1 style="color: #2E7D32;">Password Reset Request</h1>
            <p>Hi there,</p>
            <p>We received a request to reset your password for your Carbon Prospect account. Click the button below to create a new password:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${resetUrl}" 
                 style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            <p style="color: #666; margin-top: 30px;"><strong>This link will expire in 1 hour for security reasons.</strong></p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px;">
              If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.
            </p>
            <p style="color: #999; font-size: 14px;">
              This is an automated message, please do not reply. For support, contact us at support@carbonprospect.com
            </p>
            
            <!-- Footer with physical address -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.</p>
              <p>Sydney, NSW, Australia</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
                <a href="${process.env.FRONTEND_URL}/terms" style="color: #999;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Password Reset Request

Hi there,

We received a request to reset your password for your Carbon Prospect account.

Click here to reset your password: ${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.

This is an automated message, please do not reply. For support, contact us at support@carbonprospect.com

© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.
Sydney, NSW, Australia`
    };

    try {
      await sgMail.send(msg);
      console.log('Password reset email sent successfully');
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  // Send welcome email after successful verification
  async sendWelcomeEmail(email, userName) {
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Carbon Prospect'
      },
      replyTo: 'support@carbonprospect.com',
      subject: 'Welcome to Carbon Prospect - Account Verified!',
      categories: ['welcome', 'transactional'],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <!-- Preheader text -->
            <div style="display: none; max-height: 0; overflow: hidden;">
              Your account is verified! Start exploring Carbon Prospect marketplace
            </div>
            
            <h1 style="color: #2E7D32;">Welcome to Carbon Prospect, ${userName}!</h1>
            <p>Congratulations! Your email has been successfully verified. You now have full access to the Carbon Marketplace.</p>
            <h2 style="color: #333; font-size: 20px;">What you can do now:</h2>
            <ul style="line-height: 1.8; color: #555;">
              <li>Browse carbon credit projects and solutions</li>
              <li>List your own carbon reduction solutions</li>
              <li>Connect with project developers and solution providers</li>
              <li>Track your carbon impact</li>
            </ul>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL}/dashboard" 
                 style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Quick Tips:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Complete your profile to increase visibility</li>
                <li>Add noreply@carbonprospect.com to your contacts</li>
                <li>Check out our featured projects</li>
              </ul>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Need help? Contact us at support@carbonprospect.com</p>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.</p>
              <p>Sydney, NSW, Australia</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
                <a href="${process.env.FRONTEND_URL}/terms" style="color: #999;">Terms of Service</a> |
                <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #999;">Email Preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Welcome to Carbon Prospect, ${userName}!

Congratulations! Your email has been successfully verified. You now have full access to the Carbon Marketplace.

What you can do now:
- Browse carbon credit projects and solutions
- List your own carbon reduction solutions
- Connect with project developers and solution providers
- Track your carbon impact

Go to your dashboard: ${process.env.FRONTEND_URL}/dashboard

Quick Tips:
- Complete your profile to increase visibility
- Add noreply@carbonprospect.com to your contacts
- Check out our featured projects

Need help? Contact us at support@carbonprospect.com

© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.
Sydney, NSW, Australia`
    };

    try {
      await sgMail.send(msg);
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw error;
    }
  },

  // Send transaction notification email
  async sendTransactionEmail(email, transactionDetails) {
    const { type, amount, projectName, transactionId } = transactionDetails;
    
    const msg = {
      to: email,
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Carbon Prospect'
      },
      replyTo: 'support@carbonprospect.com',
      subject: `Carbon Credit ${type === 'purchase' ? 'Purchase' : 'Sale'} Confirmation`,
      categories: ['transaction', 'transactional'],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2E7D32;">Transaction Confirmed</h1>
            <p>Your carbon credit ${type} has been successfully processed.</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Transaction Details:</h3>
              <p><strong>Transaction ID:</strong> ${transactionId}</p>
              <p><strong>Project:</strong> ${projectName}</p>
              <p><strong>Amount:</strong> ${amount} credits</p>
              <p><strong>Type:</strong> ${type === 'purchase' ? 'Purchase' : 'Sale'}</p>
            </div>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL}/transactions/${transactionId}" 
                 style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Transaction
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 14px;">Questions about this transaction? Contact us at support@carbonprospect.com</p>
            
            <!-- Footer -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
              <p>© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.</p>
              <p>Sydney, NSW, Australia</p>
              <p>
                <a href="${process.env.FRONTEND_URL}/privacy" style="color: #999;">Privacy Policy</a> | 
                <a href="${process.env.FRONTEND_URL}/terms" style="color: #999;">Terms of Service</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Transaction Confirmed

Your carbon credit ${type} has been successfully processed.

Transaction Details:
- Transaction ID: ${transactionId}
- Project: ${projectName}
- Amount: ${amount} credits
- Type: ${type === 'purchase' ? 'Purchase' : 'Sale'}

View transaction: ${process.env.FRONTEND_URL}/transactions/${transactionId}

Questions about this transaction? Contact us at support@carbonprospect.com

© ${new Date().getFullYear()} Carbon Prospect. All rights reserved.
Sydney, NSW, Australia`
    };

    try {
      await sgMail.send(msg);
      console.log('Transaction email sent successfully');
    } catch (error) {
      console.error('Error sending transaction email:', error);
      throw error;
    }
  },

  // Send contact form email
  async sendContactEmail(fromEmail, fromName, subject, message) {
    const msg = {
      to: 'support@carbonprospect.com',
      from: {
        email: process.env.EMAIL_FROM,
        name: 'Carbon Prospect Contact Form'
      },
      replyTo: fromEmail,
      subject: `Contact Form: ${subject}`,
      categories: ['contact-form', 'internal'],
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2E7D32;">New Contact Form Submission</h2>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>From:</strong> ${fromName} (${fromEmail})</p>
              <p><strong>Subject:</strong> ${subject}</p>
            </div>
            <h3>Message:</h3>
            <div style="background-color: #fff; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
              <p style="white-space: pre-wrap;">${message}</p>
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Reply directly to this email to respond to ${fromName}.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `New Contact Form Submission

From: ${fromName} (${fromEmail})
Subject: ${subject}

Message:
${message}

Reply directly to this email to respond to ${fromName}.`
    };

    try {
      await sgMail.send(msg);
      console.log('Contact form email sent successfully');
    } catch (error) {
      console.error('Error sending contact form email:', error);
      throw error;
    }
  }
};

module.exports = emailService;