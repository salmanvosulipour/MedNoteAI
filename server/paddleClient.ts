import { Paddle, Environment } from '@paddle/paddle-node-sdk';

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

let paddleClient: Paddle | null = null;

export function getPaddleClient(): Paddle {
  if (!paddleClient) {
    if (!PADDLE_API_KEY) {
      throw new Error('PADDLE_API_KEY not configured');
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    paddleClient = new Paddle(PADDLE_API_KEY, {
      environment: isProduction ? Environment.production : Environment.sandbox,
    });
  }
  return paddleClient;
}

export function getWebhookSecret(): string {
  if (!PADDLE_WEBHOOK_SECRET) {
    throw new Error('PADDLE_WEBHOOK_SECRET not configured');
  }
  return PADDLE_WEBHOOK_SECRET;
}

export async function verifyPaddleWebhook(rawBody: string, signature: string) {
  const paddle = getPaddleClient();
  const secret = getWebhookSecret();
  return paddle.webhooks.unmarshal(rawBody, secret, signature);
}
