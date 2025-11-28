import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const referralSchema = new Schema(
  {
    referrer: { type: Types.ObjectId, ref: 'Customer', required: true },
    referredCustomer: { type: Types.ObjectId, ref: 'Customer' }, // assigned when customer signs up
    status: {
      type: String,
      enum: ['pending', 'converted', 'rewarded'],
      default: 'pending',
    },
    rewardDetails: {
      amount: Number,
      rewardType: String, // e.g., "cashback", "discount"
      rewardedAt: Date,
    },
  },
  { timestamps: true }
);

export default model('Referral', referralSchema);
