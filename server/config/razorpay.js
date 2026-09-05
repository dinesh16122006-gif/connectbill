const Razorpay = require('razorpay');
const crypto = require('crypto');

const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder';
const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_secret_placeholder';
const isSimulate = process.env.RAZORPAY_SIMULATE === 'true' || key_id.includes('placeholder');

let razorpayInstance = null;

try {
  if (!isSimulate && key_id && key_secret) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret
    });
  }
} catch (err) {
  console.warn('[Razorpay] Failed to initialize live instance. Fallback to simulation mode:', err.message);
}

const verifySignature = (orderId, paymentId, signature) => {
  if (isSimulate && signature && signature.startsWith('sim_sig_')) {
    // Valid simulated signature
    return true;
  }
  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

module.exports = {
  razorpayInstance,
  isSimulate,
  keyId: key_id,
  verifySignature
};
