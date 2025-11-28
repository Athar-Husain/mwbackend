import mongoose from 'mongoose';

const { Schema, Types } = mongoose;

const leadSchema = new Schema(
  {
    leadOwner: {
      type: Types.ObjectId,
      required: true,
      refPath: 'leadOwnerModel', // Dynamic reference based on model name
    },
    leadOwnerModel: {
      type: String,
      required: true,
      enum: ['Team', 'Admin'], // Must match model names exactly
    },
    leadCustomer: {
      type: Types.ObjectId,
      ref: 'Customer',
      required: true, // 💡 Optional: enforce presence of a customer
    },
    status: {
      type: String,
      enum: ['pending', 'converted', 'rewarded'],
      default: 'pending',
    },
    rewardDetails: {
      amount: {
        type: Number,
        min: 0,
      },
      rewardType: {
        type: String,
        enum: ['cash', 'voucher', 'other'], // 💡 Optional: restrict types
      },
      rewardedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default model('Lead', leadSchema);
