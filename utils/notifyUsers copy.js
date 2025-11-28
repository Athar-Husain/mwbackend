// sockets/utils/notifyUsers.js
import NotificationModel from '../models/Notification.model.js';
import { sendFCMNotification } from './fcmService.js';

/**
 * Notify users by saving Notification, emitting socket event, and sending FCM
 * @param {object} params
 * @param {import("socket.io").Server} params.io - Socket.IO server instance
 * @param {Array} params.recipients - Array of users { _id, userType, fcmTokens }
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body message
 * @param {object} params.payload - Additional data payload
 */
export const notifyUsers = async ({
  io,
  recipients,
  title,
  message,
  payload,
}) => {
  try {
    for (const user of recipients) {
      if (!user) continue;

      // Save notification in DB
      const notification = await NotificationModel.create({
        title,
        message,
        recipient: user._id,
        onModel: user.userType,
      });

      // Emit notification via socket to user room
      io.to(user._id.toString()).emit('newNotification', {
        notification,
        payload,
      });

      // Send FCM push if tokens exist
      if (user.fcmTokens?.length) {
        await sendFCMNotification(user.fcmTokens, title, message, payload);
      }
    }
  } catch (err) {
    console.error('notifyUsers error:', err);
  }
};
