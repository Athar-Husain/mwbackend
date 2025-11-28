// utils/fcmService.js
import admin from 'firebase-admin';
import { logError, logInfo } from './logger.js';


const privateKey = process.env.FCM_PRIVATE_KEY ? process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FCM_PROJECT_ID,
      clientEmail: process.env.FCM_CLIENT_EMAIL,
      privateKey,
    }),
  });
}


// Initialize Firebase Admin SDK
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FCM_PROJECT_ID,
//       clientEmail: process.env.FCM_CLIENT_EMAIL,
//       privateKey: process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
//     }),
//   });
// }

/**
 * Send push notification to multiple FCM tokens
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Optional data payload
 */
export const sendFCMNotification = async (tokens, title, body, data = {}) => {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    data: { ...data },
    tokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    logInfo(
      `FCM sent successfully. Success count: ${response.successCount}`,
      response
    );
  } catch (error) {
    logError('FCM send failed', error);
  }
};

// ✅ Notes:

// replace(/\\n/g, '\n') is required if you store private key in .env.

// sendMulticast() handles multiple tokens (web + mobile users).
