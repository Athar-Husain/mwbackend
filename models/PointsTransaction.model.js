// models/PointsTransaction.js
import { Schema, model, Types } from 'mongoose';

const pointsTransactionSchema = new Schema({
  customer: {
    type: Types.ObjectId,
    ref: 'Customer',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['Earned', 'Redeemed'], // Matches your frontend typeConfig
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  description: {
    type: String, // e.g., "Referral: Alice Johnson" or "Bill Credit Redemption"
    required: true,
  },
  lead: {
    type: Types.ObjectId,
    ref: 'Lead', // Link to the lead that generated the points
  },
  redemptionDetails: {
    item: { type: String }, // 'bill_credit', 'speed_upgrade'
    connectionId: { type: Types.ObjectId, ref: 'Connection' },
  },
  balanceAfter: {
    type: Number, // Running balance for the Ledger
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default model('PointsTransaction', pointsTransactionSchema);
