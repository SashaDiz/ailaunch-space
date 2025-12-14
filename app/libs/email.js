import { Resend } from 'resend';

// Lazy initialization to avoid build-time errors
let resend = null;
const getResend = () => {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
};

// Email templates
export const emailTemplates = {
  // Account notifications
  accountCreation: {
    subject: () => `Welcome to AI Launch Space! 🎉`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to AI Launch Space</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Welcome to AI Launch Space! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  Hi ${data.userName || 'there'}!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your account has been successfully created. You're now ready to launch your AI project and compete for top positions!
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">What you can do now:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Submit your AI project for review</li>
                  <li style="margin-bottom: 8px;">Compete in weekly competitions</li>
                  <li style="margin-bottom: 8px;">Earn dofollow backlinks by winning</li>
                  <li>Track your performance in your dashboard</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Submit Your Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Go to Dashboard
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us at hello@resend.ailaunch.space<br>
                  The AI Launch Space Team
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  accountDeletion: {
    subject: () => `Your AI Launch Space account has been deleted`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Account Deleted</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Account Deleted
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your AI Launch Space account and all associated data have been permanently deleted as requested.
                </p>
              </div>

              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">What was deleted:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #dc2626; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Your account profile</li>
                  <li style="margin-bottom: 8px;">All submitted projects</li>
                  <li style="margin-bottom: 8px;">Vote history and interactions</li>
                  <li>All associated data</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  If you change your mind, you can always create a new account.<br>
                  Thank you for being part of AI Launch Space.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Entry Confirmed! 🚀
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is now competing!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your project has been entered into this week's competition and is now live for voting.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">How to promote your launch:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Share your project on social media</li>
                  <li style="margin-bottom: 8px;">Ask friends and colleagues to vote</li>
                  <li style="margin-bottom: 8px;">Post in relevant communities</li>
                  <li>Engage with other participants</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
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
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Entries Confirmed! 🚀
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your projects have been entered into this week's competition and are now live for voting.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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
                <h3 style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px;">Your Projects</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  ${Array.isArray(data.projects) ? data.projects.map(p => `
                    <li style="margin-bottom: 10px;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${p.slug}" style="color: #ED0D79; text-decoration: none; font-weight: 600;">${p.name}</a>
                    </li>
                  `).join('') : ''}
                </ul>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">How to promote your launches:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Share your projects on social media</li>
                  <li style="margin-bottom: 8px;">Ask friends and colleagues to vote</li>
                  <li style="margin-bottom: 8px;">Post in relevant communities</li>
                  <li>Engage with other participants</li>
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
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Amazing Achievement!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} placed #${data.position}!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Congratulations on your outstanding performance in the ${data.competitionType} competition.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #f59e0b, #f97316); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Project
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Dashboard
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Keep up the excellent work!<br>
                  The AI Launch Space Team
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  },

  winnerReminder: {
    subject: (projectName) => `🔗 Don't forget: Add the winner badge to ${projectName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Winner Badge Reminder</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🔗</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Claim Your Dofollow Link!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} won #${data.position}!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  You've earned a dofollow backlink! Add the winner badge to your website to activate it.
                </p>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Important:</h3>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  You have <strong>7 days</strong> to add the winner badge to your website. After that, the dofollow link will expire.
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">How to add the badge:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Copy the embed code from your dashboard</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li style="margin-bottom: 8px;">The badge will automatically link back to AI Launch Space</li>
                  <li>Your dofollow link will be activated within 24 hours</li>
                </ol>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Get Embed Code
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Your Win
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us at hello@resend.ailaunch.space<br>
                  The AI Launch Space Team
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
    subject: (projectName) => `🎉 ${projectName} has been approved on AI Launch Space!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Project Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Congratulations! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is now live!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your project has been approved and is now visible on AI Launch Space.
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Your project is now live and accepting votes</li>
                  <li style="margin-bottom: 8px;">Users can discover and visit your project</li>
                  <li style="margin-bottom: 8px;">Track your performance in your dashboard</li>
                  <li>Compete in weekly competitions for top 3 positions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
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
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Submission Update
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName}
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  We've reviewed your project submission and have some feedback.
                </p>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Feedback:</h3>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ${data.rejectionReason || 'Please review our submission guidelines and make the necessary improvements.'}
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">What to do next:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Review the feedback above</li>
                  <li style="margin-bottom: 8px;">Make the necessary improvements</li>
                  <li style="margin-bottom: 8px;">Resubmit your project</li>
                  <li>Contact us if you have questions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Submit Again
                </a>
                <a href="mailto:hello@resend.ailaunch.space" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                   Contact Support
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  We're here to help you succeed!<br>
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Submission Received!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is under review
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Thank you for submitting your AI project! Our team is now reviewing your submission.
                </p>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Our team will review your submission within 24-48 hours</li>
                  <li style="margin-bottom: 8px;">You'll receive an email once your project is approved or if we need changes</li>
                  <li style="margin-bottom: 8px;">If approved, your project will go live and enter the weekly competition</li>
                  <li>You can track your submission status in your dashboard</li>
                </ul>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">While you wait:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Share your project with friends and get feedback</li>
                  <li style="margin-bottom: 8px;">Prepare your launch strategy for when it goes live</li>
                  <li style="margin-bottom: 8px;">Explore other AI projects on the platform</li>
                  <li>Join our community discussions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Dashboard
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Browse Projects
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Questions? Contact us at hello@resend.ailaunch.space<br>
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🚀</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Launch Week Starts Now!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} is competing this week
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your project is now live and competing for votes! This is your chance to make it to the top 3.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px;">Action Required:</h3>
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Start promoting your launch now!</strong> The more people who discover and vote for your project, the better your chances of winning.
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">How to promote your launch:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Share on social media (Twitter, LinkedIn, Facebook)</li>
                  <li style="margin-bottom: 8px;">Post in relevant communities and forums</li>
                  <li style="margin-bottom: 8px;">Email your network and ask for votes</li>
                  <li style="margin-bottom: 8px;">Create engaging content about your project</li>
                  <li>Engage with other participants and voters</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
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
                  The AI Launch Space Team
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
    subject: () => `🏆 New competition week started - Discover premium AI launches!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>New Competition Week</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  New Competition Week!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  Week ${data.competitionWeek} is now live
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Discover amazing new AI projects and vote for your favorites. Premium launches are featured this week!
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Featured Projects This Week:</h3>
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                  ${data.featuredProjects && data.featuredProjects.length > 0 ? data.featuredProjects.map(project => `
                    <div style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                      <h4 style="margin: 0 0 5px 0; color: #1f2937; font-size: 16px;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${project.slug}" style="color: #ED0D79; text-decoration: none;">${project.name}</a>
                        ${project.premium_badge ? '<span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; margin-left: 8px;">PREMIUM</span>' : ''}
                      </h4>
                      <p style="margin: 0; color: #6b7280; font-size: 14px;">${project.short_description}</p>
                    </div>
                  `).join('') : '<p style="color: #6b7280; font-size: 14px; margin: 0;">Check out the latest projects on our platform!</p>'}
                </div>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">How to participate:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Vote for your favorite AI projects</li>
                  <li style="margin-bottom: 8px;">Share projects you love on social media</li>
                  <li style="margin-bottom: 8px;">Submit your own AI project for next week</li>
                  <li>Join the community discussions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Browse All Projects
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit Your Project
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Happy voting and good luck to all participants!<br>
                  The AI Launch Space Team
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
    subject: () => `🎉 Competition Week ${data.competitionWeek} Results - Meet the Winners!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Competition Results</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Competition Results!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  Week ${data.competitionWeek} Winners
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Congratulations to this week's top performers! Check out the amazing AI projects that won.
                </p>
              </div>

              <div style="background: linear-gradient(135deg, #f59e0b, #f97316); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
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
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">🏆 Winners This Week:</h3>
                <div style="background: #f9fafb; border-radius: 8px; padding: 20px;">
                  ${data.winners && data.winners.length > 0 ? data.winners.map((winner, index) => `
                    <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
                      <div style="display: flex; align-items: center; margin-bottom: 10px;">
                        <div style="background: ${index === 0 ? '#fbbf24' : index === 1 ? '#9ca3af' : '#cd7f32'}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 12px;">
                          ${index + 1}
                        </div>
                        <h4 style="margin: 0; color: #1f2937; font-size: 18px;">
                          <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${winner.slug}" style="color: #ED0D79; text-decoration: none;">${winner.name}</a>
                        </h4>
                      </div>
                      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${winner.short_description}</p>
                      <div style="display: flex; gap: 15px; font-size: 12px; color: #9ca3af;">
                        <span>👆 ${winner.upvotes} votes</span>
                        <span>👁️ ${winner.views} views</span>
                        ${winner.premium_badge ? '<span style="background: #8b5cf6; color: white; padding: 2px 6px; border-radius: 4px;">PREMIUM</span>' : ''}
                      </div>
                    </div>
                  `).join('') : '<p style="color: #6b7280; font-size: 14px; margin: 0;">No winners this week.</p>'}
                </div>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">What's Next?</h3>
                <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
                  <strong>New competition starts Monday!</strong> Submit your AI project for next week's competition and compete for the top 3 positions.
                </p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View All Projects
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Submit for Next Week
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Thank you for participating!<br>
                  The AI Launch Space Team
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
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">🔗</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Final Reminder!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.projectName} won #${data.position}!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  This is your final reminder to add the winner badge to your website to activate your dofollow backlink.
                </p>
              </div>

              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #dc2626; font-size: 16px;">⏰ Time is running out!</h3>
                <p style="margin: 0; color: #dc2626; font-size: 14px;">
                  <strong>You have ${data.daysLeft} days left</strong> to add the winner badge. After that, the dofollow link will expire and you'll lose this valuable SEO benefit.
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Quick setup steps:</h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Go to your dashboard</li>
                  <li style="margin-bottom: 8px;">Copy the winner badge embed code</li>
                  <li style="margin-bottom: 8px;">Add it to your website's HTML</li>
                  <li>Your dofollow link will be activated within 24 hours</li>
                </ol>
              </div>

              <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">Why this matters:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px;">
                  <li style="margin-bottom: 8px;">Dofollow backlinks boost your website's SEO</li>
                  <li style="margin-bottom: 8px;">AI Launch Space has high domain authority</li>
                  <li style="margin-bottom: 8px;">This is a one-time opportunity</li>
                  <li>Share your achievement with your audience</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
                   style="display: inline-block; background: #ef4444; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Get Badge Code Now
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/project/${data.slug}" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  View Your Win
                </a>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Need help? Contact us immediately at hello@resend.ailaunch.space<br>
                  The AI Launch Space Team
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
    subject: () => `Welcome to AI Launch Space Newsletter! 🎉`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Welcome to AI Launch Space Newsletter</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="${process.env.NEXT_PUBLIC_APP_URL}/assets/logo.svg" alt="AI Launch Space" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
                <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Welcome to our Newsletter! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  ${data.isResubscription ? 'Welcome back! You\'ve been resubscribed to our newsletter.' : 'Thank you for subscribing to AI Launch Space\'s newsletter!'}
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">What you'll receive:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">📊 Weekly project roundups and trending projects</li>
                  <li style="margin-bottom: 8px;">🏆 Competition results and winner announcements</li>
                  <li style="margin-bottom: 8px;">🚀 Platform updates and new features</li>
                  <li style="margin-bottom: 8px;">💡 Launch tips and best practices from successful builders</li>
                  <li>🎯 Exclusive insights and early access to new tools</li>
                </ul>
              </div>

              <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; border-radius: 12px; padding: 24px; margin: 30px 0; text-align: center;">
                <h3 style="margin: 0 0 15px 0; font-size: 20px;">Join Our Community</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.9;">
                  You're now part of a growing community of ${data.source === 'footer' ? '500+' : 'innovative'} AI builders and entrepreneurs.
                </p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/projects" 
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
                   style="display: inline-block; background: #ED0D79; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Create Account
                </a>
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" 
                   style="display: inline-block; background: #6b7280; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                  Manage Preferences
                </a>
              </div>

              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  <strong>What's Next?</strong><br>
                  Keep an eye on your inbox for our weekly digest every Monday. 
                  We'll share the latest project launches, competition results, and platform updates.
                </p>
              </div>

              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Questions? Reply to this email or contact us at hello@resend.ailaunch.space<br>
                  The AI Launch Space Team
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
      const possibleNames = ['AI Launch Space Newsletter', 'General', 'Newsletter'];
      const existingAudience = audiences.data?.find(audience => 
        possibleNames.includes(audience.name)
      );

      if (existingAudience) {
        console.log('Found existing newsletter audience:', existingAudience.id, 'with name:', existingAudience.name);
        return existingAudience.id;
      }

      // Create new audience if none exists
      const { data: newAudience, error: createError } = await resendClient.audiences.create({
        name: 'AI Launch Space Newsletter',
      });

      if (createError) {
        console.error('Error creating audience:', createError);
        throw createError;
      }

      console.log('Created new newsletter audience:', newAudience.id);
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
        console.log('Contact already exists in audience:', email);
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

      console.log('Added contact to newsletter audience:', email);
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

      console.log('Removed contact from newsletter audience:', email);
      return data;
    } catch (error) {
      console.error('Contact removal error:', error);
      throw error;
    }
  }
};

// Helper to detect if we're in production
const isProduction = () => {
  // Check Vercel environment first (more reliable)
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production';
  }
  // Fallback to NODE_ENV
  return process.env.NODE_ENV === 'production';
};

// Helper to detect if we're in development
const isDevelopment = () => {
  // Check Vercel environment first
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'development';
  }
  // Fallback to NODE_ENV
  return process.env.NODE_ENV === 'development';
};

const FALLBACK_DEV_FROM = 'AI Launch Space <onboarding@resend.dev>';
const FALLBACK_PROD_FROM = 'AI Launch Space <noreply@resend.ailaunch.space>';

const getFromAddress = () => {
  // Allow overriding FROM address in any environment via env vars
  if (process.env.RESEND_FROM_EMAIL) {
    return process.env.RESEND_FROM_EMAIL;
  }
  
  if (process.env.RESEND_PRODUCTION_FROM) {
    return process.env.RESEND_PRODUCTION_FROM;
  }

  if (isDevelopment()) {
    // In development, allow using custom domain if RESEND_DEV_FROM is set
    // Otherwise use onboarding domain for testing
    return process.env.RESEND_DEV_FROM || FALLBACK_DEV_FROM;
  }

  // Production: always use verified domain
  return FALLBACK_PROD_FROM;
};

export const sendEmail = async (to, template, data, options = {}) => {
  const envType = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  
  try {
    const resendClient = getResend();
    if (!resendClient) {
      const errorMsg = 'RESEND_API_KEY not configured. Email sending is disabled.';
      const errorDetails = {
        error: errorMsg,
        environment: envType,
        timestamp: new Date().toISOString(),
        template,
        recipient: to
      };
      
      console.error('❌ EMAIL CONFIGURATION ERROR:', errorDetails);
      console.error('   Set RESEND_API_KEY in your environment variables.');
      console.error('   Production: Add to Vercel environment variables');
      console.error('   Development: Add to .env.local file');
      
      // In production, also log to error tracking if available
      if (isProduction()) {
        console.error('   PRODUCTION ERROR: Email sending is disabled due to missing API key');
      }
      
      return { 
        success: false, 
        error: 'Email service not configured',
        details: errorMsg,
        ...errorDetails
      };
    }

    // Development mode safety check - only redirect if RESEND_DEV_REDIRECT is not explicitly disabled
    // This allows testing with actual user emails in development when needed
    const shouldRedirectInDev = isDevelopment() && 
                                 template !== 'newsletterWelcome' &&
                                 process.env.RESEND_DEV_REDIRECT !== 'false';
    
    if (shouldRedirectInDev) {
      const verifiedEmail = process.env.RESEND_DEV_REDIRECT_TO || 'elkiwebdesign@gmail.com';
      console.log(`Development mode: Redirecting email from ${to} to ${verifiedEmail}`);
      console.log(`   To disable redirect, set RESEND_DEV_REDIRECT=false in .env.local`);
      to = verifiedEmail;
    }

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found. Available templates: ${Object.keys(emailTemplates).join(', ')}`);
    }

    const subject = typeof emailTemplate.subject === 'function' 
      ? emailTemplate.subject(data.projectName, data.position, data.competitionType)
      : emailTemplate.subject;

    const html = emailTemplate.html(data);

    // Use development-friendly from address for localhost
    // In production, use verified domain
    const fromAddress = getFromAddress();
    
    // Extract domain from FROM address for validation
    const fromDomain = fromAddress.match(/@([^\s>]+)/)?.[1] || '';
    const isUsingCustomDomain = fromDomain && !fromDomain.includes('resend.dev') && !fromDomain.includes('onboarding');
    
    // Log configuration details
    console.log('📧 Email Configuration:', {
      from: fromAddress,
      fromDomain: fromDomain,
      isUsingCustomDomain,
      environment: envType,
      isProduction: isProduction(),
      isDevelopment: isDevelopment(),
      apiKeyConfigured: !!process.env.RESEND_API_KEY
    });

    const emailDetails = {
      template,
      to: Array.isArray(to) ? to : [to],
      from: fromAddress,
      subject,
      environment: envType,
      timestamp: new Date().toISOString()
    };

    console.log('📧 Sending email:', emailDetails);
    
    // Warn if using custom domain in production but might not be verified
    if (isProduction() && isUsingCustomDomain) {
      console.log(`   ⚠️  Using custom domain "${fromDomain}" - ensure it's verified in Resend: https://resend.com/domains`);
    }

    const result = await resendClient.emails.send({
      from: fromAddress,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      tags: [
        {
          name: 'category',
          value: template
        },
        {
          name: 'environment',
          value: envType
        },
        ...(options.tags || [])
      ]
    });

    if (result.error) {
      // Resend returned an error
      const errorDetails = {
        error: result.error.message,
        code: result.error.name,
        template,
        to: Array.isArray(to) ? to : [to],
        from: fromAddress,
        environment: envType,
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ EMAIL SEND FAILED:', errorDetails);
      
      // Provide helpful error messages
      let helpMessage = '';
      const errorMsg = result.error.message?.toLowerCase() || '';
      
      if (errorMsg.includes('domain') || errorMsg.includes('not verified') || errorMsg.includes('unverified')) {
        const domainFromAddress = fromAddress.match(/@([^\s>]+)/)?.[1] || 'unknown';
        helpMessage = `\n   💡 DOMAIN ERROR: The domain "${domainFromAddress}" is not verified in Resend\n` +
                     `   💡 Steps to fix:\n` +
                     `      1. Go to https://resend.com/domains\n` +
                     `      2. Verify that "${domainFromAddress}" is added and verified\n` +
                     `      3. Check that all DNS records (SPF, DKIM, MX) are correctly configured\n` +
                     `      4. Wait 15-30 minutes after adding DNS records for propagation\n` +
                     `      5. Click "Verify" in Resend dashboard\n`;
      } else if (errorMsg.includes('api key') || errorMsg.includes('unauthorized') || errorMsg.includes('authentication')) {
        helpMessage = `\n   💡 API KEY ERROR: Your RESEND_API_KEY is invalid or missing\n` +
                     `   💡 Steps to fix:\n` +
                     `      1. Get your API key from: https://resend.com/api-keys\n` +
                     `      2. Ensure it starts with "re_" and has "Full access" or "Sending access"\n` +
                     `      3. Add to environment variables:\n` +
                     `         - Production: Vercel → Settings → Environment Variables\n` +
                     `         - Development: .env.local file\n`;
      } else if (errorMsg.includes('from') || errorMsg.includes('sender')) {
        helpMessage = `\n   💡 FROM ADDRESS ERROR: The FROM address "${fromAddress}" is invalid\n` +
                     `   💡 Steps to fix:\n` +
                     `      1. Verify the domain in FROM address is added to Resend: https://resend.com/domains\n` +
                     `      2. Ensure the domain status is "Verified" (green checkmark)\n` +
                     `      3. Check FROM address format: "Name <email@domain.com>" or "email@domain.com"\n` +
                     `      4. For production, use: "AI Launch Space <noreply@resend.ailaunch.space>"\n`;
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('too many')) {
        helpMessage = `\n   💡 RATE LIMIT ERROR: You've exceeded Resend's sending limits\n` +
                     `   💡 Wait a few minutes before retrying\n`;
      }
      
      if (helpMessage) {
        console.error(helpMessage);
      }
      
      // In production, always log full error details for debugging
      if (isProduction()) {
        console.error('   PRODUCTION ERROR DETAILS:', JSON.stringify(errorDetails, null, 2));
        console.error('   FROM ADDRESS USED:', fromAddress);
        console.error('   RECIPIENT:', Array.isArray(to) ? to : [to]);
        console.error('   Check Resend dashboard: https://resend.com/emails');
      }
      
      return { 
        success: false, 
        error: result.error.message,
        code: result.error.name,
        ...errorDetails
      };
    }

    const successDetails = {
      emailId: result.data?.id,
      template,
      to: Array.isArray(to) ? to : [to],
      environment: envType,
      timestamp: new Date().toISOString()
    };

    console.log('✅ Email sent successfully:', successDetails);
    console.log(`   View in Resend: https://resend.com/emails/${result.data?.id}`);
    
    return { success: true, data: result.data, ...successDetails };
  } catch (error) {
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      template,
      to: Array.isArray(to) ? to : [to],
      environment: envType,
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ EMAIL SEND EXCEPTION:', errorDetails);
    
    // Provide more context for common errors
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      console.error('   💡 Network error: Check your internet connection or Resend API status');
    } else if (error.message?.includes('unauthorized') || error.message?.includes('API')) {
      console.error('   💡 API key error: Verify RESEND_API_KEY is correct and has proper permissions');
    } else if (error.message?.includes('domain')) {
      console.error('   💡 Domain error: Verify resend.ailaunch.space is verified in Resend dashboard');
    }
    
    // In production, always log full error details
    if (isProduction()) {
      console.error('   PRODUCTION EXCEPTION DETAILS:', JSON.stringify(errorDetails, null, 2));
    }
    
    return { 
      success: false, 
      error: error.message,
      ...errorDetails
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