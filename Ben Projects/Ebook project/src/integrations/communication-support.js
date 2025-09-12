/**
 * Communication & Support Integration
 * Customer support, email workflows, notifications, and community features
 */

import axios from 'axios';
import { User } from '../models/User.js';
import { SupportTicket } from '../models/SupportTicket.js';
import { Analytics } from '../models/Analytics.js';

class CommunicationSupportService {
  constructor() {
    this.services = {
      sendgrid: {
        apiUrl: 'https://api.sendgrid.com/v3',
        apiKey: process.env.SENDGRID_API_KEY
      },
      intercom: {
        apiUrl: 'https://api.intercom.io',
        accessToken: process.env.INTERCOM_ACCESS_TOKEN
      },
      slack: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: process.env.SLACK_SUPPORT_CHANNEL || '#support'
      },
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER
      }
    };
    
    this.emailTemplates = {
      welcome: 'd-welcome-template-id',
      trialEnding: 'd-trial-ending-template-id',
      paymentFailed: 'd-payment-failed-template-id',
      bookCompleted: 'd-book-completed-template-id',
      weeklyDigest: 'd-weekly-digest-template-id',
      supportTicketCreated: 'd-support-ticket-created-template-id',
      supportTicketResolved: 'd-support-ticket-resolved-template-id'
    };
    
    this.notificationTypes = {
      email: 'email',
      inApp: 'in_app',
      push: 'push',
      sms: 'sms'
    };
  }
  
  // Email Marketing & Automation
  async sendEmail(to, templateId, templateData, options = {}) {
    try {
      const emailData = {
        from: {
          email: options.fromEmail || process.env.FROM_EMAIL || 'noreply@ai-ebook-platform.com',
          name: options.fromName || 'AI Ebook Platform'
        },
        personalizations: [{
          to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
          dynamic_template_data: {
            ...templateData,
            platform_name: 'AI Ebook Platform',
            support_email: 'support@ai-ebook-platform.com',
            unsubscribe_url: `${process.env.FRONTEND_URL}/unsubscribe`,
            current_year: new Date().getFullYear()
          }
        }],
        template_id: templateId,
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
          subscription_tracking: { enable: true }
        }
      };
      
      if (options.categories) {
        emailData.categories = options.categories;
      }
      
      const response = await axios.post(
        `${this.services.sendgrid.apiUrl}/mail/send`,
        emailData,
        {
          headers: {
            'Authorization': `Bearer ${this.services.sendgrid.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return {
        success: true,
        messageId: response.headers['x-message-id'],
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }
  
  async sendWelcomeEmail(user) {
    return await this.sendEmail(
      user.email,
      this.emailTemplates.welcome,
      {
        user_name: user.profile.firstName || 'there',
        login_url: `${process.env.FRONTEND_URL}/login`,
        dashboard_url: `${process.env.FRONTEND_URL}/app/dashboard`,
        getting_started_url: `${process.env.FRONTEND_URL}/getting-started`
      },
      {
        categories: ['welcome', 'onboarding']
      }
    );
  }
  
  async sendTrialEndingEmail(user, daysLeft) {
    return await this.sendEmail(
      user.email,
      this.emailTemplates.trialEnding,
      {
        user_name: user.profile.firstName || 'there',
        days_left: daysLeft,
        upgrade_url: `${process.env.FRONTEND_URL}/app/settings/billing`,
        features_url: `${process.env.FRONTEND_URL}/pricing`
      },
      {
        categories: ['trial', 'billing']
      }
    );
  }
  
  async sendPaymentFailedEmail(user, amount, nextAttempt) {
    return await this.sendEmail(
      user.email,
      this.emailTemplates.paymentFailed,
      {
        user_name: user.profile.firstName || 'there',
        amount: amount.toFixed(2),
        next_attempt: nextAttempt.toLocaleDateString(),
        update_payment_url: `${process.env.FRONTEND_URL}/app/settings/billing`,
        support_url: `${process.env.FRONTEND_URL}/support`
      },
      {
        categories: ['billing', 'payment_failed']
      }
    );
  }
  
  async sendBookCompletedEmail(user, book) {
    return await this.sendEmail(
      user.email,
      this.emailTemplates.bookCompleted,
      {
        user_name: user.profile.firstName || 'there',
        book_title: book.title,
        word_count: book.metadata.currentWordCount.toLocaleString(),
        export_url: `${process.env.FRONTEND_URL}/app/books/${book._id}/export`,
        share_url: `${process.env.FRONTEND_URL}/app/books/${book._id}/share`
      },
      {
        categories: ['achievement', 'book_completed']
      }
    );
  }
  
  async sendWeeklyDigest(user, digestData) {
    return await this.sendEmail(
      user.email,
      this.emailTemplates.weeklyDigest,
      {
        user_name: user.profile.firstName || 'there',
        words_written: digestData.wordsWritten.toLocaleString(),
        books_worked_on: digestData.booksWorkedOn,
        ai_generations_used: digestData.aiGenerationsUsed,
        achievements: digestData.achievements,
        dashboard_url: `${process.env.FRONTEND_URL}/app/dashboard`
      },
      {
        categories: ['digest', 'engagement']
      }
    );
  }
  
  // Support Ticketing System
  async createSupportTicket(userId, ticketData) {
    try {
      const user = await User.findById(userId);
      
      const ticket = await SupportTicket.create({
        userId,
        subject: ticketData.subject,
        description: ticketData.description,
        category: ticketData.category || 'general',
        priority: ticketData.priority || 'medium',
        status: 'open',
        metadata: {
          userAgent: ticketData.userAgent,
          url: ticketData.url,
          browserInfo: ticketData.browserInfo
        }
      });
      
      // Send confirmation email to user
      await this.sendEmail(
        user.email,
        this.emailTemplates.supportTicketCreated,
        {
          user_name: user.profile.firstName || 'there',
          ticket_id: ticket.ticketId,
          subject: ticket.subject,
          status_url: `${process.env.FRONTEND_URL}/app/support/tickets/${ticket._id}`
        },
        {
          categories: ['support', 'ticket_created']
        }
      );
      
      // Notify support team via Slack
      await this.notifySlack({
        channel: this.services.slack.channel,
        text: `New support ticket created`,
        attachments: [{
          color: 'warning',
          fields: [
            { title: 'Ticket ID', value: ticket.ticketId, short: true },
            { title: 'User', value: user.email, short: true },
            { title: 'Subject', value: ticket.subject, short: false },
            { title: 'Priority', value: ticket.priority, short: true },
            { title: 'Category', value: ticket.category, short: true }
          ]
        }]
      });
      
      // Track analytics
      await this.trackEvent(userId, 'support_ticket_created', {
        ticketId: ticket.ticketId,
        category: ticket.category,
        priority: ticket.priority
      });
      
      return ticket;
      
    } catch (error) {
      console.error('Support ticket creation failed:', error);
      throw error;
    }
  }
  
  async updateSupportTicket(ticketId, updates, updatedBy) {
    try {
      const ticket = await SupportTicket.findById(ticketId);
      
      if (!ticket) {
        throw new Error('Support ticket not found');
      }
      
      // Add update to history
      const updateEntry = {
        updatedBy,
        updatedAt: new Date(),
        changes: updates,
        comment: updates.comment || ''
      };
      
      const updatedTicket = await SupportTicket.findByIdAndUpdate(
        ticketId,
        {
          $set: {
            ...updates,
            lastUpdated: new Date()
          },
          $push: {
            history: updateEntry
          }
        },
        { new: true }
      );
      
      // If ticket is resolved, send notification
      if (updates.status === 'resolved') {
        const user = await User.findById(ticket.userId);
        
        await this.sendEmail(
          user.email,
          this.emailTemplates.supportTicketResolved,
          {
            user_name: user.profile.firstName || 'there',
            ticket_id: ticket.ticketId,
            subject: ticket.subject,
            resolution: updates.resolution || 'Your issue has been resolved.'
          },
          {
            categories: ['support', 'ticket_resolved']
          }
        );
      }
      
      return updatedTicket;
      
    } catch (error) {
      console.error('Support ticket update failed:', error);
      throw error;
    }
  }
  
  async getSupportTickets(userId, filters = {}) {
    try {
      const query = { userId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.category) {
        query.category = filters.category;
      }
      
      const tickets = await SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 20)
        .skip(filters.offset || 0);
      
      return tickets;
      
    } catch (error) {
      console.error('Failed to get support tickets:', error);
      throw error;
    }
  }
  
  // In-App Notifications
  async createNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      const notificationData = {
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        read: false,
        createdAt: new Date()
      };
      
      await User.findByIdAndUpdate(userId, {
        $push: { notifications: notificationData }
      });
      
      // Send real-time notification via WebSocket if connected
      // This would integrate with your WebSocket service
      
      return notificationData;
      
    } catch (error) {
      console.error('Notification creation failed:', error);
      throw error;
    }
  }
  
  async markNotificationAsRead(userId, notificationId) {
    try {
      await User.findOneAndUpdate(
        { 
          _id: userId,
          'notifications._id': notificationId
        },
        {
          $set: { 'notifications.$.read': true }
        }
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }
  
  async getNotifications(userId, unreadOnly = false) {
    try {
      const user = await User.findById(userId).select('notifications');
      
      let notifications = user.notifications || [];
      
      if (unreadOnly) {
        notifications = notifications.filter(n => !n.read);
      }
      
      return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    } catch (error) {
      console.error('Failed to get notifications:', error);
      throw error;
    }
  }
  
  // Slack Integration
  async notifySlack(message) {
    try {
      if (!this.services.slack.webhookUrl) {
        console.warn('Slack webhook URL not configured');
        return;
      }
      
      await axios.post(this.services.slack.webhookUrl, message);
      
    } catch (error) {
      console.error('Slack notification failed:', error);
    }
  }
  
  // SMS Notifications (via Twilio)
  async sendSMS(to, message) {
    try {
      if (!this.services.twilio.accountSid) {
        console.warn('Twilio not configured');
        return;
      }
      
      const twilio = require('twilio')(
        this.services.twilio.accountSid,
        this.services.twilio.authToken
      );
      
      const result = await twilio.messages.create({
        body: message,
        from: this.services.twilio.fromNumber,
        to: to
      });
      
      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
      
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }
  
  // Community Features
  async createFeedbackRequest(userId, bookId, feedbackType = 'general') {
    try {
      const user = await User.findById(userId);
      const book = await Book.findById(bookId);
      
      const feedbackRequest = {
        id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        bookId,
        bookTitle: book.title,
        type: feedbackType,
        status: 'active',
        createdAt: new Date(),
        responses: []
      };
      
      // Store feedback request (you might want a separate collection)
      await User.findByIdAndUpdate(userId, {
        $push: { feedbackRequests: feedbackRequest }
      });
      
      return feedbackRequest;
      
    } catch (error) {
      console.error('Feedback request creation failed:', error);
      throw error;
    }
  }
  
  async submitFeedback(feedbackRequestId, reviewerId, feedback) {
    try {
      const feedbackResponse = {
        reviewerId,
        feedback: feedback.text,
        rating: feedback.rating,
        suggestions: feedback.suggestions || [],
        submittedAt: new Date()
      };
      
      await User.findOneAndUpdate(
        { 'feedbackRequests.id': feedbackRequestId },
        {
          $push: { 'feedbackRequests.$.responses': feedbackResponse }
        }
      );
      
      // Notify the book author
      const feedbackRequest = await User.findOne(
        { 'feedbackRequests.id': feedbackRequestId },
        { 'feedbackRequests.$': 1 }
      );
      
      if (feedbackRequest) {
        await this.createNotification(feedbackRequest.feedbackRequests[0].userId, {
          type: 'feedback',
          title: 'New Feedback Received',
          message: `You received new feedback on "${feedbackRequest.feedbackRequests[0].bookTitle}"`,
          actionUrl: `/app/books/${feedbackRequest.feedbackRequests[0].bookId}/feedback`
        });
      }
      
      return feedbackResponse;
      
    } catch (error) {
      console.error('Feedback submission failed:', error);
      throw error;
    }
  }
  
  // Automated Workflows
  async setupUserOnboardingWorkflow(userId) {
    try {
      const user = await User.findById(userId);
      
      // Schedule welcome email (immediate)
      await this.sendWelcomeEmail(user);
      
      // Schedule follow-up emails
      const workflows = [
        {
          delay: 24 * 60 * 60 * 1000, // 24 hours
          action: 'send_getting_started_tips'
        },
        {
          delay: 3 * 24 * 60 * 60 * 1000, // 3 days
          action: 'send_first_book_encouragement'
        },
        {
          delay: 7 * 24 * 60 * 60 * 1000, // 7 days
          action: 'send_feature_highlights'
        }
      ];
      
      // In production, you'd use a job queue like Bull or Agenda
      workflows.forEach(workflow => {
        setTimeout(async () => {
          await this.executeWorkflowAction(userId, workflow.action);
        }, workflow.delay);
      });
      
    } catch (error) {
      console.error('Onboarding workflow setup failed:', error);
    }
  }
  
  async executeWorkflowAction(userId, action) {
    try {
      const user = await User.findById(userId);
      
      switch (action) {
        case 'send_getting_started_tips':
          await this.sendEmail(
            user.email,
            'getting-started-tips-template-id',
            {
              user_name: user.profile.firstName || 'there',
              tips_url: `${process.env.FRONTEND_URL}/tips`
            }
          );
          break;
          
        case 'send_first_book_encouragement':
          // Check if user has created a book
          const bookCount = await Book.countDocuments({ userId });
          if (bookCount === 0) {
            await this.sendEmail(
              user.email,
              'first-book-encouragement-template-id',
              {
                user_name: user.profile.firstName || 'there',
                create_book_url: `${process.env.FRONTEND_URL}/app/books/new`
              }
            );
          }
          break;
          
        case 'send_feature_highlights':
          await this.sendEmail(
            user.email,
            'feature-highlights-template-id',
            {
              user_name: user.profile.firstName || 'there',
              features_url: `${process.env.FRONTEND_URL}/features`
            }
          );
          break;
      }
      
    } catch (error) {
      console.error('Workflow action execution failed:', error);
    }
  }
  
  // Analytics and Tracking
  async trackEvent(userId, eventType, eventData) {
    try {
      await Analytics.create({
        userId,
        eventType,
        eventData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }
  
  async getCommunicationStats(userId) {
    try {
      const user = await User.findById(userId);
      const tickets = await SupportTicket.find({ userId });
      
      return {
        emailsSent: user.emailStats?.sent || 0,
        emailsOpened: user.emailStats?.opened || 0,
        emailsClicked: user.emailStats?.clicked || 0,
        supportTickets: {
          total: tickets.length,
          open: tickets.filter(t => t.status === 'open').length,
          resolved: tickets.filter(t => t.status === 'resolved').length
        },
        notifications: {
          total: user.notifications?.length || 0,
          unread: user.notifications?.filter(n => !n.read).length || 0
        }
      };
      
    } catch (error) {
      console.error('Failed to get communication stats:', error);
      throw error;
    }
  }
  
  // Health Check
  async healthCheck() {
    try {
      const checks = {
        sendgrid: false,
        slack: false,
        twilio: false
      };
      
      // Test SendGrid
      try {
        await axios.get(`${this.services.sendgrid.apiUrl}/user/profile`, {
          headers: { 'Authorization': `Bearer ${this.services.sendgrid.apiKey}` }
        });
        checks.sendgrid = true;
      } catch (error) {
        console.error('SendGrid health check failed:', error);
      }
      
      // Test Slack
      if (this.services.slack.webhookUrl) {
        try {
          await axios.post(this.services.slack.webhookUrl, {
            text: 'Health check test',
            channel: '#test'
          });
          checks.slack = true;
        } catch (error) {
          console.error('Slack health check failed:', error);
        }
      }
      
      // Test Twilio
      if (this.services.twilio.accountSid) {
        checks.twilio = true; // Basic check - Twilio doesn't have a simple health endpoint
      }
      
      return {
        status: Object.values(checks).every(check => check) ? 'healthy' : 'partial',
        services: checks,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('Communication service health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date()
      };
    }
  }
}

export default CommunicationSupportService;