import mongoose from 'mongoose';
import Admin from '../models/Admin.model.js';
const { Schema, model, Types } = mongoose;

/**
 * Subschema for assignment history.
 * Embedded to keep historical assignment trace atomic with the ticket.
 */
const assignmentHistorySchema = new Schema(
  {
    assignedTo: {
      type: Types.ObjectId,
      refPath: 'assignmentHistory.assignedToModel',
      required: true,
    },
    assignedToModel: {
      type: String,
      enum: ['Team', 'Admin'],
      required: true,
    },

    assignedBy: {
      type: Types.ObjectId,
      refPath: 'assignmentHistory.assignedByModel',
      required: true,
    },
    assignedByModel: {
      type: String,
      // enum: ['Customer', 'Admin', 'TeamMember'],
      enum: ['Customer', 'Admin', 'Team'],
      required: true,
    },

    assignedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    note: {
      type: String,
      maxlength: 500,
      trim: true,
    },
  },
  { _id: false } // We don't need an _id for each history record
);

const supportTicketSchema = new Schema(
  {
    // The customer who raised the ticket
    customer: {
      type: Types.ObjectId,
      ref: 'Customer',
      // required: true,
      index: true,
    },
    connection: {
      type: Types.ObjectId,
      ref: 'Connection',
      // required: true,
      index: true,
    },

    // Polymorphic assignment to either Team or Admin
    assignedTo: {
      type: Types.ObjectId,
      refPath: 'assignedToModel',
      index: true,
    },
    assignedToModel: {
      type: String,
      enum: ['Team', 'Admin'],
      required: function () {
        return !!this.assignedTo;
      },
    },

    // Assignment history embedded for audit trail
    assignmentHistory: {
      type: [assignmentHistorySchema],
      default: [],
    },

    // Categorize issue type with flexibility for adding new types
    issueType: {
      type: String,
      default: 'other',
      trim: true,
      maxlength: 100,
      index: true,
    },

    // Detailed description of the issue
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },

    // Ticket priority
    priority: {
      type: String,
      // enum: ['low', 'medium', 'high'],
      default: 'low',
      index: true,
    },

    // Current ticket status - extensible via enum array if needed
    status: {
      type: String,
      default: 'Open',
      index: true,
    },

    escalated: {
      type: Boolean,
      default: false,
    },

    // Array of comments references for scalability
    privateComments: [
      {
        type: Types.ObjectId,
        ref: 'Comment',
      },
    ],
    publicComments: [
      {
        type: Types.ObjectId,
        ref: 'Comment',
      },
    ],

    // Attachments referenced to keep document size small
    attachments: [
      {
        type: Types.ObjectId,
        ref: 'Attachment',
      },
    ],

    // Resolution details
    resolutionMessage: {
      type: String,
      trim: true,
      maxlength: 2000,
    },

    resolvedBy: {
      type: Types.ObjectId,
      refPath: 'resolvedByModel',
    },
    resolvedByModel: {
      type: String,
      enum: ['Customer', 'Admin', 'Team'],
    },
    resolvedAt: {
      type: Date,
    },

    // Audit trail for who created the ticket
    createdBy: {
      type: Types.ObjectId,
      required: true,
      refPath: 'createdByModel',
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Admin', 'Team'],
    },

    // Audit trail for who last updated the ticket
    updatedBy: {
      type: Types.ObjectId,
      refPath: 'updatedByModel',
    },
    updatedByModel: {
      type: String,
      enum: ['Customer', 'Team', 'Admin'], // <-- Add this
      // required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false, // disable __v unless you want versioning for optimistic concurrency
  }
);

// Compound index example (useful for frequent query patterns)
supportTicketSchema.index({ customer: 1, status: 1, priority: -1 });

export default model('SupportTicket', supportTicketSchema);
