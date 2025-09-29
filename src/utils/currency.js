const CURRENCY_MAP = [
  {
    keys: ['india', 'in'],
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },
  {
    keys: ['united arab emirates', 'uae', 'ae'],
    code: 'AED',
    symbol: 'د.إ',
    locale: 'en-AE',
  },
];

const DEFAULT_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  locale: 'en-IN',
};

function normalize(input) {
  if (!input) return '';
  return String(input).trim().toLowerCase();
}

export function getCurrencyConfig(countryLike) {
  const normalized = normalize(countryLike);
  if (normalized) {
    for (const entry of CURRENCY_MAP) {
      if (entry.keys.some((key) => normalized === key)) {
        return entry;
      }
      if (entry.keys.some((key) => normalized.includes(key))) {
        return entry;
      }
    }
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencySymbol(countryLike) {
  return getCurrencyConfig(countryLike).symbol;
}

export function getCurrencyCode(countryLike) {
  return getCurrencyConfig(countryLike).code;
}

function resolveConfig(country, config) {
  if (config && typeof config === 'object') return config;
  return getCurrencyConfig(country);
}

export function formatCurrency(value, { country, config, maximumFractionDigits = 2, minimumFractionDigits = 0 } = {}) {
  const resolved = resolveConfig(country, config);
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `${resolved.symbol} 0`;
  try {
    return new Intl.NumberFormat(resolved.locale, {
      style: 'currency',
      currency: resolved.code,
      maximumFractionDigits,
      minimumFractionDigits,
    }).format(amount);
  } catch (_) {
    // Fallback when Intl.NumberFormat fails (older engines)
    return `${resolved.symbol} ${amount.toFixed(Math.min(2, maximumFractionDigits))}`;
  }
}

export function formatNumber(value, { country, config, maximumFractionDigits = 0 } = {}) {
  const resolved = resolveConfig(country, config);
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '0';
  try {
    return new Intl.NumberFormat(resolved.locale, {
      maximumFractionDigits,
    }).format(amount);
  } catch (_) {
    return amount.toFixed(Math.min(2, maximumFractionDigits));
  }
}

export default {
  getCurrencyConfig,
  getCurrencySymbol,
  getCurrencyCode,
  formatCurrency,
  formatNumber,
};
