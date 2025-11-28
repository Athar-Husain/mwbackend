// utils/fcmService.js
import admin from 'firebase-admin';
import { logError, logInfo } from './logger.js';
import Customer from '../models/Customer.model.js';

const privateKey = process.env.FCM_PRIVATE_KEY
  ? process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

if (!admin.apps.length && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

/**
 * Send push notification to multiple FCM tokens and clean up invalid ones
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional payload
 * @param {string} [userId] - User ID to clean up tokens from DB (optional)
 */
export const sendFCMNotification = async (
  tokens,
  title,
  body,
  data = {},
  userId = null
) => {
  if (!tokens?.length) return;

  // Remove duplicates
  const uniqueTokens = [...new Set(tokens)];

  const message = {
    notification: { title, body },
    data: { ...data },
    tokens: uniqueTokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);

    logInfo(
      `✅ FCM sent: ${response.successCount}/${uniqueTokens.length} tokens succeeded.`
    );

    // Handle invalid tokens
    if (response.failureCount > 0 && userId) {
      const invalidTokens = [];

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code || '';
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            invalidTokens.push(uniqueTokens[idx]);
          }
        }
      });

      if (invalidTokens.length) {
        await Customer.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: invalidTokens } },
        });

        logInfo(
          `🧹 Removed ${invalidTokens.length} invalid FCM tokens from user ${userId}`
        );
      }
    }
  } catch (error) {
    logError('❌ FCM send failed', error);
  }
};
