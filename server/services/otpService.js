// In-memory OTP store with TTL and attempt counter
// In production, this can be backed by Redis or an external SMS API (Twilio, Msg91, Fast2SMS)
const otpStore = new Map();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 OTP per minute per phone

const isMockMode = process.env.MOCK_OTP_MODE !== 'false';
const fixedDevOtp = process.env.FIXED_DEV_OTP || '123456';

const generateOtp = () => {
  if (isMockMode && fixedDevOtp) {
    return fixedDevOtp;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOtp = async (phone) => {
  const sanitizedPhone = phone.replace(/\D/g, '').slice(-10);

  if (sanitizedPhone.length !== 10) {
    throw new Error('Invalid mobile number. Please enter a 10-digit mobile number.');
  }

  const existing = otpStore.get(sanitizedPhone);
  const now = Date.now();

  // Rate limiting check
  if (existing && existing.lastRequestedAt && (now - existing.lastRequestedAt < RATE_LIMIT_WINDOW_MS)) {
    const waitSeconds = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - existing.lastRequestedAt)) / 1000);
    throw new Error(`Please wait ${waitSeconds}s before requesting a new OTP.`);
  }

  const otp = generateOtp();

  otpStore.set(sanitizedPhone, {
    otp,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastRequestedAt: now
  });

  console.log(`[OTP Service] Generated OTP for +91 ${sanitizedPhone}: ${otp} (Expires in 5 mins)`);

  // Simulated SMS Provider interface
  if (!isMockMode) {
    // External SMS Provider Dispatch Abstraction
    // Example: await smsClient.send({ to: sanitizedPhone, body: `Your ConnectBill OTP is ${otp}` });
    console.log(`[SMS Provider] Dispatched OTP SMS to +91 ${sanitizedPhone} via provider: ${process.env.SMS_PROVIDER_ID || 'STANDARD_SMS'}`);
  }

  return {
    success: true,
    message: `OTP sent successfully to +91 ${sanitizedPhone}`,
    // Return devOtp in development/mock mode so user can test effortlessly in UI
    devOtp: isMockMode ? otp : undefined
  };
};

const verifyOtp = async (phone, enteredOtp) => {
  const sanitizedPhone = phone.replace(/\D/g, '').slice(-10);
  const record = otpStore.get(sanitizedPhone);

  if (!record) {
    return {
      isValid: false,
      message: 'No OTP requested for this mobile number or it has expired. Please request a new OTP.'
    };
  }

  const now = Date.now();

  if (now > record.expiresAt) {
    otpStore.delete(sanitizedPhone);
    return {
      isValid: false,
      message: 'OTP has expired. Please request a new one.'
    };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(sanitizedPhone);
    return {
      isValid: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.'
    };
  }

  if (record.otp !== enteredOtp.toString().trim()) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      isValid: false,
      message: `Invalid OTP. ${remaining} attempt(s) remaining.`
    };
  }

  // Success: invalidate OTP to prevent replay attacks
  otpStore.delete(sanitizedPhone);

  return {
    isValid: true,
    message: 'OTP verified successfully.'
  };
};

module.exports = {
  sendOtp,
  verifyOtp
};
