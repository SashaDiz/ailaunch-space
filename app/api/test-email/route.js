import { NextResponse } from 'next/server';
import { Resend } from 'resend';

/**
 * Email Diagnostic and Testing Endpoint
 * 
 * This endpoint helps diagnose email configuration issues in production.
 * 
 * Usage:
 * - Production: https://ailaunch.space/api/test-email?to=your@email.com&secret=YOUR_SECRET
 * - Development: http://localhost:3000/api/test-email?to=your@email.com
 * 
 * Add TEST_EMAIL_SECRET to your environment variables for security
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const toEmail = searchParams.get('to');
    const secret = searchParams.get('secret');

    // Security check for production
    if (process.env.NODE_ENV === 'production') {
      const expectedSecret = process.env.TEST_EMAIL_SECRET;
      if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json({
          error: 'Unauthorized',
          message: 'Set TEST_EMAIL_SECRET environment variable and provide it as ?secret= parameter'
        }, { status: 401 });
      }
    }

    if (!toEmail) {
      return NextResponse.json({
        error: 'Missing parameter',
        message: 'Provide recipient email as ?to= parameter'
      }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return NextResponse.json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      }, { status: 400 });
    }

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {}
    };

    // Check 1: RESEND_API_KEY configured
    const apiKey = process.env.RESEND_API_KEY;
    diagnostics.checks.apiKeyConfigured = !!apiKey;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY not configured',
        message: 'Set RESEND_API_KEY in your environment variables',
        diagnostics
      }, { status: 500 });
    }

    diagnostics.checks.apiKeyFormat = apiKey.startsWith('re_');

    // Check 2: APP_URL configured
    diagnostics.checks.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'Not set';

    // Initialize Resend
    const resend = new Resend(apiKey);

    // Check 3: List domains
    try {
      const { data: domains, error: domainsError } = await resend.domains.list();
      
      if (domainsError) {
        diagnostics.checks.domains = {
          status: 'error',
          error: domainsError
        };
      } else {
        diagnostics.checks.domains = {
          status: 'success',
          count: domains?.data?.length || 0,
          domains: domains?.data?.map(d => ({
            name: d.name,
            status: d.status,
            region: d.region
          })) || []
        };

        // Check if ailaunch.space is verified
        const ailaunchDomain = domains?.data?.find(d => d.name === 'ailaunch.space');
        diagnostics.checks.ailaunchSpaceVerified = ailaunchDomain ? {
          verified: ailaunchDomain.status === 'verified',
          status: ailaunchDomain.status
        } : {
          verified: false,
          message: 'Domain not added to Resend'
        };
      }
    } catch (domainError) {
      diagnostics.checks.domains = {
        status: 'error',
        error: domainError.message
      };
    }

    // Determine FROM address
    const fromAddress = process.env.NODE_ENV === 'development' 
      ? 'AI Launch Space <onboarding@resend.dev>'
      : 'AI Launch Space <noreply@ailaunch.space>';

    diagnostics.checks.fromAddress = fromAddress;

    // Send test email
    const testEmailData = {
      from: fromAddress,
      to: toEmail,
      subject: '✅ Email Configuration Test - AI Launch Space',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Email Test</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; background: linear-gradient(135deg, #ED0D79, #8b5cf6); color: white; padding: 12px; border-radius: 12px; font-weight: bold; font-size: 18px; margin-bottom: 20px;">
                    ALS
                  </div>
                  <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                  <h1 style="color: #1f2937; margin: 0; font-size: 28px; font-weight: 700;">
                    Email Working!
                  </h1>
                </div>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <p style="color: #6b7280; margin: 0; font-size: 16px;">
                    Your email configuration is working correctly in <strong>${process.env.NODE_ENV}</strong> mode.
                  </p>
                </div>

                <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 16px;">Email Configuration</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #0c4a6e; font-size: 14px;">
                    <li style="margin-bottom: 8px;"><strong>From:</strong> ${fromAddress}</li>
                    <li style="margin-bottom: 8px;"><strong>Environment:</strong> ${process.env.NODE_ENV}</li>
                    <li style="margin-bottom: 8px;"><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
                    <li><strong>App URL:</strong> ${process.env.NEXT_PUBLIC_APP_URL || 'Not configured'}</li>
                  </ul>
                </div>

                <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; margin: 30px 0;">
                  <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">Next Steps:</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
                    <li style="margin-bottom: 8px;">Check that this email didn't go to spam</li>
                    <li style="margin-bottom: 8px;">Test user sign-up/confirmation flow</li>
                    <li style="margin-bottom: 8px;">Monitor Resend dashboard for delivery stats</li>
                    <li>Review Supabase authentication logs</li>
                  </ul>
                </div>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
                  <p style="color: #6b7280; font-size: 14px; margin: 0;">
                    This is a test email from AI Launch Space<br>
                    The AI Launch Space Team
                  </p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `,
      tags: [
        {
          name: 'category',
          value: 'test'
        }
      ]
    };

    const { data: emailData, error: emailError } = await resend.emails.send(testEmailData);

    if (emailError) {
      diagnostics.emailSend = {
        status: 'failed',
        error: emailError
      };

      return NextResponse.json({
        success: false,
        error: 'Failed to send test email',
        details: emailError,
        diagnostics,
        troubleshooting: {
          commonIssues: [
            'Domain not verified in Resend (if using production FROM address)',
            'Invalid API key',
            'Rate limit exceeded',
            'Invalid recipient email address'
          ],
          nextSteps: [
            'Check Resend dashboard: https://resend.com/emails',
            'Verify domain at: https://resend.com/domains',
            'Review domain DNS records',
            'Check API key is valid and has sending permissions'
          ]
        }
      }, { status: 500 });
    }

    diagnostics.emailSend = {
      status: 'success',
      emailId: emailData.id
    };

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      emailId: emailData.id,
      sentTo: toEmail,
      diagnostics,
      nextSteps: [
        'Check your inbox (and spam folder)',
        'View email details: https://resend.com/emails/' + emailData.id,
        'Test user authentication flows',
        'Check Supabase auth email templates'
      ]
    });

  } catch (error) {
    console.error('Test email error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

