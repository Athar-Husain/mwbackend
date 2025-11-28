import { Schema, model } from 'mongoose';

const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    // Who gets this notification
    recipient: {
      type: Schema.Types.ObjectId,
      refPath: 'onModel',
      required: true,
    },
    onModel: {
      type: String,
      enum: ['Customer', 'Team', 'Admin'],
      required: true,
    },

    // Generic relation to any entity (ticket, invoice, plan, etc.)
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String }, // e.g., "Ticket", "Invoice", "Plan", "User"

    // Status
    isRead: { type: Boolean, default: false },

    // Flexible data payload
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true } // createdAt, updatedAt
);

export default model('Notification', notificationSchema);
