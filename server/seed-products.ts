import { getUncachableStripeClient } from './stripeClient';

async function seedProducts() {
  console.log('Creating Stripe products...');
  
  const stripe = await getUncachableStripeClient();

  const existingProducts = await stripe.products.search({ query: "name:'MedNote AI'" });
  if (existingProducts.data.length > 0) {
    console.log('Products already exist, skipping creation.');
    console.log('Existing products:', existingProducts.data.map(p => p.name).join(', '));
    
    const prices = await stripe.prices.list({ active: true, limit: 10 });
    for (const price of prices.data) {
      const product = await stripe.products.retrieve(price.product as string);
      console.log(`Price: ${price.id} - ${product.name} - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval || 'one-time'}`);
    }
    return;
  }

  const product = await stripe.products.create({
    name: 'MedNote AI Pro',
    description: 'Unlimited AI-powered medical note generation with all premium features',
    metadata: {
      app: 'mednote-ai',
    },
  });
  console.log('Created product:', product.id);

  const monthlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 1500,
    currency: 'usd',
    recurring: { interval: 'month' },
    metadata: {
      plan: 'monthly',
    },
  });
  console.log('Created monthly price:', monthlyPrice.id, '- $15/month');

  const yearlyPrice = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: { interval: 'year' },
    metadata: {
      plan: 'yearly',
    },
  });
  console.log('Created yearly price:', yearlyPrice.id, '- $99/year');

  console.log('\nProducts created successfully!');
  console.log('Monthly price ID:', monthlyPrice.id);
  console.log('Yearly price ID:', yearlyPrice.id);
  console.log('\nUpdate your subscription page to use these price IDs.');
}

seedProducts().catch(console.error);
