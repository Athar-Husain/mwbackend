import { Schema, model } from "mongoose";

const otpSchema = new Schema({
  phone: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  verified: { type: Boolean, default: false },
});

export default model("OTP", otpSchema);
