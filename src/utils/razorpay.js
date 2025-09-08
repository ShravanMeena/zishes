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
  console.log(options,"optionsoptions")
  const RazorpayCheckout = resolveRazorpayModule();
  return new Promise((resolve, reject) => {
    try {
      RazorpayCheckout.open(options)
        .then((data) => resolve(data))
        .catch((err) => reject(err));
    } catch (e) {
      reject(e);
    }
  });
}

export default { openRazorpayCheckout };
