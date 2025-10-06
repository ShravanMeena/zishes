import axios from 'axios';
import { API_BASE } from '../config/api';
import { attachAuthInterceptors } from './http';

const client = attachAuthInterceptors(axios.create({ baseURL: API_BASE, timeout: 20000 }));

async function request(path, { method = 'GET', params, data, headers } = {}) {
  try {
    const res = await client.request({ url: path, method, params, data, headers });
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const body = err?.response?.data;
    const message = body?.message || body?.error || err?.message || 'Request failed';
    const e = new Error(message);
    e.status = status;
    e.data = body;
    throw e;
  }
}

// Razorpay
export async function getRazorpayKey() {
  const data = await request('/payments/razorpay/key');
  return data;
}

export async function createRazorpayTopup({ planId }) {
  if (!planId) throw new Error('planId is required');
  const data = await request('/payments/razorpay/topup', { method: 'POST', data: { planId } });
  return data;
}

export async function createRazorpaySubscription({ planId, totalCount, customerNotify }) {
  if (!planId) throw new Error('planId is required');
  const payload = { planId };
  if (totalCount != null) payload.totalCount = totalCount;
  if (customerNotify != null) payload.customerNotify = customerNotify;
  const data = await request('/payments/razorpay/subscribe', { method: 'POST', data: payload });
  return data;
}

export async function getRazorpayActiveSubscription() {
  const data = await request('/payments/razorpay/subscription');
  console.log(data,"datadatadatadatadatadatadatadata")
  return data;
}

export async function cancelRazorpaySubscription() {
  const data = await request('/payments/razorpay/unsubscribe', { method: 'POST' });
  return data;
}

// Stripe
export async function getStripeKey() {
  const data = await request('/payments/stripe/key');
  return data;
}

export async function createStripeTopupIntent({ planId }) {
  if (!planId) throw new Error('planId is required');
  const data = await request('/payments/stripe/topup', { method: 'POST', data: { planId } });
  return data;
}

export async function createStripeAccountSession() {
  const data = await request('/payments/stripe/account/session', { method: 'POST' });
  return data;
}

export default {
  // Razorpay
  getRazorpayKey,
  createRazorpayTopup,
  createRazorpaySubscription,
  getRazorpayActiveSubscription,
  cancelRazorpaySubscription,
  // Stripe
  getStripeKey,
  createStripeTopupIntent,
  createStripeAccountSession,
};
