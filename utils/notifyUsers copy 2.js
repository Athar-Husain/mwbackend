// utils/notifyUsers.js
import NotificationModel from '../models/Notification.model.js';
import { sendFCMNotification } from './fcmService.js';
// import { sendFCMNotification } from './fcmService.js';

/**
 * Notify users via DB + socket + FCM
 * @param {object} params
 * @param {import("socket.io").Server} params.io - Socket.IO instance
 * @param {Array} params.recipients - Array of users { _id, userType, fcmTokens }
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification body
 * @param {object} params.payload - Optional payload (e.g., screen, deep link)
 */
export const notifyUsers = async ({
  io,
  recipients,
  title,
  message,
  payload = {},
}) => {
  try {
    if (!recipients || !recipients.length) return;

    await Promise.allSettled(
      recipients.map(async (user) => {
        if (!user || !user._id) return;

        // 1. Save in DB
        const notification = await NotificationModel.create({
          title,
          message,
          recipient: user._id,
          onModel: user.userType,
          data: payload,
        });

        // 2. Emit via socket
        io.to(user._id.toString()).emit('newNotification', {
          notification,
          payload,
        });

        // 3. Send FCM
        if (user.fcmTokens?.length) {
          await sendFCMNotification(
            user.fcmTokens,
            title,
            message,
            payload,
            user._id
          );
        }
      })
    );
  } catch (error) {
    console.error('❌ notifyUsers failed:', error);
  }
};
