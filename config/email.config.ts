import type { EmailConfig } from '@/types/config';
import { siteConfig } from './site.config';

/**
 * Email Configuration
 *
 * Controls how transactional emails are sent.
 * Currently supports Resend as the email provider.
 *
 * The `from` address and team signature are used across all email templates
 * (welcome, submission confirmation, winner notifications, etc.)
 */
export const emailConfig: EmailConfig = {
  provider: 'resend',

  from: {
    name: siteConfig.name,
    // Must be on a domain verified in Resend. Only `resend.ailaunch.space` is;
    // the bare `ailaunch.space` is not, and every send from it fails.
    email: 'noreply@resend.ailaunch.space',
  },

  replyTo: siteConfig.contact.email,

  teamSignature: `The ${siteConfig.name} Team`,
};

/**
 * Get the formatted "From" address for emails.
 * In development, falls back to Resend's onboarding address.
 */
export function getFromAddress(): string {
  if (process.env.NODE_ENV === 'production' || process.env.RESEND_PRODUCTION_FROM) {
    return process.env.RESEND_PRODUCTION_FROM || `${emailConfig.from.name} <${emailConfig.from.email}>`;
  }
  return process.env.RESEND_DEV_FROM || `${emailConfig.from.name} <onboarding@resend.dev>`;
}
