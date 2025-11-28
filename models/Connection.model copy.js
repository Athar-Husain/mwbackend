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
    trim: true, // Ensuring no leading/trailing spaces for stbNumber
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true, // Ensuring no leading/trailing spaces for userId
  },

  aliasName: {
    type: String,
    trim: true, // Trimming spaces from alias name
  },

  userName: {
    type: String,
    required: true,
    trim: true, // Trimming spaces from userName
  },

  address: addressSchema, // Using address sub-schema

  customer: {
    type: Schema.Types.ObjectId,
    ref: 'Customer',
    required: true,
  },
  contactNo: {
    type: Number,
    trim: true,
  },
  serviceArea: {
    type: Schema.Types.ObjectId,
    ref: 'ServiceArea',
    required: true,
  },
  connectionStatus: {
    type: String,
    required: true,
    enum: ['Active', 'Inactive', 'Suspended', 'Pending'], // Limiting status to predefined values
    default: 'Active', // Default value for status
  },
  agent: {
    type: Schema.Types.ObjectId,
    ref: 'Agent', // Reference to Agent model
  },

  activePlan: { type: Schema.Types.ObjectId, ref: 'SubscribedPlan' },
  connectionType: {
    type: String,
    enum: ['Fiber', 'DSL', 'Cable'],
    required: true,
  },

  installedAt: { type: Date, default: Date.now },
});

export default model('Connection', connectionSchema);
