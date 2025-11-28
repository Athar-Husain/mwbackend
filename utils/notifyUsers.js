// utils/notifyUsers.js
import NotificationModel from '../models/Notification.model.js';
import { sendFCMNotification } from './fcmService.js';
import { getIo } from '../config/socket.js';
import Notification from '../models/Notification.model.js';

/**
 * Notify users via DB + Socket.IO + FCM
 * Works for all user types (Customer, Team, Admin, etc.)
 *
 * @param {Object} params
 * @param {Array} params.recipients - Array of user objects with _id, userType, fcmTokens
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {object} [params.payload] - Optional data (ticketId, status, etc.)
 */
export const notifyUsersold = async ({
  recipients,
  title,
  message,
  payload = {},
}) => {
  try {
    if (!recipients || !recipients.length) return;

    const io = getIo();

    await Promise.allSettled(
      recipients.map(async (user) => {
        if (!user?._id) return;

        // 1️⃣ Save in Database
        const notification = await NotificationModel.create({
          title,
          message,
          recipient: user._id,
          onModel: user.userType,
          data: payload,
        });

        // 2️⃣ Emit via Socket.IO
        io.to(user._id.toString()).emit('newNotification', {
          notification,
          payload,
        });

        // 3️⃣ Send FCM Push
        if (Array.isArray(user.fcmTokens) && user.fcmTokens.length > 0) {
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

export const notifyUsers2 = async ({
  io,
  recipients = [],
  title,
  message,
  payload = {},
}) => {
  try {
    if (!recipients.length) {
      console.warn('⚠️ No recipients provided for notifyUsers');
      return;
    }

    console.log(
      `🔔 notifyUsers: Preparing to send "${title}" to ${recipients.length} recipients`
    );

    // ✅ Create DB notification entries
    const notifications = recipients.map((user) => ({
      userId: user._id,
      userType: user.userType || user.role || 'Unknown',
      title,
      message,
      payload,
    }));

    await Notification.insertMany(notifications);
    console.log('✅ Notifications saved in DB');

    // ✅ Socket.io Broadcast
    if (io) {
      recipients.forEach((user) => {
        io.to(String(user._id)).emit('notification', {
          title,
          message,
          payload,
        });
      });
      console.log('✅ Socket notifications emitted');
    } else {
      console.warn('⚠️ Socket.io instance missing in notifyUsers');
    }

    // ✅ Prepare FCM tokens (only for non-admins)
    const allTokens = recipients
      .filter(
        (user) =>
          user.fcmTokens &&
          user.fcmTokens.length > 0 &&
          user.userType?.toLowerCase() !== 'admin' &&
          user.role?.toLowerCase() !== 'admin'
      )
      .flatMap((user) => user.fcmTokens);

    console.log(
      `📱 Found ${allTokens.length} FCM tokens to send push notifications`
    );

    // ✅ Send FCM push notifications (if tokens exist)
    if (allTokens.length > 0) {
      await sendFCMNotification(allTokens, title, message, payload);
      console.log('✅ FCM notifications sent successfully');
    } else {
      console.log('ℹ️ No valid FCM tokens found to send push notifications');
    }
  } catch (error) {
    console.error('❌ notifyUsers Error:', error);
  }
};

export const notifyUsers3 = async ({
  io,
  recipients = [],
  title,
  message,
  payload = {},
}) => {
  try {
    if (!recipients.length) {
      console.warn('⚠️ No recipients provided for notifyUsers');
      return;
    }

    console.log(
      `🔔 notifyUsers: Preparing to send "${title}" to ${recipients.length} recipients`
    );

    // ✅ 1. Save Notifications in DB (correct fields)
    const notifications = recipients.map((user) => ({
      recipient: user._id,
      onModel: user.userType || user.role || 'Customer', // for refPath
      title,
      message,
      data: payload,
    }));

    await Notification.insertMany(notifications);
    console.log('✅ Notifications saved in DB');

    // ✅ 2. Emit via Socket.io
    if (io) {
      recipients.forEach((user) => {
        io.to(String(user._id)).emit('notification', {
          title,
          message,
          payload,
        });
      });
      console.log('✅ Socket.io notifications emitted');
    } else {
      console.warn('⚠️ Socket.io instance missing in notifyUsers');
    }

    // ✅ 3. Collect valid FCM tokens (exclude Admins)
    const allTokens = recipients
      .filter(
        (user) =>
          user.fcmTokens &&
          user.fcmTokens.length > 0 &&
          user.userType?.toLowerCase() !== 'admin' &&
          user.role?.toLowerCase() !== 'admin'
      )
      .flatMap((user) => user.fcmTokens);

    console.log(
      `📱 Found ${allTokens.length} FCM tokens to send push notifications`
    );

    // ✅ 4. Send FCM notifications
    if (allTokens.length > 0) {
      await sendFCMNotification(allTokens, title, message, payload);
      console.log('✅ FCM notifications sent successfully');
    } else {
      console.log('ℹ️ No valid FCM tokens found for push notifications');
    }
  } catch (error) {
    console.error('❌ notifyUsers Error:', error);
  }
};

export const notifyUsers = async ({
  io,
  recipients = [],
  title,
  message,
  payload = {},
}) => {
  try {
    if (!recipients.length) {
      console.warn('⚠️ No recipients provided for notifyUsers');
      return;
    }

    console.log(
      `🔔 notifyUsers: Preparing to send "${title}" to ${recipients.length} recipients`
    );

    // ✅ 1. Save Notifications in DB
    const notifications = recipients.map((user) => ({
      recipient: user._id,
      onModel: user.userType || user.role || 'Customer', // for refPath
      title,
      message,
      data: payload,
    }));

    await Notification.insertMany(notifications);
    console.log('✅ Notifications saved in DB');

    // ✅ 2. Emit via Socket.io
    if (io) {
      recipients.forEach((user) => {
        io.to(String(user._id)).emit('notification', {
          title,
          message,
          payload,
        });
      });
      console.log('✅ Socket.io notifications emitted');
    } else {
      console.warn('⚠️ Socket.io instance missing in notifyUsers');
    }

    // ✅ 3. Collect FCM tokens (non-admins)
    const allTokens = recipients
      .filter(
        (user) =>
          user.fcmTokens &&
          user.fcmTokens.length > 0 &&
          user.userType?.toLowerCase() !== 'admin' &&
          user.role?.toLowerCase() !== 'admin'
      )
      .flatMap((user) => user.fcmTokens);

    console.log('============================');
    console.log('🚀 [notifyUsers] Sending FCM');
    console.log('📩 Title:', title);
    console.log('📨 Message:', message);
    console.log('🎯 Tokens count:', allTokens.length);
    console.log('🧾 Tokens list:', allTokens);
    console.log('📦 Payload:', payload);
    console.log('============================');

    // ✅ 4. Send FCM notifications properly
    if (allTokens.length > 0) {
      await sendFCMNotification({
        title,
        message,
        tokens: allTokens,
        payload,
      });
      console.log('✅ FCM notifications sent successfully');
    } else {
      console.log('ℹ️ No valid FCM tokens found for push notifications');
    }
  } catch (error) {
    console.error('❌ notifyUsers Error:', error);
  }
};
