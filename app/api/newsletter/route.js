import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/libs/supabase.js';
import { sendEmail } from '@/libs/email.js';

export async function POST(request) {
  try {
    const { email, source = 'website' } = await request.json();

    // Validate email
    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email is already subscribed
    const { data: existingSubscription, error: checkError } = await supabase
      .from('newsletter')
      .select('id, status, source')
      .eq('email', normalizedEmail)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing subscription:', checkError);
      return NextResponse.json(
        { error: 'Failed to process subscription' },
        { status: 500 }
      );
    }

    // Handle existing subscription
    if (existingSubscription) {
      if (existingSubscription.status === 'subscribed') {
        return NextResponse.json(
          { 
            error: 'This email is already subscribed to our newsletter',
            code: 'ALREADY_SUBSCRIBED'
          },
          { status: 409 }
        );
      } else if (existingSubscription.status === 'unsubscribed') {
        // Resubscribe the user
        const { error: updateError } = await supabase
          .from('newsletter')
          .update({
            status: 'subscribed',
            source: source,
            subscribed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('email', normalizedEmail);

        if (updateError) {
          console.error('Error resubscribing user:', updateError);
          return NextResponse.json(
            { error: 'Failed to resubscribe' },
            { status: 500 }
          );
        }

        // Send welcome email for resubscription
        try {
          await sendEmail(normalizedEmail, 'newsletterWelcome', {
            email: normalizedEmail,
            source: source,
            isResubscription: true
          });
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // Don't fail the subscription if email fails
        }

        return NextResponse.json({
          message: 'Successfully resubscribed to our newsletter!',
          isResubscription: true
        });
      }
    }

    // Create new subscription
    const { data: subscription, error: insertError } = await supabase
      .from('newsletter')
      .insert({
        email: normalizedEmail,
        status: 'subscribed',
        source: source,
        subscribed_at: new Date().toISOString(),
        preferences: {
          weekly_digest: true,
          new_launches: true,
          featured_apps: true,
          competition_updates: true,
          partner_promotions: false
        }
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating newsletter subscription:', insertError);
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    // Send welcome email
    try {
      await sendEmail(normalizedEmail, 'newsletterWelcome', {
        email: normalizedEmail,
        source: source,
        isResubscription: false
      });
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the subscription if email fails
    }

    // Log subscription event for analytics
    try {
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'newsletter_subscription',
          event_data: {
            email: normalizedEmail,
            source: source,
            timestamp: new Date().toISOString()
          }
        });
    } catch (analyticsError) {
      console.error('Error logging subscription event:', analyticsError);
      // Don't fail the subscription if analytics fails
    }

    return NextResponse.json({
      message: 'Successfully subscribed to our newsletter!',
      subscription: {
        id: subscription.id,
        email: subscription.email,
        source: subscription.source
      }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const { data: subscription, error } = await supabase
      .from('newsletter')
      .select('id, email, status, source, preferences, subscribed_at')
      .eq('email', email.trim().toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscription status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      subscribed: !!subscription && subscription.status === 'subscribed',
      subscription: subscription || null
    });

  } catch (error) {
    console.error('Newsletter status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { email } = await request.json();

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const normalizedEmail = email.trim().toLowerCase();

    // Update subscription status to unsubscribed
    const { error } = await supabase
      .from('newsletter')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Successfully unsubscribed from newsletter'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
