// utils/otp.js

export function generateOtp(length = 6) {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  const expiresIn = 5 * 60 * 1000; // OTP expires in 5 minutes
  const expiry = Date.now() + expiresIn;

  return {
    otp,
    expiry, // timestamp in ms
  };
}
