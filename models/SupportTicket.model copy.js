import mongoose from 'mongoose';
const { Schema, model, Types } = mongoose;

const supportTicketSchema = new Schema(
  {
    customer: {
      type: Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    assignedTo: {
      type: Types.ObjectId,
      ref: 'Team',
    },
    assignmentHistory: [
      {
        assignedTo: { type: Types.ObjectId, ref: 'Team' },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    issueType: {
      type: String,
      enum: ['connection', 'hardware', 'billing', 'other'], // uncomment and use enum for better validation
      default: 'other',
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'], // uncomment and use enum for better validation
      default: 'low',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved', 'escalated'], // uncomment and use enum for better validation
      default: 'pending',
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    comments: [
      {
        type: Types.ObjectId,
        ref: 'Comment',
      },
    ],
    attachments: [
      {
        type: Types.ObjectId,
        ref: 'Attachment',
      },
    ],

    // Audit fields with dynamic referencing for 3 user types
    createdBy: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'createdByModel',
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ['Customer', 'Admin', 'TeamMember'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'updatedByModel',
    },
    updatedByModel: {
      type: String,
      enum: ['Customer', 'Admin', 'TeamMember'],
    },
    updatedAt: {
      type: Date,
    },
    resolutionMessage: {
      type: String,
      required: true, // You can make it required when resolving
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'resolvedByModel',
    },
    resolvedByModel: {
      type: String,
      enum: ['Customer', 'Admin', 'TeamMember'],
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically — you can keep or remove your manual fields as needed
  }
);

export default model('SupportTicket', supportTicketSchema);
