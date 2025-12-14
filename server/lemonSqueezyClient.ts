import { lemonSqueezySetup, createCheckout, getSubscription } from '@lemonsqueezy/lemonsqueezy.js';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

let isSetup = false;

export function setupLemonSqueezy() {
  if (isSetup) return;
  
  if (!LEMONSQUEEZY_API_KEY) {
    console.warn('LEMONSQUEEZY_API_KEY not configured');
    return;
  }

  lemonSqueezySetup({
    apiKey: LEMONSQUEEZY_API_KEY,
    onError: (error) => console.error('Lemon Squeezy Error:', error),
  });
  
  isSetup = true;
}

export function getStoreId(): string {
  if (!LEMONSQUEEZY_STORE_ID) {
    throw new Error('LEMONSQUEEZY_STORE_ID not configured');
  }
  return LEMONSQUEEZY_STORE_ID;
}

export function getWebhookSecret(): string {
  if (!LEMONSQUEEZY_WEBHOOK_SECRET) {
    throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET not configured');
  }
  return LEMONSQUEEZY_WEBHOOK_SECRET;
}

export async function createLemonSqueezyCheckout(
  variantId: string,
  userEmail: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  setupLemonSqueezy();
  
  const storeId = getStoreId();
  
  const { data, error } = await createCheckout(storeId, variantId, {
    checkoutData: {
      email: userEmail,
      custom: {
        user_id: userId,
      },
    },
    checkoutOptions: {
      embed: false,
    },
    productOptions: {
      enabledVariants: [parseInt(variantId)],
      redirectUrl: successUrl,
    },
  });

  if (error) {
    console.error('Lemon Squeezy checkout error:', error);
    throw new Error(error.message || 'Failed to create checkout');
  }

  const checkoutUrl = data?.data?.attributes?.url;
  if (!checkoutUrl) {
    throw new Error('No checkout URL returned');
  }

  return checkoutUrl;
}

export async function getLemonSqueezySubscription(subscriptionId: string) {
  setupLemonSqueezy();
  
  const { data, error } = await getSubscription(subscriptionId);

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data?.data?.attributes;
}

export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const secret = getWebhookSecret();
  
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  
  return signature === digest;
}
