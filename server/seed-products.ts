import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  const products = await stripe.products.search({ query: "name:'Full Marketing Audit Report'" });
  if (products.data.length > 0) {
    console.log('Product already exists:', products.data[0].id);
    const prices = await stripe.prices.list({ product: products.data[0].id, active: true });
    console.log('Price:', prices.data[0]?.id, '$' + (prices.data[0]?.unit_amount || 0) / 100);
    return;
  }

  const product = await stripe.products.create({
    name: 'Full Marketing Audit Report',
    description: 'Unlock detailed findings, agent reports, 6-month action plan, and downloadable PDF report for your marketing audit.',
    metadata: {
      type: 'one_time_audit',
    },
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: 9900,
    currency: 'usd',
  });

  console.log('Created product:', product.id);
  console.log('Created price:', price.id, '- $99.00');
}

createProducts().catch(console.error);
