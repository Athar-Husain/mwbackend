import { Schema, model } from 'mongoose';

const paymentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    connectionId: {
      type: Schema.Types.ObjectId,
      ref: 'connection',
      required: true,
    }, // connection ID for the payment gateway
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: { type: String, required: true },
    amount: { type: Number, required: true }, // amount in INR, e.g., 500 for ₹500
    status: {
      type: String,
      enum: ['created', 'captured', 'failed', 'refunded'],
      default: 'created',
    },
    method: { type: String }, // payment method (e.g., 'card', 'netbanking')
    refund: {
      refundId: { type: String },
      amount: { type: Number },
      status: { type: String },
      requestedAt: { type: Date },
      refundedAt: { type: Date },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model('Payment', paymentSchema);
