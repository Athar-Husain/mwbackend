import { Schema, model } from 'mongoose';
// import Customer from './Customer.js'; // Adjust path as per your project
// import { getIo } from './socket.js'; // Adjust path as needed

// Notification Schema
const notificationSchema = new Schema(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },

    // Polymorphic recipient reference
    recipient: {
      type: Schema.Types.ObjectId,
      refPath: 'onModel',
      required: true,
    },
    onModel: {
      type: String,
      enum: ['Customer', 'Team', 'Admin'], // Ensure roles match your user models exactly
      required: true,
    },

    // Generic reference for entities (flexible linking)
    entityId: { type: Schema.Types.ObjectId },
    entityType: { type: String }, // E.g., "Ticket", "Invoice", "Plan", etc.

    // Status flags
    isRead: { type: Boolean, default: false },

    // Flexible data payload
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Notification = model('Notification', notificationSchema);

export default Notification;
