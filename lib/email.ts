import { Resend } from 'resend';
import { siteConfig } from '@/config/site.config';
import { emailConfig, getFromAddress as getConfigFromAddress } from '@/config/email.config';

// Lazy initialization to avoid build-time errors
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

/**
 * Get logo URL for email templates
 * Uses project logo if available, otherwise falls back to site logo
 */
const getLogoUrl = (data) => {
  const baseUrl = siteConfig.url;

  // If project logo is available, use it
  if (data?.logo_url) {
    return data.logo_url;
  }

  // Otherwise use site logo
  return `${baseUrl}/assets/logo.svg`;
};

/**
 * Generate logo HTML for email templates
 * Uses text-based logo for the site brand (works in all email clients)
 * Falls back to image for project logos if available
 */
const getLogoHtml = (data: any, options: Record<string, any> = {}) => {
  // If project logo is available, try to use it
  if (data?.logo_url) {
    const width = options.width || 140;
    const height = options.height || 44;
    const alt = options.alt || `${data.projectName || 'Project'} logo`;
    
    return `
      <img 
        src="${data.logo_url}" 
        alt="${alt}" 
        width="${width}" 
        height="${height}" 
        style="max-width: ${width}px; height: auto; display: block; margin: 0 auto 20px;"
      />
    `;
  }
  
  // For site logo, use text-based version (more reliable in emails)
  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="display: inline-block; font-size: 28px; font-weight: 700; color: #000000; letter-spacing: -0.5px; line-height: 1.2;">
        ${siteConfig.name}
      </div>
    </div>
  `;
};

/**
 * Generate "Sponsored by" HTML block for email templates.
 * Pass `data.sponsors` as an array of { name, logo, website_url }.
 * Returns empty string if no sponsors provided.
 */
const getSponsorsHtml = (data: any) => {
  const sponsors = data?.sponsors;
  if (!sponsors || !Array.isArray(sponsors) || sponsors.length === 0) return '';

  const logos = sponsors.map((s: any) => `
    <a href="${s.website_url || '#'}" target="_blank" rel="noopener noreferrer" style="display: inline-block; margin: 0 8px 8px 0; text-decoration: none;">
      <img src="${s.logo}" alt="${s.name}" width="80" height="28" style="max-width: 80px; max-height: 28px; height: auto; object-fit: contain; vertical-align: middle;" />
    </a>
  `).join('');

  return `
    <div style="border-top: 1px solid #e5e7eb; margin-top: 24px; padding-top: 16px; text-align: center;">
      <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 0.5px;">Sponsored by</p>
      <div>${logos}</div>
    </div>
  `;
};

// Email templates
export const emailTemplates = {
  // Account notifications
  accountCreation: {
    subject: () => `Welcome to ${siteConfig.name}! 🎉`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to ${siteConfig.name}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Welcome to ${siteConfig.name}! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  Hi ${data.userName || 'there'}!
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Your account has been successfully created. You're now ready to launch your directory or tiny project and compete for top positions!
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What you can do now:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Submit your directory or project for review</li>
                  <li style="margin-bottom: 8px;">Compete in weekly competitions</li>
                  <li style="margin-bottom: 8px;">Earn dofollow backlinks by winning</li>
                  <li>Track your performance in your dashboard</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Submit Your Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Go to Dashboard
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us at ${siteConfig.contact.email}<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  accountDeletion: {
    subject: () => `Your ${siteConfig.name} account has been deleted`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Account Deleted</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Account Deleted
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Your ${siteConfig.name} account and all associated data have been permanently deleted as requested.
                </p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What was deleted:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Your account profile</li>
                  <li style="margin-bottom: 8px;">All submitted projects</li>
                  <li style="margin-bottom: 8px;">Vote history and interactions</li>
                  <li>All associated data</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  If you change your mind, you can always create a new account.<br>
                  Thank you for being part of ${siteConfig.name}.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
`
  },

  // Competition notifications
  weeklyCompetitionEntry: {
    subject: (projectName) => `🚀 ${projectName} entered the weekly competition!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Competition Entry Confirmed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Entry Confirmed! 🚀
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is now competing!
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Your project has been entered into this week's competition and is now live for voting.
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Competition Details</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.competitionWeek}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Competition Week</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.endDate}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Ends</div>
                  </div>
                </div>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What winners will get:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">🏆 Winner badge for your website (positions #1, #2, or #3)</li>
                  <li style="margin-bottom: 8px;">🔗 High-authority dofollow backlink from ${siteConfig.name}</li>
                  <li style="margin-bottom: 8px;">📈 SEO boost from the valuable backlink</li>
                  <li>✨ Recognition and credibility for your project</li>
                </ul>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What's required for winners to get a backlink:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Finish in the top 3 positions (#1, #2, or #3) in the weekly competition</li>
                  <li style="margin-bottom: 8px;">Add the winner badge to your website within 7 days of winning</li>
                  <li style="margin-bottom: 8px;">The badge must be visible on your live website (not just in code)</li>
                  <li>The dofollow link will be activated within 24 hours after we verify the badge is added</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Your Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Track Performance
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Good luck with your launch!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Competition notifications (batch for multiple projects)
  weeklyCompetitionEntryBatch: {
    subject: () => `🚀 Your projects entered this week's competition!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Competition Entry Confirmed</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Entries Confirmed! 🚀
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Your projects have been entered into this week's competition and are now live for voting.
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Competition Details</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.competitionWeek}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Competition Week</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.endDate}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Ends</div>
                  </div>
                </div>
              </div>

              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 18px;">Your Projects</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  ${Array.isArray(data.projects) ? data.projects.map(p => `
                    <li style="margin-bottom: 10px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${p.slug}" style="color: #000000; text-decoration: none; font-weight: 600;">${p.name}</a>
                    </li>
                  `).join('') : ''}
                </ul>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What winners will get:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">🏆 Winner badge for your website (positions #1, #2, or #3)</li>
                  <li style="margin-bottom: 8px;">🔗 High-authority dofollow backlink from ${siteConfig.name}</li>
                  <li style="margin-bottom: 8px;">📈 SEO boost from the valuable backlink</li>
                  <li>✨ Recognition and credibility for your project</li>
                </ul>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What's required for winners to get a backlink:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Finish in the top 3 positions (#1, #2, or #3) in the weekly competition</li>
                  <li style="margin-bottom: 8px;">Add the winner badge to your website within 7 days of winning</li>
                  <li style="margin-bottom: 8px;">The badge must be visible on your live website (not just in code)</li>
                  <li style="margin-bottom: 8px;"><strong>Important:</strong> The badge embed code must NOT include <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; font-size: 12px;">rel="nofollow"</code> to maintain the dofollow backlink</li>
                  <li>The dofollow link will be activated within 24 hours after we verify the badge is added</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Track Performance
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Good luck with your launches!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  competitionWinners: {
    subject: (competitionType, position) => `🏆 Congratulations! You placed #${position} in the ${competitionType} competition!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Competition Winner</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Amazing Achievement!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} placed #${data.position}!
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Congratulations on your outstanding performance in the ${data.competitionType} competition.
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Competition Results</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">#${data.position}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Final Rank</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.totalVotes}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Votes</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.totalViews}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Views</div>
                  </div>
                </div>
              </div>

              ${data.planType === 'premium' ? `
              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">🏅 Your Winner Badge is Ready!</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  As a competition winner with a premium listing, you now have a special <strong>winner badge</strong> that you can display on your website. Show off your achievement!
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">How to add the winner badge (optional):</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Go to your dashboard</li>
                  <li style="margin-bottom: 8px;">Copy the winner badge embed code</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li>Share your achievement with your audience!</li>
                </ol>
              </div>
              ` : `
              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">🔗 Claim Your Dofollow Backlink!</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  You've earned a <strong>dofollow backlink</strong>! Add the winner badge to your website to activate it. You have <strong>7 days</strong> to add the badge before the link expires.
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">How to add the winner badge:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Go to your dashboard</li>
                  <li style="margin-bottom: 8px;">Copy the winner badge embed code</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li style="margin-bottom: 8px;"><strong>Important:</strong> Do NOT add <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; font-size: 12px;">rel="nofollow"</code> to the badge link - it must remain dofollow</li>
                  <li>Your dofollow link will be activated within 24 hours</li>
                </ol>
              </div>
              `}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Get Badge Code
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Your Win
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Keep up the excellent work!<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  winnerReminder: {
    subject: (projectName, planType) => planType === 'premium'
      ? `🏅 Display your winner badge on ${projectName}!`
      : `🔗 Don't forget: Add the winner badge to ${projectName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Winner Badge Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">${data.planType === 'premium' ? '🏅' : '🔗'}</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  ${data.planType === 'premium' ? 'Show Off Your Win!' : 'Claim Your Dofollow Link!'}
                </h1>
              </div>

              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} won #${data.position}!
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  ${data.planType === 'premium'
                    ? 'You have a special winner badge available. Display it on your website to showcase your achievement!'
                    : 'You\'ve earned a dofollow backlink! Add the winner badge to your website to activate it.'}
                </p>
              </div>

              ${data.planType === 'premium' ? `
              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">🏆 Celebrate Your Achievement:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  Add the winner badge to your website and let your users know you're a competition winner on ${siteConfig.name}!
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">How to add the badge (optional):</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Copy the embed code from your dashboard</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li>Share your achievement with your audience!</li>
                </ol>
              </div>
              ` : `
              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">Important:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  You have <strong>7 days</strong> to add the winner badge to your website. After that, the dofollow link will expire.
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">How to add the badge:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Copy the embed code from your dashboard</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li style="margin-bottom: 8px;">The badge will automatically link back to ${siteConfig.name}</li>
                  <li style="margin-bottom: 8px;"><strong>Important:</strong> Do NOT add <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; font-size: 12px;">rel="nofollow"</code> to the badge link - it must remain dofollow</li>
                  <li>Your dofollow link will be activated within 24 hours</li>
                </ol>
              </div>
              `}

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Get Embed Code
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Your Win
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us at ${siteConfig.contact.email}<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Submission notifications
  submissionApproval: {
    subject: (projectName) => `🎉 ${projectName} approved & scheduled for launch!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Project Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Approved & scheduled! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${
                    data.projectStatus === 'scheduled'
                      ? `${data.projectName} is approved and queued`
                      : `${data.projectName} is now live`
                  }
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  ${
                    data.projectStatus === 'scheduled'
                      ? `We've reserved your slot for ${
                          data.competitionWeek
                            ? `Week ${data.competitionWeek}`
                            : 'the competition week you selected'
                        }. It will go live on ${
                          data.competitionStartDate || 'your scheduled start date'
                        }, and we'll notify you before voting opens.`
                      : `Your project has been approved and is now visible on ${siteConfig.name}.`
                  }
                </p>
              </div>

              ${
                data.projectStatus === 'scheduled'
                  ? `
              <div style="background: #f9fafb; border: 1px solid #000000; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
                <div style="font-size: 14px; color: #374151; margin-bottom: 6px;">Launch window</div>
                <div style="font-size: 20px; font-weight: 700; color: #000000;">
                  ${data.competitionWeek ? `Week ${data.competitionWeek}` : 'Scheduled week'}
                </div>
                <div style="font-size: 14px; color: #374151;">
                  Goes live on ${data.competitionStartDate || 'your selected start date'}
                </div>
              </div>
                  `
                  : ''
              }

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">
                    ${
                      data.projectStatus === 'scheduled'
                        ? 'Your project will automatically go live at the start of your scheduled competition week'
                        : 'Your project is now live and accepting votes'
                    }
                  </li>
                  <li style="margin-bottom: 8px;">
                    ${
                      data.projectStatus === 'scheduled'
                        ? 'We will send a reminder before the week starts so you can promote your launch'
                        : 'Users can discover and visit your project'
                    }
                  </li>
                  <li style="margin-bottom: 8px;">Track your performance in your dashboard</li>
                  <li>
                    ${
                      data.projectStatus === 'scheduled'
                        ? 'Update your listing anytime before launch to make the best first impression'
                        : 'Compete in weekly competitions for top 3 positions'
                    }
                  </li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Your Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Go to Dashboard
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Best of luck with your launch!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  submissionDecline: {
    subject: (projectName) => `Project submission update: ${projectName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Project Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Submission Update
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName}
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  We've reviewed your project submission and have some feedback.
                </p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">Feedback:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  ${data.rejectionReason || 'Please review our submission guidelines and make the necessary improvements.'}
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What to do next:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Review the feedback above</li>
                  <li style="margin-bottom: 8px;">Make the necessary improvements</li>
                  <li style="margin-bottom: 8px;">Resubmit your project</li>
                  <li>Contact us if you have questions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Submit Again
                </a>
                <a href="mailto:${siteConfig.contact.email}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                   Contact Support
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  We're here to help you succeed!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Submission received notification
  submissionReceived: {
    subject: (projectName) => `📋 ${projectName} submission received - Under review`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Submission Received</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Submission Received!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is under review
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Thank you for submitting your directory or project! Our team is now reviewing your submission.
                </p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Our team will review your submission within 24-48 hours</li>
                  <li style="margin-bottom: 8px;">You'll receive an email once your project is approved or if we need changes</li>
                  <li style="margin-bottom: 8px;">If approved, we'll schedule your project for your selected competition week and notify you before it goes live</li>
                  <li>You can track your submission status in your dashboard</li>
                </ul>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">While you wait:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Share your project with friends and get feedback</li>
                  <li style="margin-bottom: 8px;">Prepare your launch strategy for when it goes live</li>
                  <li style="margin-bottom: 8px;">Explore other directories and projects on the platform</li>
                  <li>Join our community discussions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Dashboard
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Browse Projects
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Questions? Contact us at ${siteConfig.contact.email}<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Launch week reminder notification
  launchWeekReminder: {
    subject: (projectName) => `🚀 ${projectName} is launching this week - Time to promote!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Launch Week Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Launch Week Starts Now!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is competing this week
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Your project is now live and competing for votes! This is your chance to make it to the top 3.
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Competition Details</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.competitionWeek}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Competition Week</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.endDate}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Ends</div>
                  </div>
                </div>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">Action Required:</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>Start promoting your launch now!</strong> The more people who discover and vote for your project, the better your chances of winning.
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What winners will get:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">🏆 Winner badge for your website (positions #1, #2, or #3)</li>
                  <li style="margin-bottom: 8px;">🔗 High-authority dofollow backlink from ${siteConfig.name}</li>
                  <li style="margin-bottom: 8px;">📈 SEO boost from the valuable backlink</li>
                  <li>✨ Recognition and credibility for your project</li>
                </ul>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What's required for winners to get a backlink:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Finish in the top 3 positions (#1, #2, or #3) in the weekly competition</li>
                  <li style="margin-bottom: 8px;">Add the winner badge to your website within 7 days of winning</li>
                  <li style="margin-bottom: 8px;">The badge must be visible on your live website (not just in code)</li>
                  <li style="margin-bottom: 8px;"><strong>Important:</strong> The badge embed code must NOT include <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; font-size: 12px;">rel="nofollow"</code> to maintain the dofollow backlink</li>
                  <li>The dofollow link will be activated within 24 hours after we verify the badge is added</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Your Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Track Performance
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Good luck with your launch!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Competition week start notification (promo email)
  competitionWeekStart: {
    subject: () => `🏆 New competition week started - Discover premium launches!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Competition Week</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  New Competition Week!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  Week ${data.competitionWeek} is now live
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Discover amazing new directories and tiny projects and vote for your favorites. Premium launches are featured this week!
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Featured Premium Launches</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.premiumCount}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Premium Projects</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.totalCount}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Projects</div>
                  </div>
                </div>
              </div>

              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">Featured Projects This Week:</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                  ${data.featuredProjects && data.featuredProjects.length > 0 ? data.featuredProjects.map(project => `
                    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                      <h4 style="margin: 0 0 5px 0; color: #000000; font-size: 16px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${project.slug}" style="color: #000000; text-decoration: none;">${project.name}</a>
                        ${project.premium_badge ? '<span style="background: #000000; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px;">PREMIUM</span>' : ''}
                      </h4>
                      <p style="margin: 0; color: #374151; font-size: 14px;">${project.short_description}</p>
                    </div>
                  `).join('') : '<p style="color: #374151; font-size: 14px; margin: 0;">Check out the latest projects on our platform!</p>'}
                </div>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">How to participate:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Vote for your favorite directories and projects</li>
                  <li style="margin-bottom: 8px;">Share projects you love on social media</li>
                  <li style="margin-bottom: 8px;">Submit your own directory or project for next week</li>
                  <li>Join the community discussions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Browse All Projects
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit Your Project
                </a>
              </div>

              ${getSponsorsHtml(data)}

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Happy voting and good luck to all participants!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Competition week end notification (winner shoutout)
  competitionWeekEnd: {
    subject: (data) => `🎉 Competition Week ${data.competitionWeek} Results - Meet the Winners!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Competition Results</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Results!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  Week ${data.competitionWeek} Winners
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  Congratulations to this week's top performers! Check out the amazing directories and projects that won.
                </p>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">This Week's Champions</h3>
                <div style="display: flex; justify-content: space-around; text-align: center;">
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.totalVotes}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Total Votes</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.totalProjects}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Projects</div>
                  </div>
                  <div>
                    <div style="font-size: 24px; font-weight: bold;">${data.winners.length}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Winners</div>
                  </div>
                </div>
              </div>

              <div style="margin: 20px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">🏆 Winners This Week:</h3>
                <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px;">
                  ${data.winners && data.winners.length > 0 ? data.winners.map((winner, index) => `
                    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background: ${index === 0 ? '#000000' : index === 1 ? '#4b5563' : '#6b7280'}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
                          ${index + 1}
                        </div>
                        <h4 style="margin: 0; color: #000000; font-size: 18px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${winner.slug}" style="color: #000000; text-decoration: none;">${winner.name}</a>
                        </h4>
                      </div>
                      <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">${winner.short_description}</p>
                      <div style="display: flex; gap: 15px; font-size: 12px; color: #6b7280;">
                        <span>👆 ${winner.upvotes} votes</span>
                        <span>👁️ ${winner.views} views</span>
                        ${winner.premium_badge ? '<span style="background: #000000; color: white; padding: 2px 6px; border-radius: 4px;">PREMIUM</span>' : ''}
                      </div>
                    </div>
                  `).join('') : '<p style="color: #374151; font-size: 14px; margin: 0;">No winners this week.</p>'}
                </div>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">What's Next?</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>New competition starts Monday!</strong> Submit your directory or project for next week's competition and compete for the top 3 positions.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View All Projects
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit for Next Week
                </a>
              </div>

              ${getSponsorsHtml(data)}

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Thank you for participating!<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Winner backlink reminder notification
  winnerBacklinkReminder: {
    subject: (projectName) => `🔗 Final reminder: Add winner badge to ${projectName} for dofollow link`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Final Backlink Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">🔗</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Final Reminder!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #000000; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} won #${data.position}!
                </h2>
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  This is your final reminder to add the winner badge to your website to activate your dofollow backlink.
                </p>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">⏰ Time is running out!</h3>
                <p style="margin: 0; color: #374151; font-size: 14px;">
                  <strong>You have ${data.daysLeft} days left</strong> to add the winner badge. After that, the dofollow link will expire and you'll lose this valuable SEO benefit.
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">Quick setup steps:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">Go to your dashboard</li>
                  <li style="margin-bottom: 8px;">Copy the winner badge embed code</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li style="margin-bottom: 8px;"><strong>Important:</strong> Do NOT add <code style="background: #e5e7eb; padding: 2px 4px; border-radius: 3px; font-size: 12px;">rel="nofollow"</code> to the badge link - it must remain dofollow</li>
                  <li>Your dofollow link will be activated within 24 hours</li>
                </ol>
              </div>

              <div style="background: #f9fafb; border-left: 4px solid #000000; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #000000; font-size: 16px;">Why this matters:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Dofollow backlinks boost your website's SEO</li>
                  <li style="margin-bottom: 8px;">${siteConfig.name} has high domain authority</li>
                  <li style="margin-bottom: 8px;">This is a one-time opportunity</li>
                  <li>Share your achievement with your audience</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Get Badge Code Now
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Your Win
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us immediately at ${siteConfig.contact.email}<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  // Newsletter notifications
  newsletterWelcome: {
    subject: () => `Welcome to ${siteConfig.name} Newsletter! 🎉`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to ${siteConfig.name} Newsletter</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #000000; margin: 0; padding: 0; background-color: #ffffff;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                ${getLogoHtml(data)}
                <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
                <h1 style="color: #000000; margin: 0; font-size: 28px; font-weight: 700;">
                  Welcome to our Newsletter! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #374151; margin: 0; font-size: 16px;">
                  ${data.isResubscription ? 'Welcome back! You\'ve been resubscribed to our newsletter.' : `Thank you for subscribing to ${siteConfig.name}'s newsletter!`}
                </p>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #000000; font-size: 18px;">What you'll receive:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #374151;">
                  <li style="margin-bottom: 8px;">📊 Weekly project roundups and trending projects</li>
                  <li style="margin-bottom: 8px;">🏆 Competition results and winner announcements</li>
                  <li style="margin-bottom: 8px;">🚀 Platform updates and new features</li>
                  <li style="margin-bottom: 8px;">💡 Launch tips and best practices from successful builders</li>
                  <li>🎯 Exclusive insights and early access to new tools</li>
                </ul>
              </div>

              <div style="background: #000000; color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Join Our Community</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9;">
                  You're now part of a growing community of ${data.source === 'footer' ? '500+' : 'innovative'} directory creators, project builders, and entrepreneurs.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/" 
                   style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Browse Projects
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: rgba(255,255,255,0.2); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit Your Project
                </a>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #000000; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Create Account
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Manage Preferences
                </a>
              </div>

              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #374151; font-size: 14px; margin: 0;">
                  <strong>What's Next?</strong><br>
                  Keep an eye on your inbox for our weekly digest every Monday. 
                  We'll share the latest project launches, competition results, and platform updates.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Questions? Reply to this email or contact us at ${siteConfig.contact.email}<br>
                  You can manage or turn off email notifications anytime in your account settings.<br>
                  ${emailConfig.teamSignature}
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/newsletter?email=${encodeURIComponent(data.email)}" style="color: #9ca3af;">Unsubscribe</a> | 
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color: #9ca3af;">Manage Preferences</a>
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }
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
  
  // Production: use production FROM or default to verified domain
  if (!isDevelopment) {
    return process.env.RESEND_PRODUCTION_FROM || `${siteConfig.name} <${siteConfig.contact.email}>`;
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

    // Generate subject and HTML
    // Handle different subject function signatures
    let subject;
    if (typeof emailTemplate.subject === 'function') {
      // competitionWinners expects (competitionType, position)
      if (template === 'competitionWinners') {
        subject = emailTemplate.subject(data.competitionType || 'weekly', data.position);
      }
      // competitionWeekEnd expects (data)
      else if (template === 'competitionWeekEnd') {
        subject = emailTemplate.subject(data);
      }
      // winnerReminder expects (projectName, planType)
      else if (template === 'winnerReminder') {
        subject = emailTemplate.subject(data.projectName, data.planType);
      }
      // winnerBacklinkReminder expects (projectName)
      else if (template === 'winnerBacklinkReminder') {
        subject = emailTemplate.subject(data.projectName);
      }
      // Other templates may have different signatures
      else {
        subject = emailTemplate.subject(data.projectName, data.position, data.competitionType);
      }
    } else {
      subject = emailTemplate.subject;
    }

    const html = emailTemplate.html(data);

    // Get FROM address based on environment and configuration
    const fromAddress = getFromAddress();

    // Log configuration for debugging
    logEmailConfig(fromAddress, finalTo, template, isRedirected);

    // Send email via Resend
    const result = await resendClient.emails.send({
      from: fromAddress,
      to: finalTo,
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
    });

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

  // Competition notifications
  async weeklyCompetitionEntry(userEmail, projectData) {
    return await sendEmail(userEmail, 'weeklyCompetitionEntry', projectData);
  },

  async weeklyCompetitionEntryBatch(userEmail, data) {
    return await sendEmail(userEmail, 'weeklyCompetitionEntryBatch', data);
  },

  async competitionWinners(userEmail, competitionData) {
    return await sendEmail(userEmail, 'competitionWinners', competitionData);
  },

  async winnerReminder(userEmail, projectData) {
    return await sendEmail(userEmail, 'winnerReminder', projectData);
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

  // Launch week reminder notifications
  async launchWeekReminder(userEmail, projectData) {
    return await sendEmail(userEmail, 'launchWeekReminder', projectData);
  },

  // Competition notifications
  async competitionWeekStart(userEmail, competitionData) {
    return await sendEmail(userEmail, 'competitionWeekStart', competitionData);
  },

  async competitionWeekEnd(userEmail, competitionData) {
    return await sendEmail(userEmail, 'competitionWeekEnd', competitionData);
  },

  // Winner backlink reminder notifications
  async winnerBacklinkReminder(userEmail, projectData) {
    return await sendEmail(userEmail, 'winnerBacklinkReminder', projectData);
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

  async competitionWinner(userEmail, competitionData) {
    return await notificationService.competitionWinners(userEmail, competitionData);
  },

  // Batch email for multiple recipients
  async sendBatch(recipients, template, data) {
    return await notificationService.sendBatch(recipients, template, data);
  }
};