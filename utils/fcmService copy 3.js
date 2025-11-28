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
export const sendFCMNotificationold = async (
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

export const sendFCMNotificationold2 = async ({
  title,
  message,
  tokens,
  payload = {},
}) => {
  if (!tokens || tokens.length === 0) return;

  try {
    const fcmMessage = {
      notification: { title, body: message },
      data: Object.entries(payload).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {}),
      tokens,
    };

    // ✅ For modern SDK (v11+)
    if (admin.messaging.sendEachForMulticast) {
      const response = await admin.messaging.sendEachForMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      return response;
    }

    // ✅ Fallback for legacy SDK
    if (typeof admin.messaging === 'function') {
      const response = await admin.messaging().sendMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      return response;
    }

    throw new Error('Invalid Firebase Admin SDK version');
  } catch (error) {
    console.error('❌ [ERROR]: ❌ FCM send failed', error);
  }
};

export const sendFCMNotification3 = async ({
  title,
  message,
  tokens,
  payload = {},
}) => {
  try {
    console.log('\n============================');
    console.log('🚀 [sendFCMNotification] Triggered');
    console.log('📩 Title:', title);
    console.log('📨 Message:', message);
    console.log(
      '🎯 Tokens received:',
      tokens && tokens.length ? tokens.length : 0
    );
    console.log('🧾 Tokens list:', tokens);
    console.log('📦 Payload:', payload);
    console.log('============================\n');

    if (!tokens || tokens.length === 0) {
      console.log('⚠️ No FCM tokens provided — skipping notification.');
      return;
    }

    // Format message
    const fcmMessage = {
      notification: {
        title,
        body: message,
      },
      data: Object.entries(payload).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {}),
      tokens,
    };

    console.log(
      '🧠 Final FCM Message Object:',
      JSON.stringify(fcmMessage, null, 2)
    );

    // Modern Firebase Admin SDK (v11+)
    if (admin.messaging.sendEachForMulticast) {
      console.log('📡 Using: admin.messaging.sendEachForMulticast()');
      const response = await admin.messaging.sendEachForMulticast(fcmMessage);
      console.log(
        `✅ FCM sent successfully to ${response.successCount} devices`
      );
      console.log('📊 FCM Response:', JSON.stringify(response, null, 2));
      return response;
    }

    // Legacy SDK support
    if (typeof admin.messaging === 'function') {
      console.log('📡 Using: admin.messaging().sendMulticast()');
      const response = await admin.messaging().sendMulticast(fcmMessage);
      console.log(
        `✅ FCM sent successfully to ${response.successCount} devices`
      );
      console.log('📊 FCM Response:', JSON.stringify(response, null, 2));
      return response;
    }

    throw new Error(
      '❌ Invalid Firebase Admin SDK version — no multicast method found.'
    );
  } catch (error) {
    console.error('❌ [ERROR]: FCM send failed');
    console.error(error);
  }
};

export const sendFCMNotification4 = async ({
  title,
  message,
  tokens,
  payload = {},
}) => {
  console.log('============================')
  console.log('🚀 [sendFCMNotification] Triggered')
  console.log('📩 Title:', title)
  console.log('📨 Message:', message)
  console.log('🎯 Tokens received:', tokens?.length || 0)
  console.log('🧾 Tokens list:', tokens)
  console.log('📦 Payload:', payload)
  console.log('============================')

  if (!tokens || tokens.length === 0) {
    console.warn('⚠️ No FCM tokens provided — skipping notification.')
    return
  }

  try {
    const fcmMessage = {
      notification: {
        title,
        body: message,
      },
      data: Object.entries(payload).reduce((acc, [k, v]) => {
        acc[k] = String(v)
        return acc
      }, {}),
      tokens,
    }

    console.log('🧠 Final FCM Message Object:', JSON.stringify(fcmMessage, null, 2))

    let response

    // ✅ Detect modern SDK (v11+)
    if (typeof admin.messaging.sendEachForMulticast === 'function') {
      console.log('📡 Using: admin.messaging.sendEachForMulticast()')
      response = await admin.messaging.sendEachForMulticast(fcmMessage)
    }
    // ✅ Legacy SDK fallback
    else if (typeof admin.messaging === 'function') {
      console.log('📡 Using: admin.messaging().sendMulticast()')
      const messagingInstance = admin.messaging()
      if (typeof messagingInstance.sendMulticast === 'function') {
        response = await messagingInstance.sendMulticast(fcmMessage)
      } else {
        throw new Error('sendMulticast() not available in this SDK version')
      }
    } else {
      throw new Error('Invalid Firebase Admin SDK configuration')
    }

    console.log(`✅ FCM sent to ${response.successCount} devices`)
    if (response.failureCount > 0) {
      console.warn('⚠️ FCM failures:', response.responses.filter(r => !r.success))
    }
    return response
  } catch (error) {
    console.error('❌ [ERROR]: FCM send failed', error)
  }
}

export const sendFCMNotification = async ({
  title,
  message,
  tokens,
  payload = {},
}) => {
  if (!tokens || tokens.length === 0) {
    console.log("⚠️ No tokens provided — skipping FCM send");
    return;
  }

  try {
    console.log("============================");
    console.log("🚀 [sendFCMNotification] Triggered");
    console.log("📩 Title:", title);
    console.log("📨 Message:", message);
    console.log("🎯 Tokens received:", tokens.length);
    console.log("🧾 Tokens list:", JSON.stringify(tokens, null, 2));
    console.log("📦 Payload:", payload);
    console.log("============================");

    const fcmMessage = {
      notification: { title, body: message },
      data: Object.entries(payload).reduce((acc, [k, v]) => {
        acc[k] = String(v);
        return acc;
      }, {}),
      tokens,
    };

    console.log("🧠 Final FCM Message Object:", JSON.stringify(fcmMessage, null, 2));

    // ✅ Check the SDK structure
    const messaging = admin.messaging?.() || admin.messaging;
    if (!messaging) {
      throw new Error("Firebase Admin messaging service not initialized properly");
    }

    // ✅ For modern SDK (v11+)
    if (typeof messaging.sendEachForMulticast === "function") {
      console.log("📡 Using: sendEachForMulticast()");
      const response = await messaging.sendEachForMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        console.warn("⚠️ Some tokens failed:", response.responses.filter(r => !r.success));
      }
      return response;
    }

    // ✅ For older SDK (v10 or earlier)
    if (typeof messaging.sendMulticast === "function") {
      console.log("📡 Using: sendMulticast()");
      const response = await messaging.sendMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        console.warn("⚠️ Some tokens failed:", response.responses.filter(r => !r.success));
      }
      return response;
    }

    throw new Error("sendMulticast() or sendEachForMulticast() not available in this SDK version");

  } catch (error) {
    console.error("❌ [ERROR]: FCM send failed", error);
  }
};
