import { Schema, model } from 'mongoose';

const subscribedPlanSchema = new Schema({
  connection: {
    type: Schema.Types.ObjectId,
    ref: 'Connection',
    required: true,
  },
  plan: {
    type: Schema.Types.ObjectId,
    ref: 'Plan',
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    // enum: ['Active', 'Expired', 'Cancelled'],
    default: 'Active',
  },
  price: {
    type: Number,
    required: true,
  },
  duration: {
    type: Number, // in days
    required: true,
  },
});

export default model('SubscribedPlan', subscribedPlanSchema);
