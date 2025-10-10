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
  directoryApproved: {
    subject: (directoryName) => `🎉 ${directoryName} has been approved on AI Launch Space!`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>AI Project Approved</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  AI
                </div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Congratulations! 🎉
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.directoryName} is now live!
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  Your AI project has been approved and is now visible on AI Launch Space.
                </p>
              </div>

              <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">What happens next?</h3>
                <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                  <li style="margin-bottom: 8px;">Your AI project is now live and accepting votes</li>
                  <li style="margin-bottom: 8px;">Users can discover and visit your project</li>
                  <li style="margin-bottom: 8px;">Track your performance in your dashboard</li>
                  <li>Compete in weekly competitions for top 3 positions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/directory/${data.slug}" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Your AI Project
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

  directoryRejected: {
    subject: (directoryName) => `AI project submission update: ${directoryName}`,
    html: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>AI Project Update</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  AI
                </div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Submission Update
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.directoryName}
                </h2>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  We've reviewed your AI project submission and have some feedback.
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
                  <li style="margin-bottom: 8px;">Resubmit your AI project</li>
                  <li>Contact us if you have questions</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  Submit Again
                </a>
                <a href="mailto:hello@ailaunchspace.com" 
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

  competitionWinner: {
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
                <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                  DH
                </div>
                <div style="font-size: 48px; margin-bottom: 10px;">🏆</div>
                <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                  Amazing Achievement!
                </h1>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 22px;">
                  ${data.directoryName} placed #${data.position}!
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
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/directory/${data.slug}" 
                   style="display: inline-block; background: #3b82f6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">
                  View Directory
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
  }
};

export const sendEmail = async (to, template, data) => {
  try {
    const resendClient = getResend();
    if (!resendClient) {
      console.warn('RESEND_API_KEY not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const subject = typeof emailTemplate.subject === 'function' 
      ? emailTemplate.subject(data.directoryName, data.position)
      : emailTemplate.subject;

    const html = emailTemplate.html(data);

    const result = await resendClient.emails.send({
      from: 'AI Launch Space <hello@ailaunchspace.com>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    console.log('Email sent successfully:', result.data?.id);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Utility functions for common email scenarios
export const emailNotifications = {
  async directoryApproved(userEmail, directoryData) {
    return await sendEmail(userEmail, 'directoryApproved', directoryData);
  },

  async directoryRejected(userEmail, directoryData) {
    return await sendEmail(userEmail, 'directoryRejected', directoryData);
  },

  async competitionWinner(userEmail, competitionData) {
    return await sendEmail(userEmail, 'competitionWinner', competitionData);
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