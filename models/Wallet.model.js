// models/Wallet.js
import { Schema, model, Types } from 'mongoose';

const walletSchema = new Schema({
  customer: {
    type: Types.ObjectId,
    ref: 'Customer',
    required: true,
    unique: true, // One wallet per customer
  },
  pointsBalance: { type: Number, default: 0 },
  lifetimePoints: { type: Number, default: 0 },
  totalSuccessfulReferrals: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  lastUpdated: { type: Date, default: Date.now },
});

export default model('Wallet', walletSchema);
