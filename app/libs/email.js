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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                  Need help? Contact us at hello@ailaunch.space<br>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                  Need help? Contact us at hello@ailaunch.space<br>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <a href="mailto:hello@ailaunch.space" 
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                  Questions? Contact us at hello@ailaunch.space<br>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                  Need help? Contact us immediately at hello@ailaunch.space<br>
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
                <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  ALS
                </div>
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
                  Questions? Reply to this email or contact us at hello@ailaunch.space<br>
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

export const sendEmail = async (to, template, data, options = {}) => {
  try {
    const resendClient = getResend();
    if (!resendClient) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    // Development mode safety check - only redirect for non-newsletter emails
    if (process.env.NODE_ENV === 'development' && template !== 'newsletterWelcome') {
      const verifiedEmail = 'elkiwebdesign@gmail.com';
      console.log(`Development mode: Redirecting email from ${to} to ${verifiedEmail}`);
      to = verifiedEmail;
    }

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const subject = typeof emailTemplate.subject === 'function' 
      ? emailTemplate.subject(data.projectName, data.position, data.competitionType)
      : emailTemplate.subject;

    const html = emailTemplate.html(data);

    // Use development-friendly from address for localhost
    const fromAddress = process.env.NODE_ENV === 'development' 
      ? 'AI Launch Space <onboarding@resend.dev>'
      : 'AI Launch Space <noreply@ailaunch.space>';

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
        ...(options.tags || [])
      ]
    });

    console.log('Email sent successfully:', result.data?.id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
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