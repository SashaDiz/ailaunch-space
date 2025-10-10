import { 
  lemonSqueezySetup, 
  createCheckout,
  getCheckout,
  listOrders,
  getOrder
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from 'crypto';

// Configuration flag
let isConfigured = false;

// Configuration function for proper setup validation
function configureLemonSqueezy() {
  // Skip configuration during build time if environment variables are missing
  const requiredVars = [
    'LEMONSQUEEZY_API_KEY',
    'LEMONSQUEEZY_STORE_ID',
    'LEMONSQUEEZY_WEBHOOK_SECRET'
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    // Fallback to legacy environment variable names for backward compatibility
    const legacyMapping = {
      'LEMONSQUEEZY_API_KEY': 'LS_API_KEY',
      'LEMONSQUEEZY_STORE_ID': 'LS_STORE_ID', 
      'LEMONSQUEEZY_WEBHOOK_SECRET': 'LS_SIGNING_SECRET'
    };

    const stillMissing = missingVars.filter(varName => !process.env[legacyMapping[varName]]);
    
    if (stillMissing.length > 0) {
      // During build time, just log a warning instead of throwing
      if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
        console.warn(
          `Lemon Squeezy configuration skipped during build: Missing ${stillMissing.join(', ')}. This is expected during build time.`
        );
        return false;
      }
      throw new Error(
        `Missing required LEMONSQUEEZY env variables: ${stillMissing.join(', ')}. Please set them in your environment.`
      );
    }
  }

  // Use new env vars if available, fallback to legacy ones
  const apiKey = process.env.LEMONSQUEEZY_API_KEY || process.env.LS_API_KEY;
  
  lemonSqueezySetup({ 
    apiKey,
    onError: (error) => console.error("Lemon Squeezy Error:", error),
  });
  
  return true;
}

// Initialize Lemon Squeezy with proper validation
// Only configure if not in build mode
try {
  isConfigured = configureLemonSqueezy();
  if (isConfigured) {
    console.log('Lemon Squeezy SDK initialized successfully');
  }
} catch (error) {
  console.error('Lemon Squeezy configuration failed:', error.message);
}

// Helper function to ensure configuration before use
function ensureConfigured() {
  if (!isConfigured) {
    isConfigured = configureLemonSqueezy();
  }
  if (!isConfigured) {
    throw new Error('Lemon Squeezy is not configured. Please check your environment variables.');
  }
}

// Payment plans configuration
export const paymentPlans = {
  standard: {
    name: "Standard",
    price: 0,
    variantId: null, // Free plan
    features: [
      "Basic directory listing",
      "30 days on homepage",
      "Community support",
      "Standard submission queue"
    ],
    limits: {
      homepage_duration: 30,
      guaranteed_backlinks: 0,
      premium_badge: false,
      skip_queue: false,
      social_promotion: false,
      priority_support: false,
    }
  },
  premium: {
    name: "Premium",
    price: 15,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID || process.env.LS_VARIANT_ID,
    features: [
      "Premium badge",
      "Skip review queue",
      "3 guaranteed dofollow backlinks",
      "Priority listing placement",
      "Detailed analytics",
      "Direct founder outreach",
      "Social media promotion"
    ],
    limits: {
      homepage_duration: 7,
      guaranteed_backlinks: 3,
      premium_badge: true,
      skip_queue: true,
      social_promotion: true,
      priority_support: true,
      detailed_analytics: true,
      founder_outreach: true,
    }
  }
};

// Create Lemonsqueezy checkout session
export async function createCheckoutSession({
  planType,
  customerEmail,
  directoryData,
  successUrl,
  cancelUrl,
  userId
}) {
  try {
    ensureConfigured();
    const plan = paymentPlans[planType];
    
    if (!plan || plan.price === 0) {
      throw new Error("Invalid plan or free plan selected");
    }

    // Use environment variable directly for premium plan (with fallback support)
    const variantId = planType === "premium" ? 
      (process.env.LEMONSQUEEZY_VARIANT_ID || process.env.LS_VARIANT_ID) : 
      plan.variantId;
    
    if (!variantId) {
      throw new Error(`Variant ID not configured for ${planType} plan`);
    }

    console.log('Using variantId:', variantId, 'for plan:', planType);

    const checkoutData = {
      storeId: process.env.LEMONSQUEEZY_STORE_ID || process.env.LS_STORE_ID,
      variantId: variantId,
      attributes: {
        checkout_options: {
          embed: false, // Disable embed, use direct redirect
          media: true,
          logo: true,
        },
        checkout_data: {
          email: customerEmail,
          name: directoryData.name || "",
          custom: {
            user_id: userId,
            directory_name: directoryData.name,
            directory_slug: directoryData.slug || '',
            plan_type: planType,
          }
        },
        product_options: {
          enabled_variants: [variantId],
          redirect_url: successUrl,
          receipt_button_text: "Complete AI Project Launch",
          receipt_link_url: successUrl,
          receipt_thank_you_note: `🎉 Payment successful! IMPORTANT: Copy this link and paste it in your browser to complete your AI project submission: ${successUrl}
          
If the automatic redirect doesn't work, manually visit: ${successUrl}`,
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }
    };

    console.log('Sending checkout request with:', {
      storeId: checkoutData.storeId,
      variantId: checkoutData.variantId,
      customerEmail,
      planType,
      successUrl
    });
    
    console.log('Full checkout attributes:', JSON.stringify(checkoutData.attributes, null, 2));

    const response = await createCheckout(
      checkoutData.storeId,
      checkoutData.variantId,
      checkoutData.attributes
    );

    console.log('Lemonsqueezy API Response:', JSON.stringify(response, null, 2));

    if (response.error) {
      throw new Error(`Checkout creation failed: ${response.error.message}`);
    }

    // Lemonsqueezy API returns a nested structure: response.data.data.attributes.url
    if (!response.data || !response.data.data) {
      console.error('Invalid response structure:', response);
      throw new Error(`Invalid response structure from Lemonsqueezy API`);
    }

    const responseData = response.data.data;
    const checkoutUrl = responseData.attributes?.url;

    if (!checkoutUrl) {
      console.error('No URL found in response attributes:', responseData.attributes);
      throw new Error(`No checkout URL found in Lemonsqueezy response`);
    }

    return {
      checkoutId: responseData.id,
      url: checkoutUrl,
      checkoutData: responseData
    };

  } catch (error) {
    console.error('Lemonsqueezy checkout session creation failed:', error);
    throw new Error(`Payment session creation failed: ${error.message}`);
  }
}

// Verify payment session
export async function verifyPaymentSession(checkoutId) {
  try {
    ensureConfigured();
    const response = await getCheckout(checkoutId);

    if (response.error) {
      throw new Error(`Checkout verification failed: ${response.error.message}`);
    }

    const checkout = response.data;
    const isCompleted = checkout.attributes.status === 'paid';

    return {
      success: isCompleted,
      checkout,
      metadata: checkout.attributes.checkout_data?.custom || {},
      amountPaid: checkout.attributes.total / 100, // Convert from cents
      currency: checkout.attributes.currency,
      status: checkout.attributes.status,
      orderId: checkout.attributes.order_id
    };

  } catch (error) {
    console.error('Payment verification failed:', error);
    throw new Error(`Payment verification failed: ${error.message}`);
  }
}

// Get order details
export async function getOrderDetails(orderId) {
  try {
    ensureConfigured();
    const response = await getOrder(orderId);

    if (response.error) {
      throw new Error(`Order lookup failed: ${response.error.message}`);
    }

    return {
      success: true,
      order: response.data,
      status: response.data.attributes.status,
      total: response.data.attributes.total,
      currency: response.data.attributes.currency,
      customerEmail: response.data.attributes.user_email,
      metadata: response.data.attributes.meta || {}
    };

  } catch (error) {
    console.error('Order lookup failed:', error);
    throw new Error(`Order lookup failed: ${error.message}`);
  }
}

// Webhook signature verification with timing-safe comparison
// Following official LemonSqueezy documentation
export function verifyWebhookSignature(rawBody, signature, secret) {
  try {
    // Create HMAC digest from raw body
    const hmac = crypto.createHmac('sha256', secret);
    const digest = Buffer.from(hmac.update(rawBody).digest('hex'), 'utf8');
    
    // Convert signature to buffer (signature comes from X-Signature header)
    const signatureBuffer = Buffer.from(signature || '', 'utf8');
    
    // Check if both buffers have the same length to avoid timingSafeEqual error
    if (digest.length !== signatureBuffer.length) {
      return false;
    }
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(digest, signatureBuffer);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return false; // Return false instead of throwing to allow graceful handling
  }
}

// Get payment analytics
export async function getPaymentAnalytics(storeId, startDate, endDate) {
  try {
    ensureConfigured();
    // Get orders in date range
    const response = await listOrders({
      filter: {
        storeId: storeId,
        createdAfter: startDate.toISOString(),
        createdBefore: endDate.toISOString()
      }
    });

    if (response.error) {
      throw new Error(`Analytics failed: ${response.error.message}`);
    }

    const orders = response.data || [];

    // Calculate analytics
    const analytics = {
      totalRevenue: 0,
      totalTransactions: orders.length,
      successfulPayments: 0,
      failedPayments: 0,
      refunds: 0,
      planBreakdown: {
        premium: 0
      }
    };

    orders.forEach(order => {
      const status = order.attributes.status;
      const total = order.attributes.total / 100; // Convert from cents
      
      if (status === 'paid') {
        analytics.totalRevenue += total;
        analytics.successfulPayments++;
        
        // Track by plan type from metadata
        const planType = order.attributes.meta?.custom?.plan_type;
        if (planType && analytics.planBreakdown[planType] !== undefined) {
          analytics.planBreakdown[planType]++;
        }
      } else if (status === 'failed') {
        analytics.failedPayments++;
      }
      
      if (status === 'refunded') {
        analytics.refunds++;
      }
    });

    return analytics;

  } catch (error) {
    console.error('Payment analytics failed:', error);
    throw new Error(`Analytics retrieval failed: ${error.message}`);
  }
}

// Export utility functions
export const lemonSqueezyUtils = {
  formatAmount: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  },
  
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString();
  },
  
  getStatusDisplay: (status) => {
    const statusMap = {
      'paid': 'Paid',
      'pending': 'Pending',
      'failed': 'Failed',
      'refunded': 'Refunded',
      'cancelled': 'Cancelled'
    };
    return statusMap[status] || status;
  },

  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
};

// Default export
export default {
  paymentPlans,
  createCheckoutSession,
  verifyPaymentSession,
  getOrderDetails,
  verifyWebhookSignature,
  getPaymentAnalytics,
  lemonSqueezyUtils
};