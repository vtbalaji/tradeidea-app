import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Initialize Razorpay instance (server-side only)
 */
export function getRazorpayInstance(): Razorpay {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials not configured');
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

/**
 * Create a Razorpay order for payment
 */
export async function createRazorpayOrder(params: {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: params.amount,
    currency: params.currency,
    receipt: params.receipt,
    notes: params.notes,
  });

  return order;
}

/**
 * Verify Razorpay payment signature
 */
export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const { orderId, paymentId, signature } = params;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay key secret not configured');
  }

  const body = orderId + '|' + paymentId;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    throw new Error('Razorpay webhook secret not configured');
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Get Razorpay payment details
 */
export async function getPaymentDetails(paymentId: string) {
  const razorpay = getRazorpayInstance();
  const payment = await razorpay.payments.fetch(paymentId);
  return payment;
}

/**
 * Create Razorpay customer
 */
export async function createRazorpayCustomer(params: {
  name: string;
  email: string;
  contact: string;
}) {
  const razorpay = getRazorpayInstance();

  const customer = await razorpay.customers.create({
    name: params.name,
    email: params.email,
    contact: params.contact,
  });

  return customer;
}

/**
 * Refund a payment
 */
export async function refundPayment(paymentId: string, amount?: number) {
  const razorpay = getRazorpayInstance();

  const refund = await razorpay.payments.refund(paymentId, {
    amount: amount, // Optional - full refund if not specified
  });

  return refund;
}
