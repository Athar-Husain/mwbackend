// models/Lead.js
import { Schema, model, Types } from 'mongoose';

const followUpSchema = new Schema({
  followedBy: {
    type: Types.ObjectId,
    refPath: 'followedByModel',
    required: true,
  },
  followedByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Team'],
  },
  note: { type: String, required: true },
  outcome: {
    type: String,
    enum: [
      'interested',
      'not_interested',
      'no_answer',
      'callback_later',
      'wrong_number',
      'follow_up_scheduled',
    ],
    default: 'interested',
  },
  nextFollowUpDate: { type: Date }, // Optional scheduled date
  createdAt: { type: Date, default: Date.now },
});

const leadSchema = new Schema({
  name: { type: String, required: true, trim: true },
  phone: {
    type: String,
    required: true,
    match: /^[0-9]{10}$/,
    index: true,
  },
  alternatePhone: { type: String, match: /^[0-9]{10}$/ },
  area: {
    type: Types.ObjectId,
    ref: 'ServiceArea',
    required: true,
  },
  address: { type: String },
  notes: { type: String }, // Initial notes from creator

  status: {
    type: String,
    enum: ['new', 'contacted', 'follow_up', 'converted', 'lost', 'on_hold'],
    default: 'new',
  },

  // Source of Lead
  createdBy: {
    type: Types.ObjectId,
    refPath: 'createdByModel',
    required: true,
  },
  createdByModel: {
    type: String,
    required: true,
    enum: ['Admin', 'Team', 'Customer'],
  },

  // Assigned team member
  assignedTo: {
    type: Types.ObjectId,
    ref: 'Team',
    default: null,
  },

  // Follow-up History
  followUps: [followUpSchema],

  // Conversion Tracking
  convertedToCustomer: {
    type: Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  conversionDate: { type: Date },
  connectionCreatedAt: { type: Date }, // When customer got active connection

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

leadSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Auto-update status based on follow-ups
leadSchema.pre('save', function (next) {
  if (this.followUps.length > 0 && this.status === 'new') {
    this.status = 'contacted';
  }
  if (this.followUps.length > 1) {
    this.status = 'follow_up';
  }
  next();
});

leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ createdBy: 1, createdByModel: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ area: 1 });

export default model('Lead', leadSchema);
