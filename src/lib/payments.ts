import type { PaymentGateway } from './shop';

export type PaymentResult = {
  ok: true;
  transactionId: string;
  gateway: PaymentGateway;
  amountInr: number;
} | {
  ok: false;
  gateway: PaymentGateway;
  error: string;
};

const rand = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 10).toUpperCase()}${Date.now().toString(36).toUpperCase()}`;

/**
 * Mock payment flow. Real integrations:
 *   - Razorpay: load `checkout.razorpay.com/v1/checkout.js`, create an order
 *     via backend `/api/razorpay/order` (server-side key), then invoke
 *     `new (window as any).Razorpay(options).open()`.
 *   - Stripe: load `@stripe/stripe-js`, create a PaymentIntent server-side,
 *     confirm with `stripe.confirmPayment({ clientSecret, ... })`.
 *
 * We keep the async shape identical so swapping in the real SDK is a one-file change.
 */
export const processPayment = async (
  gateway: PaymentGateway,
  amountInr: number,
): Promise<PaymentResult> => {
  await new Promise((r) => setTimeout(r, 1200));
  if (amountInr <= 0) {
    return { ok: false, gateway, error: 'Amount must be greater than zero.' };
  }
  // Simulated 3% failure rate so the error path gets exercised during testing.
  if (Math.random() < 0.03) {
    return { ok: false, gateway, error: 'Payment authorisation declined by issuer.' };
  }
  const prefix = gateway === 'razorpay' ? 'rzp_pay' : 'pi_stripe';
  return {
    ok: true,
    gateway,
    amountInr,
    transactionId: rand(prefix),
  };
};

export const gatewayLabel: Record<PaymentGateway, string> = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
};

export const gatewayBlurb: Record<PaymentGateway, string> = {
  razorpay: 'UPI, cards, netbanking, wallets — INR domestic.',
  stripe: 'Cards, Apple Pay, Google Pay — international.',
};
