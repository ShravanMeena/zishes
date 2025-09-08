// Lightweight wrapper to open Razorpay Checkout safely
// Handles ESM/CJS interop and provides clearer errors if not linked

function resolveRazorpayModule() {
  let mod;
  try {
    // Dynamic require to avoid bundling errors if not installed yet
    // eslint-disable-next-line global-require
    mod = require('react-native-razorpay');
  } catch (e) {
    const err = new Error('Razorpay SDK not installed');
    err.code = 'RAZORPAY_SDK_MISSING';
    throw err;
  }

  const candidate = (mod && (mod.default || mod)) || null;
  if (candidate && typeof candidate.open === 'function') return candidate;

  // Some builds can namespace the class
  if (mod && mod.RazorpayCheckout && typeof mod.RazorpayCheckout.open === 'function') {
    return mod.RazorpayCheckout;
  }

  const err = new Error('Razorpay SDK linked incorrectly. Rebuild iOS and run pod install.');
  err.code = 'RAZORPAY_OPEN_UNAVAILABLE';
  throw err;
}

export async function openRazorpayCheckout(options) {
  try {
    const sanitized = {
      ...options,
      // Avoid logging sensitive values in full
      key: options?.key ? `${String(options.key).slice(0, 6)}…` : undefined,
    };
    console.log('[RZP][OPEN] Options:', JSON.stringify(sanitized));
  } catch {}

  const RazorpayCheckout = resolveRazorpayModule();
  return new Promise((resolve, reject) => {
    try {
      RazorpayCheckout.open(options)
        .then((data) => {
          try { console.log('[RZP][OPEN] Success:', JSON.stringify(data)); } catch {}
          resolve(data);
        })
        .catch((err) => {
          try { console.warn('[RZP][OPEN] Error:', JSON.stringify(err)); } catch {}
          reject(err);
        });
    } catch (e) {
      try { console.warn('[RZP][OPEN] Exception:', e?.message || String(e)); } catch {}
      reject(e);
    }
  });
}

export default { openRazorpayCheckout };
