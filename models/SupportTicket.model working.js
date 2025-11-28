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
      default: 'other',
    },
    description: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low',
    },
    status: {
      type: String,
      // enum: ['Open', 'In Progress', 'Closed', 'Escalated'],
      default: 'Open',
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

    resolutionMessage: {
      type: String,
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
    updatedBy: {
      type: Schema.Types.ObjectId,
      refPath: 'updatedByModel',
    },
    updatedByModel: {
      type: String,
      enum: ['Customer', 'Admin', 'TeamMember'],
    },
  },
  {
    timestamps: true,
  }
);

export default model('SupportTicket', supportTicketSchema);
