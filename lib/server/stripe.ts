import 'server-only';

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada.');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  });

  return stripeClient;
}

export function getStripeStringId(
  value: string | Stripe.PaymentIntent | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
) {
  if (!value) {
    return null;
  }

  return typeof value === 'string' ? value : value.id;
}
