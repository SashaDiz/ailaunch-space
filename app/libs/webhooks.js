import { db } from "./database.js";
import crypto from "crypto";

// Generate webhook signature for verification
export function generateWebhookSignature(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

// Webhook event dispatcher
export class WebhookDispatcher {
  constructor() {
    this.maxRetries = 3;
    this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
  }

  // Send webhook to all registered endpoints for a specific event
  async dispatch(eventType, data) {
    try {
      // Get all active webhooks that listen to this event
      // The events field is an array, so we need to use $contains
      const webhooks = await db.find("external_webhooks", {
        active: true,
        events: { $contains: [eventType] }
      });

      if (webhooks.length === 0) {
        console.log(`No webhooks registered for event: ${eventType}`);
        return;
      }

      console.log(`Dispatching ${eventType} to ${webhooks.length} webhook(s)`);

      // Send to each webhook concurrently
      const promises = webhooks.map(webhook => 
        this.sendWebhook(webhook, eventType, data)
      );

      const results = await Promise.allSettled(promises);
      
      // Log results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`Webhook dispatch complete: ${successful} successful, ${failed} failed`);

      return {
        total: webhooks.length,
        successful,
        failed,
        results
      };

    } catch (error) {
      console.error("Webhook dispatch error:", error);
      throw error;
    }
  }

  // Send individual webhook with retry logic
  async sendWebhook(webhook, eventType, data, retryCount = 0) {
    const payload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.webhook_id,
      data
    };

    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'AILaunchSpace-Webhook/1.0',
      'X-DH-Event': eventType,
      'X-DH-Webhook-ID': webhook.webhook_id,
      'X-DH-Timestamp': payload.timestamp
    };

    // Add signature for providers that support it
    if (webhook.secret) {
      headers['X-DH-Signature'] = generateWebhookSignature(
        JSON.stringify(payload), 
        webhook.secret
      );
    }

    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        timeout: 30000 // 30 second timeout
      });

      // Update webhook stats on success
      await this.updateWebhookStats(webhook.webhook_id, true, response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`Webhook sent successfully to ${webhook.url} (${response.status})`);
      return { success: true, status: response.status };

    } catch (error) {
      console.error('Webhook failed:', { url: webhook.url, error: error.message });

      // Retry logic
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount];
        console.log(`Retrying webhook in ${delay}ms (attempt ${retryCount + 1}/${this.maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.sendWebhook(webhook, eventType, data, retryCount + 1);
      }

      // Update webhook stats on final failure
      await this.updateWebhookStats(webhook.webhook_id, false, 0, error.message);
      throw error;
    }
  }

  // Update webhook statistics
  async updateWebhookStats(webhookId, success, statusCode, errorMessage = null) {
    try {
      const updateData = {
        $inc: { 
          'stats.total_sent': 1,
          [`stats.${success ? 'successful' : 'failed'}`]: 1
        },
        $set: { 
          'stats.last_sent': new Date(),
          updated_at: new Date()
        }
      };

      if (!success && errorMessage) {
        updateData.$set['stats.last_error'] = {
          message: errorMessage,
          timestamp: new Date(),
          status_code: statusCode
        };
      }

      await db.updateOne(
        "external_webhooks",
        { webhook_id: webhookId },
        updateData
      );

    } catch (error) {
      console.error("Failed to update webhook stats:", error);
    }
  }
}

// Create singleton instance
export const webhookDispatcher = new WebhookDispatcher();

// Convenience functions for common events
export const webhookEvents = {
  // Project events
  async projectCreated(projectData) {
    return webhookDispatcher.dispatch('project.created', {
      project: {
        id: projectData.id,
        name: projectData.name,
        slug: projectData.slug,
        url: projectData.website_url,
        categories: projectData.categories,
        plan: projectData.plan,
        status: projectData.status,
        created_at: projectData.createdAt
      }
    });
  },

  async projectApproved(projectData) {
    return webhookDispatcher.dispatch('project.approved', {
      project: {
        id: projectData.id,
        name: projectData.name,
        slug: projectData.slug,
        url: projectData.website_url,
        categories: projectData.categories,
        plan: projectData.plan,
        approved_at: projectData.publishedAt || new Date()
      }
    });
  },

  async projectRejected(projectData, reason) {
    return webhookDispatcher.dispatch('project.rejected', {
      project: {
        id: projectData.id,
        name: projectData.name,
        slug: projectData.slug,
        rejection_reason: reason
      }
    });
  },

  // Voting events
  async voteCast(voteData) {
    return webhookDispatcher.dispatch('vote.cast', {
      vote: {
        project_id: voteData.appId,
        user_id: voteData.userId,
        action: voteData.action,
        timestamp: new Date()
      }
    });
  },

  // Competition events
  async competitionWinner(competitionData, winners) {
    return webhookDispatcher.dispatch('competition.winner', {
      competition: {
        id: competitionData.id,
        type: competitionData.type,
        competition_id: competitionData.competition_id,
        end_date: competitionData.end_date
      },
      winners: winners.map(winner => ({
        project_id: winner.id,
        name: winner.name,
        slug: winner.slug,
        votes: winner.upvotes,
        position: winner.position
      }))
    });
  },

  // Newsletter events
  async newsletterSubscribe(email, source) {
    return webhookDispatcher.dispatch('newsletter.subscribe', {
      subscription: {
        email: email,
        source: source,
        timestamp: new Date()
      }
    });
  }
};

// Integration helpers for popular services
export const integrations = {
  // Slack integration
  formatSlackMessage(eventType, data) {
    const messages = {
      'project.created': {
        text: `🚀 New AI Project Submitted: ${data.project.name}`,
        attachments: [{
          color: 'good',
          fields: [
            { title: 'Name', value: data.project.name, short: true },
            { title: 'Plan', value: data.project.plan, short: true },
            { title: 'URL', value: data.project.url, short: false }
          ]
        }]
      },
      'project.approved': {
        text: `✅ AI Project Approved: ${data.project.name}`,
        attachments: [{
          color: 'good',
          fields: [
            { title: 'Name', value: data.project.name, short: true },
            { title: 'Plan', value: data.project.plan, short: true }
          ]
        }]
      },
      'competition.winner': {
        text: `🏆 Competition Winners Announced!`,
        attachments: [{
          color: 'warning',
          fields: data.winners.map(winner => ({
            title: `Position ${winner.position}`,
            value: `${winner.name} (${winner.votes} votes)`,
            short: true
          }))
        }]
      }
    };

    return messages[eventType] || {
      text: `📢 ${eventType}: ${JSON.stringify(data, null, 2)}`
    };
  },

  // Discord integration
  formatDiscordMessage(eventType, data) {
    const messages = {
      'project.created': {
        embeds: [{
          title: '🚀 New AI Project Submitted',
          description: data.project.name,
          color: 0x00ff00,
          fields: [
            { name: 'Plan', value: data.project.plan, inline: true },
            { name: 'Categories', value: data.project.categories?.join(', ') || 'None', inline: true },
            { name: 'URL', value: data.project.url }
          ],
          timestamp: new Date().toISOString()
        }]
      },
      'competition.winner': {
        embeds: [{
          title: '🏆 Competition Winners',
          description: `${data.competition.type} competition results`,
          color: 0xffd700,
          fields: data.winners.map(winner => ({
            name: `🥇 Position ${winner.position}`,
            value: `**${winner.name}** - ${winner.votes} votes`,
            inline: false
          })),
          timestamp: new Date().toISOString()
        }]
      }
    };

    return messages[eventType] || {
      embeds: [{
        title: eventType,
        description: JSON.stringify(data, null, 2),
        timestamp: new Date().toISOString()
      }]
    };
  }
};