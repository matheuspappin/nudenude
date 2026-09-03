import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-08-26.dahlia',
  appInfo: {
    name: 'CreatorDance Platform',
    version: '0.1.0',
  },
});

export const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn('STRIPE_SECRET_KEY is not set in environment variables.');
    return null;
  }
  return stripe;
};
