// models/Lead.model.js
import { Schema, model, Types } from 'mongoose';

const followUpSchema = new Schema({
  followedBy: {
    type: Types.ObjectId,
    refPath: 'followedByModel',
    required: true,
  },
  followedByModel: {
    type: String,
    enum: ['Admin', 'Team'],
    required: true,
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
  nextFollowUpDate: Date,
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

  alternatePhone: {
    type: String,
    match: /^[0-9]{10}$/,
  },

  area: {
    type: Types.ObjectId,
    ref: 'ServiceArea',
    required: true,
    index: true,
  },

  address: String,
  notes: String,

  status: {
    type: String,
    enum: ['new', 'contacted', 'follow_up', 'converted', 'lost', 'on_hold'],
    default: 'new',
    index: true,
  },

  // Source
  createdBy: {
    type: Types.ObjectId,
    refPath: 'createdByModel',
    required: true,
    index: true,
  },
  createdByModel: {
    type: String,
    enum: ['Admin', 'Team', 'Customer'],
    required: true,
  },

  // Assignment
  assignedTo: {
    type: Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true,
  },

  followUps: [followUpSchema],

  // Conversion
  convertedToCustomer: {
    type: Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  conversionDate: Date,
  connectionCreatedAt: Date,

  // 🔥 AUDIT FIELDS
  updatedBy: {
    type: Types.ObjectId,
    refPath: 'updatedByModel',
  },
  updatedByModel: {
    type: String,
    enum: ['Admin', 'Team', 'Customer'],
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

/**
 * Auto update timestamps
 */
leadSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Auto status handling (SINGLE SOURCE OF TRUTH)
 */
leadSchema.pre('save', function (next) {
  if (this.followUps.length > 0 && this.status === 'new') {
    this.status = 'contacted';
  }

  if (this.followUps.length > 1) {
    this.status = 'follow_up';
  }

  next();
});

leadSchema.index({ createdAt: -1 });

export default model('Lead', leadSchema);
