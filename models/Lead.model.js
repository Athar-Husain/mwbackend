// models/Lead.js
import { Schema, model, Types } from 'mongoose';

const followUpSchema = new Schema(
  {
    followedBy: {
      type: Types.ObjectId,
      refPath: 'followUps.followedByModel',
      required: true,
    },
    followedByModel: {
      type: String,
      enum: ['Admin', 'Team'],
      required: true,
    },
    note: {
      type: String,
      required: true,
      trim: true,
    },
    outcome: {
      type: String,
      enum: [
        'interested',
        'not_interested',
        'no_answer',
        'callback_later',
        'wrong_number',
        'follow_up_scheduled',
        'site_survey_done',
        'quote_shared',
      ],
      default: 'interested',
    },
    nextFollowUpDate: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true } // Keep subdocument IDs for easier updates/deletes
);

const leadSchema = new Schema({
  // === Lead Source (Referral) ===
  createdBy: {
    type: Types.ObjectId,
    refPath: 'createdByModel',
    required: true,
    index: true,
  },
  createdByModel: {
    type: String,
    enum: ['Customer', 'Team', 'Admin'],
    required: true,
  },

  // === Contact Details ===
  name: {
    type: String,
    trim: true,
    required: [true, 'Lead name is required'],
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Allows null + unique if needed later
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Phone must be exactly 10 digits'],
    index: true,
  },
  alternatePhone: {
    type: String,
    match: [/^[0-9]{10}$/, 'Alternate phone must be 10 digits'],
  },

  // === Location & Assignment ===
  // serviceArea: {
  //   type: Types.ObjectId,
  //   ref: 'ServiceArea',
  //   required: [true, 'Service area is required'],
  //   index: true,
  // },
  serviceArea: {
    type: String, // CHANGE THIS from Types.ObjectId
    // required: [true, 'Service area is required'],
    trim: true,
    index: true,
  },
  address: {
    type: String,
    trim: true,
  },

  // === Notes & Context ===
  notes: {
    type: String,
    trim: true,
  },

  // === Status Progression ===
  status: {
    type: String,
    enum: [
      'new', // Fresh lead
      'contacted', // First contact made
      'follow_up', // Multiple follow-ups ongoing
      'site_survey', // Survey scheduled/done
      'interested', // Clear buying intent
      'converted', // Became a paying connection/customer
      'on_hold', // Temporarily paused
      'lost', // Not convertible
    ],
    default: 'new',
    index: true,
  },

  // === Assignment ===
  assignedTo: {
    type: Types.ObjectId,
    ref: 'Team',
    default: null,
    index: true,
  },

  // === Follow-up History ===
  followUps: [followUpSchema],

  // === Conversion Details ===
  convertedToConnection: {
    type: Types.ObjectId,
    ref: 'Connection',
    default: null,
  },
  convertedToCustomer: {
    type: Types.ObjectId,
    ref: 'Customer',
    default: null,
  },
  conversionDate: Date,
  connectionCreatedAt: Date,

  // === Reward & Incentive Tracking ===
  reward: {
    pointsAwarded: {
      type: Number,
      default: 0,
      min: 0,
    }, // For Customer referrers
    incentiveAmount: {
      type: Number,
      default: 0,
      min: 0,
    }, // For Team/Admin referrers (e.g., ₹500)
    incentivePaid: {
      type: Boolean,
      default: false,
    },
    pointsTransaction: {
      type: Types.ObjectId,
      ref: 'PointsTransaction',
      default: null,
    },
  },

  // === Audit Fields ===
  updatedBy: {
    type: Types.ObjectId,
    refPath: 'updatedByModel',
  },
  updatedByModel: {
    type: String,
    enum: ['Admin', 'Team', 'Customer'],
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ==================== Middleware ====================

// Update timestamp on save
leadSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Auto-manage status based on follow-ups (single source of truth)
leadSchema.pre('save', function (next) {
  const followUpCount = this.followUps.length;

  if (this.isModified('followUps') || this.isNew) {
    if (followUpCount === 1 && this.status === 'new') {
      this.status = 'contacted';
    } else if (followUpCount > 1) {
      this.status = 'follow_up';
    }
  }

  // Auto-update status on conversion
  if (this.convertedToConnection || this.convertedToCustomer) {
    this.status = 'converted';
  }

  next();
});

// ==================== Indexes for Performance & Scalability ====================

leadSchema.index({ createdBy: 1, createdByModel: 1 });
leadSchema.index({ serviceArea: 1, status: 1 });
leadSchema.index({ assignedTo: 1, status: 1 });
leadSchema.index({ phone: 1 }); // For duplicate detection
leadSchema.index({ status: 1, createdAt: -1 }); // Dashboard queries
leadSchema.index({ createdAt: -1 });
leadSchema.index({ 'followUps.nextFollowUpDate': 1 }); // For reminder queries

// ==================== Virtuals (Optional) ====================

leadSchema.virtual('isOverdue').get(function () {
  if (!this.followUps.length) return false;
  const last = this.followUps[this.followUps.length - 1];
  return last.nextFollowUpDate && new Date() > last.nextFollowUpDate;
});

// ==================== Export ====================

export default model('Lead', leadSchema);
