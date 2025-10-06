// Shared payment helpers to route between Razorpay and Stripe flows
// Keep logic centralized so screens can stay lean.

const COUNTRY_ALIASES = {
  INDIA: 'IN',
  INDIAN: 'IN',
};

const PLAN_COUNTRY_KEYS = ['country', 'countryCode', 'region', 'market'];
const PLAN_CURRENCY_KEYS = ['currencyCode', 'currency', 'baseCurrency'];

export function normalizeCountry(country) {
  if (!country) return '';
  const trimmed = String(country).trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (COUNTRY_ALIASES[upper]) return COUNTRY_ALIASES[upper];
  if (upper.length === 2) return upper;
  return upper;
}

export function isIndiaCountry(country) {
  return normalizeCountry(country) === 'IN';
}

export function extractPlanCountry(plan) {
  if (!plan) return '';
  for (const key of PLAN_COUNTRY_KEYS) {
    if (plan[key]) return plan[key];
  }
  return '';
}

export function extractPlanCurrency(plan) {
  if (!plan) return '';
  for (const key of PLAN_CURRENCY_KEYS) {
    if (plan[key]) return plan[key];
  }
  return '';
}

export function normalizeCurrency(currency) {
  if (!currency) return '';
  return String(currency).trim().toUpperCase();
}

export function getPlanGateway(plan) {
  const countryCode = normalizeCountry(extractPlanCountry(plan));
  const currency = normalizeCurrency(extractPlanCurrency(plan));
  if (countryCode === 'IN' || currency === 'INR') return 'razorpay';
  return 'stripe';
}

export function isGatewaySupportedForCountry(gateway, country) {
  const code = normalizeCountry(country);
  if (!gateway) return false;
  if (gateway === 'razorpay') return code === 'IN';
  if (gateway === 'stripe') return code !== 'IN';
  return false;
}

export default {
  normalizeCountry,
  isIndiaCountry,
  extractPlanCountry,
  extractPlanCurrency,
  normalizeCurrency,
  getPlanGateway,
  isGatewaySupportedForCountry,
};
