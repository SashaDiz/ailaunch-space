import { getSupabaseAdmin } from './supabase.js';
import { notificationService } from './email.js';

/**
 * Comprehensive notification management service
 * Handles user preferences, database tracking, and email sending
 */
class NotificationManager {
  constructor() {
    this.supabase = getSupabaseAdmin();
  }

  /**
   * Send notification with user preference checking and database tracking
   * @param {Object} params - Notification parameters
   * @param {string} params.userId - User ID
   * @param {string} params.emailType - Type of email notification
   * @param {string} params.userEmail - User's email address
   * @param {Object} params.data - Email template data
   * @param {string} params.appId - Related app ID (optional)
   * @param {string} params.competitionId - Related competition ID (optional)
   * @param {Object} params.metadata - Additional metadata (optional)
   */
  async sendNotification({
    userId,
    emailType,
    userEmail,
    data,
    appId = null,
    competitionId = null,
    metadata = {}
  }) {
    try {
      // Define mandatory notifications that cannot be disabled
      const mandatoryNotifications = [
        'account_creation',
        'account_deletion', 
        'submission_approval',
        'submission_decline'
      ];

      // Check if user has this notification type enabled (skip check for mandatory notifications)
      if (!mandatoryNotifications.includes(emailType)) {
        const userPreferences = await this.getUserNotificationPreferences(userId);
        
        if (!userPreferences[emailType]) {
          console.log(`Notification ${emailType} disabled for user ${userId}`);
          return { success: false, reason: 'notification_disabled' };
        }
      }

      // Create notification record in database
      const notificationRecord = await this.createNotificationRecord({
        userId,
        emailType,
        appId,
        competitionId,
        metadata
      });

      // Send the email
      const emailResult = await this.sendEmailNotification(emailType, userEmail, data);

      // Update notification record with result
      await this.updateNotificationRecord(notificationRecord.id, {
        status: emailResult.success ? 'sent' : 'failed',
        sent_at: emailResult.success ? new Date().toISOString() : null,
        error_message: emailResult.error || null,
        resend_email_id: emailResult.data?.id || null
      });

      return emailResult;
    } catch (error) {
      console.error('Notification service error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user notification preferences
   * @param {string} userId - User ID
   */
  async getUserNotificationPreferences(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user preferences:', error);
        // Return default preferences if user not found
        return this.getDefaultPreferences();
      }

      return data?.notification_preferences || this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user notification preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   */
  async updateUserNotificationPreferences(userId, preferences) {
    try {
      const { error } = await this.supabase
        .from('users')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create notification record in database
   * @param {Object} params - Notification parameters
   */
  async createNotificationRecord({ userId, emailType, appId, competitionId, metadata }) {
    try {
      const { data, error } = await this.supabase
        .from('email_notifications')
        .insert({
          user_id: userId,
          email_type: emailType,
          app_id: appId,
          competition_id: competitionId,
          metadata: metadata,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating notification record:', error);
      throw error;
    }
  }

  /**
   * Update notification record
   * @param {string} notificationId - Notification ID
   * @param {Object} updates - Updates to apply
   */
  async updateNotificationRecord(notificationId, updates) {
    try {
      const { error } = await this.supabase
        .from('email_notifications')
        .update(updates)
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating notification record:', error);
      throw error;
    }
  }

  /**
   * Send email notification using the appropriate service
   * @param {string} emailType - Type of email
   * @param {string} userEmail - User's email
   * @param {Object} data - Email data
   */
  async sendEmailNotification(emailType, userEmail, data) {
    const serviceMap = {
      'account_creation': 'accountCreation',
      'account_deletion': 'accountDeletion',
      'weekly_competition_entry': 'weeklyCompetitionEntry',
      'submission_approval': 'submissionApproval',
      'submission_decline': 'submissionDecline',
      'competition_winners': 'competitionWinners',
      'winner_reminder': 'winnerReminder'
    };

    const serviceMethod = serviceMap[emailType];
    if (!serviceMethod) {
      throw new Error(`Unknown email type: ${emailType}`);
    }

    return await notificationService[serviceMethod](userEmail, data);
  }

  /**
   * Get default notification preferences
   */
  getDefaultPreferences() {
    return {
      account_creation: true, // Mandatory - always enabled
      account_deletion: true, // Mandatory - always enabled
      weekly_competition_entry: true,
      submission_approval: true, // Mandatory - always enabled
      submission_decline: true, // Mandatory - always enabled
      competition_winners: true,
      winner_reminder: true,
      weekly_digest: false,
      marketing_emails: false
    };
  }

  /**
   * Get mandatory notification types that cannot be disabled
   */
  getMandatoryNotifications() {
    return [
      'account_creation',
      'account_deletion',
      'submission_approval',
      'submission_decline'
    ];
  }

  /**
   * Send account creation notification
   * @param {Object} user - User data
   */
  async sendAccountCreationNotification(user) {
    return await this.sendNotification({
      userId: user.id,
      emailType: 'account_creation',
      userEmail: user.email,
      data: {
        userName: user.full_name || user.first_name || user.email.split('@')[0],
        userEmail: user.email
      }
    });
  }

  /**
   * Send account deletion notification
   * @param {Object} user - User data
   */
  async sendAccountDeletionNotification(user) {
    return await this.sendNotification({
      userId: user.id,
      emailType: 'account_deletion',
      userEmail: user.email,
      data: {
        userName: user.full_name || user.first_name || user.email.split('@')[0]
      }
    });
  }

  /**
   * Send weekly competition entry notification
   * @param {Object} params - Parameters
   */
  async sendWeeklyCompetitionEntryNotification({ userId, userEmail, project, competition }) {
    return await this.sendNotification({
      userId,
      emailType: 'weekly_competition_entry',
      userEmail,
      appId: project.id,
      competitionId: competition.id,
      data: {
        projectName: project.name,
        slug: project.slug,
        competitionWeek: competition.competition_id,
        endDate: new Date(competition.end_date).toLocaleDateString()
      }
    });
  }

  /**
   * Send weekly competition entry notification for multiple projects (grouped per user)
   * Uses the same preference key 'weekly_competition_entry'
   */
  async sendWeeklyCompetitionEntryBatch({ userId, userEmail, projects, competition }) {
    return await this.sendNotification({
      userId,
      emailType: 'weekly_competition_entry',
      userEmail,
      competitionId: competition.id,
      data: {
        projects: projects.map(p => ({ id: p.id, name: p.name, slug: p.slug })),
        competitionWeek: competition.competition_id,
        endDate: new Date(competition.end_date).toLocaleDateString()
      },
      metadata: { batched: true, projectCount: projects.length }
    });
  }

  /**
   * Send submission approval notification
   * @param {Object} params - Parameters
   */
  async sendSubmissionApprovalNotification({ userId, userEmail, project }) {
    return await this.sendNotification({
      userId,
      emailType: 'submission_approval',
      userEmail,
      appId: project.id,
      data: {
        projectName: project.name,
        slug: project.slug
      }
    });
  }

  /**
   * Send submission decline notification
   * @param {Object} params - Parameters
   */
  async sendSubmissionDeclineNotification({ userId, userEmail, project, rejectionReason }) {
    return await this.sendNotification({
      userId,
      emailType: 'submission_decline',
      userEmail,
      appId: project.id,
      data: {
        projectName: project.name,
        slug: project.slug,
        rejectionReason
      }
    });
  }

  /**
   * Send competition winner notification
   * @param {Object} params - Parameters
   */
  async sendCompetitionWinnerNotification({ userId, userEmail, project, competition, position }) {
    return await this.sendNotification({
      userId,
      emailType: 'competition_winners',
      userEmail,
      appId: project.id,
      competitionId: competition.id,
      data: {
        projectName: project.name,
        slug: project.slug,
        position,
        competitionType: competition.type,
        totalVotes: project.upvotes,
        totalViews: project.views
      }
    });
  }

  /**
   * Send winner reminder notification
   * @param {Object} params - Parameters
   */
  async sendWinnerReminderNotification({ userId, userEmail, project, position }) {
    return await this.sendNotification({
      userId,
      emailType: 'winner_reminder',
      userEmail,
      appId: project.id,
      data: {
        projectName: project.name,
        slug: project.slug,
        position
      }
    });
  }

  /**
   * Send notifications to multiple users (batch)
   * @param {Array} recipients - Array of recipient objects
   * @param {string} emailType - Type of email
   * @param {Function} dataMapper - Function to map recipient to email data
   */
  async sendBatchNotifications(recipients, emailType, dataMapper) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const data = dataMapper(recipient);
        const result = await this.sendNotification({
          userId: recipient.id,
          emailType,
          userEmail: recipient.email,
          data,
          appId: recipient.appId || null,
          competitionId: recipient.competitionId || null
        });
        
        results.push({
          userId: recipient.id,
          email: recipient.email,
          ...result
        });
      } catch (error) {
        console.error(`Error sending notification to ${recipient.email}:`, error);
        results.push({
          userId: recipient.id,
          email: recipient.email,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get notification history for a user
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   */
  async getUserNotificationHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, emailType = null } = options;
      
      let query = this.supabase
        .from('email_notifications')
        .select(`
          *,
          apps!email_notifications_app_id_fkey(name, slug),
          competitions!email_notifications_competition_id_fkey(competition_id, type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (emailType) {
        query = query.eq('email_type', emailType);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error getting notification history:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager();
export default notificationManager;
