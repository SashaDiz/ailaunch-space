import { Resend } from 'resend';
import { siteConfig } from '@/config/site.config';
import { emailConfig, getFromAddress as getConfigFromAddress } from '@/config/email.config';
import {
  accountDeletedEmail, adEndingEmail, badgeRevokedEmail, badgeWarningEmail, newsletterWelcomeEmail,
  submissionApprovedEmail, submissionDeclinedEmail, submissionReceivedEmail, welcomeEmail,
} from '@/lib/email-templates';
import { getEmailPromo } from '@/lib/email-promo';
import { unsubscribeUrl } from '@/lib/unsubscribe-token';

// Lazy initialization to avoid build-time errors
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

const emailSite = () => ({
  name: siteConfig.name,
  url: siteConfig.url,
  contactEmail: siteConfig.contact.email,
});

const ctx = (data: any) => ({ site: emailSite(), promo: data?.promo });

// Email templates. Subjects take the data object; html is built by
// lib/email-templates.ts in the site's own style with Sponsored / Featured.
export const emailTemplates: Record<string, { subject: (data: any) => string; html: (data: any) => string }> = {
  accountCreation: {
    subject: () => `Welcome to ${siteConfig.name}`,
    html: (data) => welcomeEmail(data, ctx(data)),
  },
  accountDeletion: {
    subject: () => `Your ${siteConfig.name} account has been deleted`,
    html: (data) => accountDeletedEmail(data, ctx(data)),
  },
  submissionReceived: {
    subject: (data) => data.plan === 'premium'
      ? data.status === 'live'
        ? `${data.projectName} is live on ${siteConfig.name}`
        : `Finish the payment to publish ${data.projectName}`
      : `${data.projectName} is in the review queue`,
    html: (data) => submissionReceivedEmail(data, ctx(data)),
  },
  submissionApproval: {
    subject: (data) => `${data.projectName} is live on ${siteConfig.name}`,
    html: (data) => submissionApprovedEmail(data, ctx(data)),
  },
  submissionDecline: {
    subject: (data) => `${data.projectName} was not approved`,
    html: (data) => submissionDeclinedEmail(data, ctx(data)),
  },
  newsletterWelcome: {
    subject: (data) => data?.isResubscription
      ? `You're back on the ${siteConfig.name} list`
      : `You're subscribed to ${siteConfig.name}`,
    html: (data) => newsletterWelcomeEmail(data, ctx(data)),
  },
  adPlacementEnding: {
    subject: (data) => `Your ad for ${data.projectName} ends soon`,
    html: (data) => adEndingEmail(data, ctx(data)),
  },
  badgeRemoved: {
    subject: (data) => `Action required: restore the badge for ${data.projectName}`,
    html: (data) => badgeWarningEmail(data, ctx(data)),
  },
  badgeRevoked: {
    subject: (data) => `Your dofollow link for ${data.projectName} is now nofollow`,
    html: (data) => badgeRevokedEmail(data, ctx(data)),
  },
};

// Newsletter audience management
export const newsletterAudience = {
  async getOrCreateAudience() {
    try {
      const resendClient = getResend();
      if (!resendClient) {
        throw new Error('Resend client not initialized');
      }

      // Try to get existing audience
      const { data: audiences, error: listError } = await resendClient.audiences.list({
        limit: 50,
        offset: 0,
      });

      if (listError) {
        console.error('Error listing audiences:', listError);
        throw listError;
      }

      // Look for existing newsletter audience (try multiple possible names)
      const possibleNames = [`${siteConfig.name} Newsletter`, 'General', 'Newsletter'];
      const existingAudience = audiences.data?.find(audience => 
        possibleNames.includes(audience.name)
      );

      if (existingAudience) {
        return existingAudience.id;
      }

      // Create new audience if none exists
      const { data: newAudience, error: createError } = await resendClient.audiences.create({
        name: `${siteConfig.name} Newsletter`,
      });

      if (createError) {
        console.error('Error creating audience:', createError);
        throw createError;
      }

      return newAudience.id;
    } catch (error) {
      console.error('Audience management error:', error);
      throw error;
    }
  },

  async addContact(email, firstName = null, lastName = null) {
    try {
      const resendClient = getResend();
      if (!resendClient) {
        throw new Error('Resend client not initialized');
      }

      const audienceId = await this.getOrCreateAudience();

      // Check if contact already exists
      const { data: existingContact, error: getError } = await resendClient.contacts.get({
        audienceId,
        email,
      });

      if (existingContact) {
        return existingContact;
      }

      // Add new contact
      const { data: newContact, error: createError } = await resendClient.contacts.create({
        audienceId,
        email,
        firstName,
        lastName,
        unsubscribed: false,
      });

      if (createError) {
        console.error('Error adding contact to audience:', createError);
        throw createError;
      }

      return newContact;
    } catch (error) {
      console.error('Contact management error:', error);
      throw error;
    }
  },

  async removeContact(email) {
    try {
      const resendClient = getResend();
      if (!resendClient) {
        throw new Error('Resend client not initialized');
      }

      const audienceId = await this.getOrCreateAudience();

      const { data, error } = await resendClient.contacts.remove({
        audienceId,
        email,
      });

      if (error) {
        console.error('Error removing contact from audience:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Contact removal error:', error);
      throw error;
    }
  }
};

/**
 * Get the FROM address based on environment and configuration
 * Priority: RESEND_FROM_EMAIL > RESEND_PRODUCTION_FROM (prod) > RESEND_DEV_FROM (dev) > defaults
 */
const getFromAddress = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Highest priority: explicit override for any environment
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  
  // Production: use production FROM or the address on the domain verified in Resend
  if (!isDevelopment) {
    return process.env.RESEND_PRODUCTION_FROM || `${emailConfig.from.name} <${emailConfig.from.email}>`;
  }
  
  // Development: use dev FROM or default to sandbox
  return process.env.RESEND_DEV_FROM || `${siteConfig.name} <onboarding@resend.dev>`;
};

/**
 * Check if email redirect should be enabled in development
 * Controlled by RESEND_DEV_REDIRECT env var (defaults to 'true' for safety)
 */
const shouldRedirectInDev = () => {
  if (process.env.NODE_ENV !== 'development') {
    return false;
  }
  
  // Default to true for safety, but allow disabling via env var
  const redirectEnabled = process.env.RESEND_DEV_REDIRECT !== 'false';
  return redirectEnabled;
};

/**
 * Get the redirect email address for development
 */
const getDevRedirectEmail = () => {
  return process.env.RESEND_DEV_REDIRECT_TO || 'elkiwebdesign@gmail.com';
};

/**
 * Enhanced error handler with specific diagnostics
 */
const handleEmailError = (error, fromAddress, to) => {
  const errorDetails = {
    message: error.message,
    type: 'unknown',
    diagnostics: {},
    troubleshooting: []
  };

  // Check for API key errors
  if (error.message?.includes('API key') || error.message?.includes('Unauthorized') || error.status === 401) {
    errorDetails.type = 'api_key_error';
    errorDetails.diagnostics = {
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyLength: process.env.RESEND_API_KEY?.length || 0,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 3) || 'none'
    };
    errorDetails.troubleshooting = [
      'Verify RESEND_API_KEY is set in your environment variables',
      'Check that the API key is valid and not expired',
      'Ensure the API key has "sending_access" or "full_access" permissions',
      'Regenerate the API key in Resend dashboard if needed'
    ];
  }
  // Check for domain verification errors
  else if (error.message?.includes('domain') || error.message?.includes('not verified') || error.message?.includes('unverified')) {
    errorDetails.type = 'domain_verification_error';
    errorDetails.diagnostics = {
      fromAddress,
      isCustomDomain: !fromAddress.includes('@resend.dev'),
      environment: process.env.NODE_ENV
    };
    errorDetails.troubleshooting = [
      `Verify your domain "${fromAddress.split('@')[1]}" is verified in Resend dashboard`,
      'Check DNS records (SPF, DKIM, DMARC) are correctly configured',
      'Wait for DNS propagation (can take up to 48 hours)',
      'Use RESEND_DEV_FROM or RESEND_USE_SANDBOX_FROM for testing while domain verifies'
    ];
  }
  // Check for FROM address validation errors
  else if (error.message?.includes('from') || error.message?.includes('sender') || error.status === 422) {
    errorDetails.type = 'from_address_error';
    errorDetails.diagnostics = {
      fromAddress,
      isValidFormat: /^.+ <.+@.+>$/.test(fromAddress) || /^.+@.+$/.test(fromAddress)
    };
    errorDetails.troubleshooting = [
      `Verify the FROM address "${fromAddress}" is valid`,
      'Ensure the domain in FROM address is verified in Resend',
      'Check FROM address format: "Name <email@domain.com>" or "email@domain.com"',
      'In development, use onboarding@resend.dev or your verified domain'
    ];
  }
  // Check for rate limiting
  else if (error.message?.includes('rate limit') || error.status === 429) {
    errorDetails.type = 'rate_limit_error';
    errorDetails.troubleshooting = [
      'You have exceeded the rate limit for your Resend plan',
      'Wait before sending more emails',
      'Consider upgrading your Resend plan for higher limits'
    ];
  }
  // Generic validation errors
  else if (error.message?.includes('validation') || error.name === 'validation_error') {
    errorDetails.type = 'validation_error';
    errorDetails.troubleshooting = [
      'Check that all required fields are provided',
      'Verify email addresses are in correct format',
      'Ensure HTML content is valid'
    ];
  }

  return errorDetails;
};

/**
 * Log email configuration for debugging
 */
const logEmailConfig = (fromAddress, to, template, isRedirected) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
};

export const sendEmail = async (to: string | string[], template: string, data: any, options: Record<string, any> = {}) => {
  try {
    // Validate Resend client initialization
    const resendClient = getResend();
    if (!resendClient) {
      const error = 'Email service not configured: RESEND_API_KEY is missing';
      console.error('[Email Error]', error);
      return { 
        success: false, 
        error,
        diagnostics: {
          hasApiKey: false,
          troubleshooting: [
            'Set RESEND_API_KEY in your environment variables',
            'Get your API key from https://resend.com/api-keys',
            'Ensure the API key has sending permissions'
          ]
        }
      };
    }

    // Validate API key format (should start with 're_')
    if (process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_')) {
      console.warn('[Email Warning] API key format may be invalid (expected to start with "re_")');
    }

    // Handle email redirect in development (optional)
    const originalTo = Array.isArray(to) ? [...to] : to;
    let finalTo = Array.isArray(to) ? [...to] : [to];
    let isRedirected = false;

    if (shouldRedirectInDev() && template !== 'newsletterWelcome') {
      const redirectEmail = getDevRedirectEmail();
      isRedirected = true;
      finalTo = [redirectEmail];
    }

    // Get email template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Sponsors and featured projects go at the bottom of every email; the
    // newsletter also gets a signed one-click unsubscribe link.
    const promo = data?.promo ?? await getEmailPromo().catch(() => null);
    const templateData = {
      ...data,
      promo,
      ...(template === 'newsletterWelcome' && data?.email
        ? { unsubscribeUrl: unsubscribeUrl(siteConfig.url, data.email) }
        : {}),
    };
    const subject = emailTemplate.subject(templateData);
    const html = emailTemplate.html(templateData);

    // Get FROM address based on environment and configuration
    const fromAddress = getFromAddress();

    // Log configuration for debugging
    logEmailConfig(fromAddress, finalTo, template, isRedirected);

    // Send email via Resend
    const result = await resendClient.emails.send({
      from: fromAddress,
      to: finalTo,
      replyTo: emailConfig.replyTo,
      subject,
      html,
      tags: [
        {
          name: 'category',
          value: template
        },
        {
          name: 'environment',
          value: process.env.NODE_ENV || 'unknown'
        },
        ...(options.tags || [])
      ]
    }, options.idempotencyKey ? { idempotencyKey: options.idempotencyKey } : undefined);

    // Check for errors in response
    if (result.error) {
      const errorDetails = handleEmailError(result.error, fromAddress, finalTo);
      console.error('[Email Send Failed]', {
        error: errorDetails,
        fromAddress,
        to: finalTo,
        template
      });
      return { 
        success: false, 
        error: errorDetails.message,
        diagnostics: errorDetails.diagnostics,
        troubleshooting: errorDetails.troubleshooting,
        errorType: errorDetails.type
      };
    }

    return {
      success: true,
      data: result.data,
      redirected: isRedirected,
      originalTo: isRedirected ? originalTo : undefined
    };
  } catch (error) {
    // Enhanced error handling
    const fromAddress = getFromAddress();
    const errorDetails = handleEmailError(error, fromAddress, Array.isArray(to) ? to : [to]);
    
    console.error('[Email Send Error]', {
      error: errorDetails,
      fromAddress,
      to: Array.isArray(to) ? to : [to],
      template,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    return { 
      success: false, 
      error: errorDetails.message,
      diagnostics: errorDetails.diagnostics,
      troubleshooting: errorDetails.troubleshooting,
      errorType: errorDetails.type
    };
  }
};

// Comprehensive notification service
export const notificationService = {
  // Account notifications
  async accountCreation(userEmail, userData) {
    return await sendEmail(userEmail, 'accountCreation', userData);
  },

  async accountDeletion(userEmail, userData) {
    return await sendEmail(userEmail, 'accountDeletion', userData);
  },

  // Submission notifications
  async submissionReceived(userEmail, projectData) {
    return await sendEmail(userEmail, 'submissionReceived', projectData);
  },

  async submissionApproval(userEmail, projectData) {
    return await sendEmail(userEmail, 'submissionApproval', projectData);
  },

  async submissionDecline(userEmail, projectData) {
    return await sendEmail(userEmail, 'submissionDecline', projectData);
  },

  // Newsletter notifications
  async newsletterWelcome(userEmail, subscriptionData) {
    return await sendEmail(userEmail, 'newsletterWelcome', subscriptionData);
  },

  // Batch email for multiple recipients
  async sendBatch(recipients, template, data) {
    const results = [];
    for (const recipient of recipients) {
      const result = await sendEmail(recipient.email, template, {
        ...data,
        ...recipient.data
      });
      results.push({ email: recipient.email, ...result });
    }
    return results;
  }
};

// Legacy compatibility
export const emailNotifications = {
  async projectApproved(userEmail, projectData) {
    return await notificationService.submissionApproval(userEmail, projectData);
  },

  async projectRejected(userEmail, projectData) {
    return await notificationService.submissionDecline(userEmail, projectData);
  },

  // Batch email for multiple recipients
  async sendBatch(recipients, template, data) {
    return await notificationService.sendBatch(recipients, template, data);
  }
};
