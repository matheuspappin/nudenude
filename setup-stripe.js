const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-08-26.dahlia',
});

async function main() {
  try {
    const webhooks = await stripe.webhookEndpoints.list();
    const targetUrl = 'https://akaaicore.com/api/webhooks/stripe';
    
    let exists = false;
    for (const wh of webhooks.data) {
      if (wh.url === targetUrl) {
        console.log('Webhook already exists for: ' + targetUrl);
        console.log('Secret (might be hidden): ' + wh.secret);
        exists = true;
      }
    }

    if (!exists) {
      console.log('Creating webhook for ' + targetUrl);
      const webhookEndpoint = await stripe.webhookEndpoints.create({
        url: targetUrl,
        enabled_events: [
          'checkout.session.completed',
          'customer.subscription.created',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'payment_intent.succeeded',
        ],
      });
      console.log('Webhook created successfully!');
      console.log('NEW WEBHOOK SECRET: ' + webhookEndpoint.secret);
      console.log('Please update STRIPE_WEBHOOK_SECRET in your .env with this value.');
    }
  } catch (error) {
    console.error('Error configuring Stripe:', error);
  }
}

main();
