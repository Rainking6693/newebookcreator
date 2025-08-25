const nodemailer = require('nodemailer');
const { logger } = require('../middleware/errorHandler');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      pool: true, // Use connection pooling
      maxConnections: 5,
      maxMessages: 100,
      rateLimit: 10 // Max 10 emails per second
    });

    this.defaultFromAddress = process.env.EMAIL_FROM || 'StartupNamer.ai <noreply@startupnamer.ai>';
    this.supportEmail = process.env.SUPPORT_EMAIL || 'support@startupnamer.ai';

    // Verify transporter configuration
    this.verifyConnection();
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Email service connection verified');
    } catch (error) {
      logger.error('❌ Email service connection failed:', error.message);
    }
  }

  // Master-level welcome email with verification
  async sendWelcomeEmail(email, firstName, verificationToken) {
    try {
      const verificationUrl = `${process.env.CLIENT_URL || 'https://startupnamer.ai'}/verify-email?token=${verificationToken}`;

      const htmlContent = this.generateWelcomeEmailHTML(firstName, verificationUrl);
      const textContent = this.generateWelcomeEmailText(firstName, verificationUrl);

      const mailOptions = {
        from: this.defaultFromAddress,
        to: email,
        subject: '🚀 Welcome to StartupNamer.ai - Verify Your Email',
        html: htmlContent,
        text: textContent,
        headers: {
          'List-Unsubscribe': `<${process.env.CLIENT_URL}/unsubscribe>`,
          'X-Campaign': 'welcome-sequence'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Welcome email sent successfully', {
        messageId: result.messageId,
        email,
        firstName
      });

      return result;

    } catch (error) {
      logger.error('Welcome email failed', {
        email,
        firstName,
        error: error.message
      });
      throw error;
    }
  }

  // Payment confirmation email with receipt
  async sendPaymentConfirmation(email, customerName, paymentDetails) {
    try {
      const { packageId, amount, sessionId, nameCount } = paymentDetails;
      const amountFormatted = `$${(amount / 100).toFixed(2)}`;

      const htmlContent = this.generatePaymentConfirmationHTML(
        customerName,
        packageId,
        amountFormatted,
        sessionId,
        nameCount
      );

      const textContent = this.generatePaymentConfirmationText(
        customerName,
        packageId,
        amountFormatted,
        sessionId,
        nameCount
      );

      const mailOptions = {
        from: this.defaultFromAddress,
        to: email,
        subject: `✅ Payment Confirmed - Your ${nameCount} Startup Names Are Ready!`,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Campaign': 'payment-confirmation'
        },
        attachments: [
          {
            filename: 'receipt.json',
            content: JSON.stringify(paymentDetails, null, 2),
            contentType: 'application/json'
          }
        ]
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Payment confirmation email sent', {
        messageId: result.messageId,
        email,
        sessionId,
        amount
      });

      return result;

    } catch (error) {
      logger.error('Payment confirmation email failed', {
        email,
        paymentDetails,
        error: error.message
      });
      throw error;
    }
  }

  // Payment failure notification
  async sendPaymentFailureNotification(email, customerName, errorMessage) {
    try {
      const htmlContent = this.generatePaymentFailureHTML(customerName, errorMessage);
      const textContent = this.generatePaymentFailureText(customerName, errorMessage);

      const mailOptions = {
        from: this.defaultFromAddress,
        to: email,
        subject: '❌ Payment Issue - Let\'s Get Your Startup Names',
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Campaign': 'payment-failure'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Payment failure notification sent', {
        messageId: result.messageId,
        email,
        errorMessage
      });

      return result;

    } catch (error) {
      logger.error('Payment failure notification failed', {
        email,
        error: error.message
      });
      throw error;
    }
  }

  // Names delivery email with PDF attachment
  async sendNamesDelivery(email, customerName, sessionData, pdfBuffer) {
    try {
      const { sessionId, nameCount, packageId } = sessionData;

      const htmlContent = this.generateNamesDeliveryHTML(
        customerName,
        nameCount,
        packageId,
        sessionId
      );

      const textContent = this.generateNamesDeliveryText(
        customerName,
        nameCount,
        packageId,
        sessionId
      );

      const mailOptions = {
        from: this.defaultFromAddress,
        to: email,
        subject: `🎯 Your ${nameCount} Startup Names Are Here!`,
        html: htmlContent,
        text: textContent,
        attachments: [
          {
            filename: `startup-names-${sessionId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ],
        headers: {
          'X-Campaign': 'names-delivery'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Names delivery email sent', {
        messageId: result.messageId,
        email,
        sessionId,
        nameCount
      });

      return result;

    } catch (error) {
      logger.error('Names delivery email failed', {
        email,
        sessionData,
        error: error.message
      });
      throw error;
    }
  }

  // Support ticket confirmation
  async sendSupportTicketConfirmation(email, customerName, ticketId, message) {
    try {
      const htmlContent = this.generateSupportTicketHTML(customerName, ticketId, message);
      const textContent = this.generateSupportTicketText(customerName, ticketId, message);

      const mailOptions = {
        from: this.defaultFromAddress,
        to: email,
        cc: this.supportEmail,
        subject: `🎫 Support Ticket #${ticketId} - We're Here to Help`,
        html: htmlContent,
        text: textContent,
        headers: {
          'X-Campaign': 'support-ticket'
        }
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Support ticket confirmation sent', {
        messageId: result.messageId,
        email,
        ticketId
      });

      return result;

    } catch (error) {
      logger.error('Support ticket email failed', {
        email,
        ticketId,
        error: error.message
      });
      throw error;
    }
  }

  // Generate HTML templates
  generateWelcomeEmailHTML(firstName, verificationUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to StartupNamer.ai</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .features { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .feature-list { list-style: none; padding: 0; }
        .feature-list li { padding: 8px 0; border-bottom: 1px solid #eee; }
        .feature-list li:before { content: "✨"; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Welcome to StartupNamer.ai</h1>
        <p>The AI-powered startup naming authority</p>
    </div>
    
    <div class="content">
        <h2>Hi ${firstName}!</h2>
        
        <p>Welcome to StartupNamer.ai - where perfect startup names are born through advanced AI technology and naming expertise.</p>
        
        <p>To get started and unlock your account, please verify your email address:</p>
        
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify My Email</a>
        </div>
        
        <div class="features">
            <h3>What you'll get with StartupNamer.ai:</h3>
            <ul class="feature-list">
                <li><strong>AI-Powered Generation:</strong> Advanced algorithms trained on successful startups</li>
                <li><strong>Domain Intelligence:</strong> Real-time availability checking across extensions</li>
                <li><strong>Brandability Analysis:</strong> Scientific scoring of name effectiveness</li>
                <li><strong>Industry Expertise:</strong> Specialized naming for your sector</li>
                <li><strong>Trademark Screening:</strong> Risk assessment for legal protection</li>
            </ul>
        </div>
        
        <p>Once verified, you'll have access to our powerful naming tools and expert guidance to find the perfect name for your startup.</p>
        
        <p>Need help? Just reply to this email or visit our <a href="https://startupnamer.ai/support">support center</a>.</p>
        
        <p>Best regards,<br>
        The StartupNamer.ai Team</p>
    </div>
    
    <div class="footer">
        <p>StartupNamer.ai - The Startup Naming Authority</p>
        <p>This email was sent to you because you signed up for StartupNamer.ai</p>
        <p><a href="#">Unsubscribe</a> | <a href="#">Privacy Policy</a></p>
    </div>
</body>
</html>`;
  }

  generateWelcomeEmailText(firstName, verificationUrl) {
    return `
Welcome to StartupNamer.ai, ${firstName}!

The AI-powered startup naming authority is here to help you find the perfect name for your startup.

To get started, please verify your email address by visiting:
${verificationUrl}

What you'll get with StartupNamer.ai:
- AI-Powered Generation - Advanced algorithms trained on successful startups
- Domain Intelligence - Real-time availability checking
- Brandability Analysis - Scientific scoring of name effectiveness  
- Industry Expertise - Specialized naming for your sector
- Trademark Screening - Risk assessment for legal protection

Need help? Just reply to this email or visit our support center at:
https://startupnamer.ai/support

Best regards,
The StartupNamer.ai Team

---
This email was sent to you because you signed up for StartupNamer.ai
Unsubscribe: [link] | Privacy Policy: [link]
`;
  }

  generatePaymentConfirmationHTML(customerName, packageId, amount, sessionId, nameCount) {
    const packageNames = {
      starter: 'Starter Package',
      professional: 'Professional Package', 
      enterprise: 'Enterprise Package'
    };

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmed - StartupNamer.ai</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .receipt-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .next-steps { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>✅ Payment Confirmed!</h1>
        <p>Your startup names are ready</p>
    </div>
    
    <div class="content">
        <h2>Thank you, ${customerName}!</h2>
        
        <p>Your payment has been successfully processed and your ${nameCount} AI-generated startup names are now available.</p>
        
        <div class="receipt-box">
            <h3>📋 Order Summary</h3>
            <p><strong>Package:</strong> ${packageNames[packageId] || packageId}</p>
            <p><strong>Amount Paid:</strong> ${amount}</p>
            <p><strong>Session ID:</strong> #${sessionId}</p>
            <p><strong>Names Generated:</strong> ${nameCount}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="https://startupnamer.ai/results/${sessionId}" class="button">View Your Names</a>
        </div>
        
        <div class="next-steps">
            <h3>🎯 Next Steps:</h3>
            <ol>
                <li>Review your personalized startup names</li>
                <li>Check domain availability and recommendations</li>
                <li>Download your comprehensive naming report</li>
                <li>Start building your brand with confidence!</li>
            </ol>
        </div>
        
        <p>Your names will remain accessible for 30 days. We recommend downloading your report for future reference.</p>
        
        <p>Need assistance? Our support team is here to help at <a href="mailto:support@startupnamer.ai">support@startupnamer.ai</a></p>
        
        <p>Best regards,<br>
        The StartupNamer.ai Team</p>
    </div>
</body>
</html>`;
  }

  generatePaymentConfirmationText(customerName, packageId, amount, sessionId, nameCount) {
    return `
Payment Confirmed - StartupNamer.ai

Thank you, ${customerName}!

Your payment has been successfully processed and your ${nameCount} AI-generated startup names are now available.

Order Summary:
- Package: ${packageId}
- Amount Paid: ${amount}
- Session ID: #${sessionId}
- Names Generated: ${nameCount}
- Date: ${new Date().toLocaleDateString()}

View your names at: https://startupnamer.ai/results/${sessionId}

Next Steps:
1. Review your personalized startup names
2. Check domain availability and recommendations  
3. Download your comprehensive naming report
4. Start building your brand with confidence!

Your names will remain accessible for 30 days.

Need assistance? Contact us at support@startupnamer.ai

Best regards,
The StartupNamer.ai Team
`;
  }

  // Additional template methods would continue here...
  generatePaymentFailureHTML(customerName, errorMessage) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Issue - StartupNamer.ai</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 20px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>❌ Payment Issue</h1>
        <p>Let's resolve this quickly</p>
    </div>
    
    <div class="content">
        <h2>Hi ${customerName}!</h2>
        
        <p>We encountered an issue processing your payment for your startup naming session.</p>
        
        <div class="error-box">
            <p><strong>Error:</strong> ${errorMessage}</p>
        </div>
        
        <p>Don't worry - this happens sometimes and is usually easy to fix. Common solutions:</p>
        <ul>
            <li>Check that your card has sufficient funds</li>
            <li>Verify your billing address matches your card</li>
            <li>Try a different payment method</li>
            <li>Contact your bank if the card was declined</li>
        </ul>
        
        <div style="text-align: center;">
            <a href="https://startupnamer.ai/checkout" class="button">Try Payment Again</a>
        </div>
        
        <p>Need help? Our support team is ready to assist you at <a href="mailto:support@startupnamer.ai">support@startupnamer.ai</a></p>
        
        <p>Best regards,<br>
        The StartupNamer.ai Team</p>
    </div>
</body>
</html>`;
  }

  generatePaymentFailureText(customerName, errorMessage) {
    return `
Payment Issue - StartupNamer.ai

Hi ${customerName}!

We encountered an issue processing your payment for your startup naming session.

Error: ${errorMessage}

Don't worry - this happens sometimes and is usually easy to fix. Common solutions:
- Check that your card has sufficient funds
- Verify your billing address matches your card  
- Try a different payment method
- Contact your bank if the card was declined

Try again at: https://startupnamer.ai/checkout

Need help? Contact us at support@startupnamer.ai

Best regards,
The StartupNamer.ai Team
`;
  }

  generateNamesDeliveryHTML(customerName, nameCount, packageId, sessionId) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Names Are Ready - StartupNamer.ai</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #8b5cf6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .highlight-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 Your Names Are Here!</h1>
        <p>${nameCount} AI-generated startup names delivered</p>
    </div>
    
    <div class="content">
        <h2>Hi ${customerName}!</h2>
        
        <p>Your ${nameCount} carefully crafted startup names are ready for review! Each name has been analyzed for brandability, domain availability, and market potential.</p>
        
        <div class="highlight-box">
            <p><strong>📎 Attached:</strong> Your comprehensive naming report (PDF)</p>
            <p><strong>📋 Package:</strong> ${packageId}</p>
            <p><strong>🎯 Session ID:</strong> #${sessionId}</p>
        </div>
        
        <div style="text-align: center;">
            <a href="https://startupnamer.ai/results/${sessionId}" class="button">View Online Results</a>
        </div>
        
        <p><strong>What's included in your report:</strong></p>
        <ul>
            <li>Complete name analysis and scoring</li>
            <li>Domain availability across extensions</li>
            <li>Trademark risk assessment</li>
            <li>Industry fit recommendations</li>
            <li>Next steps for brand development</li>
        </ul>
        
        <p>Ready to build your brand? Your perfect startup name is waiting!</p>
        
        <p>Best regards,<br>
        The StartupNamer.ai Team</p>
    </div>
</body>
</html>`;
  }

  generateNamesDeliveryText(customerName, nameCount, packageId, sessionId) {
    return `
Your Names Are Ready - StartupNamer.ai

Hi ${customerName}!

Your ${nameCount} carefully crafted startup names are ready for review! Each name has been analyzed for brandability, domain availability, and market potential.

Package: ${packageId}
Session ID: #${sessionId}

What's included in your report:
- Complete name analysis and scoring
- Domain availability across extensions  
- Trademark risk assessment
- Industry fit recommendations
- Next steps for brand development

View online at: https://startupnamer.ai/results/${sessionId}

Ready to build your brand? Your perfect startup name is waiting!

Best regards,
The StartupNamer.ai Team
`;
  }

  generateSupportTicketHTML(customerName, ticketId, message) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Ticket Received - StartupNamer.ai</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px; }
        .ticket-box { background: #f0f9ff; border: 1px solid #7dd3fc; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .message-box { background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 3px solid #06b6d4; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎫 Support Ticket Received</h1>
        <p>We're here to help you succeed</p>
    </div>
    
    <div class="content">
        <h2>Hi ${customerName}!</h2>
        
        <p>Thank you for contacting StartupNamer.ai support. We've received your message and assigned it ticket #${ticketId}.</p>
        
        <div class="ticket-box">
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>Status:</strong> Open</p>
            <p><strong>Priority:</strong> Normal</p>
            <p><strong>Expected Response:</strong> Within 24 hours</p>
        </div>
        
        <div class="message-box">
            <p><strong>Your Message:</strong></p>
            <p>${message}</p>
        </div>
        
        <p>Our support team will review your request and respond as soon as possible. We're committed to helping you find the perfect startup name!</p>
        
        <p><strong>In the meantime:</strong></p>
        <ul>
            <li>Check our <a href="https://startupnamer.ai/help">Help Center</a> for common questions</li>
            <li>Browse our <a href="https://startupnamer.ai/guides">Naming Guides</a> for expert tips</li>
            <li>Join our community for peer support and insights</li>
        </ul>
        
        <p>Best regards,<br>
        The StartupNamer.ai Support Team</p>
    </div>
</body>
</html>`;
  }

  generateSupportTicketText(customerName, ticketId, message) {
    return `
Support Ticket Received - StartupNamer.ai

Hi ${customerName}!

Thank you for contacting StartupNamer.ai support. We've received your message and assigned it ticket #${ticketId}.

Ticket Details:
- Ticket ID: #${ticketId}
- Status: Open
- Priority: Normal  
- Expected Response: Within 24 hours

Your Message:
${message}

Our support team will review your request and respond as soon as possible. We're committed to helping you find the perfect startup name!

In the meantime:
- Check our Help Center: https://startupnamer.ai/help
- Browse our Naming Guides: https://startupnamer.ai/guides
- Join our community for peer support and insights

Best regards,
The StartupNamer.ai Support Team
`;
  }
}

module.exports = new EmailService();