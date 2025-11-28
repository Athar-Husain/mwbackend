import { Schema, model } from 'mongoose';

const addressSchema = new Schema({
  street: { type: String, trim: true },
  pinCode: { type: String, trim: true },
  city: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
});

const connectionSchema = new Schema({
  boxId: { type: String, required: true, unique: true },

  stbNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  userName: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: String,
    required: true,
    trim: true,
  },

  address: addressSchema,

  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },

  contactNo: {
    type: Number,
  },

  serviceArea: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceArea',
    required: true,
  },

  connectionStatus: {
    type: String,
    required: true,
    default: 'active',
  },

  agent: {
    type: Schema.Types.ObjectId,
    refPath: 'agentModel',
  },
  agentModel: {
    type: String,
    // required: true,
    enum: ['Team', 'Admin'],
  },

  activePlan: {
    type: Schema.Types.ObjectId,
    ref: 'SubscribedPlan', // Reference to the current active plan
  },

  connectionType: {
    type: String,
    // enum: ['Fiber', 'DSL', 'Cable'],
    // required: true,
  },

  planHistory: [
    {
      type: Schema.Types.ObjectId,
      ref: 'SubscribedPlan', // Store a reference to the SubscribedPlan schema
    },
  ],

  installedAt: { type: Date, default: Date.now },

  aliasName: {
    type: String,
    trim: true,
  },

  region: {
    type: String,
    trim: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  ticket: {
    type: Schema.Types.ObjectId,
    ref: 'SupportTicket',
  },
});

export default model('Connection', connectionSchema);
