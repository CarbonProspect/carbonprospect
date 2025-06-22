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
      from: process.env.EMAIL_FROM,
      subject: 'Verify Your Carbon Prospect Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E7D32;">Welcome to Carbon Prospect!</h1>
          <p>Thank you for registering. Please verify your email address to complete your registration.</p>
          <div style="margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p style="color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px;">If you didn't create an account with Carbon Prospect, you can safely ignore this email.</p>
        </div>
      `,
      text: `Welcome to Carbon Prospect! 
      
Please verify your email address by clicking the link below:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account with Carbon Prospect, you can safely ignore this email.`
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
      from: process.env.EMAIL_FROM,
      subject: 'Reset Your Carbon Prospect Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E7D32;">Password Reset Request</h1>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p style="color: #666; margin-top: 30px;">This link will expire in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.</p>
        </div>
      `,
      text: `Password Reset Request

We received a request to reset your password. Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password won't be changed.`
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
      from: process.env.EMAIL_FROM,
      subject: 'Welcome to Carbon Prospect - Account Verified!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E7D32;">Welcome to Carbon Prospect, ${userName}!</h1>
          <p>Your email has been successfully verified. You now have full access to the Carbon Marketplace.</p>
          <h2 style="color: #333;">What you can do now:</h2>
          <ul style="line-height: 1.8;">
            <li>Browse carbon credit projects</li>
            <li>List your own carbon credits for sale</li>
            <li>Connect with buyers and sellers</li>
            <li>Track your transactions</li>
          </ul>
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/dashboard" 
               style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Go to Dashboard
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">Need help? Contact us at support@carbonprospect.com</p>
        </div>
      `,
      text: `Welcome to Carbon Prospect, ${userName}!

Your email has been successfully verified. You now have full access to the Carbon Marketplace.

What you can do now:
- Browse carbon credit projects
- List your own carbon credits for sale
- Connect with buyers and sellers
- Track your transactions

Go to your dashboard: ${process.env.FRONTEND_URL}/dashboard

Need help? Contact us at support@carbonprospect.com`
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
      from: process.env.EMAIL_FROM,
      subject: `Carbon Credit ${type === 'purchase' ? 'Purchase' : 'Sale'} Confirmation`,
      html: `
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
          <div style="margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL}/transactions/${transactionId}" 
               style="background-color: #2E7D32; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Transaction
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #666; font-size: 14px;">Questions about this transaction? Contact us at support@carbonprospect.com</p>
        </div>
      `,
      text: `Transaction Confirmed

Your carbon credit ${type} has been successfully processed.

Transaction Details:
- Transaction ID: ${transactionId}
- Project: ${projectName}
- Amount: ${amount} credits
- Type: ${type === 'purchase' ? 'Purchase' : 'Sale'}

View transaction: ${process.env.FRONTEND_URL}/transactions/${transactionId}

Questions about this transaction? Contact us at support@carbonprospect.com`
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
      from: process.env.EMAIL_FROM,
      replyTo: fromEmail,
      subject: `Contact Form: ${subject}`,
      html: `
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