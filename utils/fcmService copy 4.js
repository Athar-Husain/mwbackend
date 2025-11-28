// utils/fcmService.js
// import admin from 'firebase-admin';
// import { logError, logInfo } from './logger.js';
// import Customer from '../models/Customer.model.js';

// const privateKey = process.env.FCM_PRIVATE_KEY
//   ? process.env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n')
//   : undefined;

// if (!admin.apps.length && privateKey) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FCM_PROJECT_ID,
//       clientEmail: process.env.FCM_CLIENT_EMAIL,
//       privateKey,
//     }),
//   });
// }

import admin from 'firebase-admin';
import serviceAccount from '../config/firebaseAdminKey.json' assert { type: 'json' };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const sendFCMNotification = async ({
  title,
  message,
  tokens,
  payload = {},
}) => {
  if (!tokens || tokens.length === 0) {
    console.log('⚠️ No tokens provided — skipping FCM send');
    return;
  }

  try {
    console.log('============================');
    console.log('🚀 [sendFCMNotification] Triggered');
    console.log('📩 Title:', title);
    console.log('📨 Message:', message);
    console.log('🎯 Tokens received:', tokens.length);
    console.log('🧾 Tokens list:', JSON.stringify(tokens, null, 2));
    console.log('📦 Payload:', payload);
    console.log('============================');

    const fcmMessage = {
      notification: { title, body: message },
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

    // ✅ Check the SDK structure
    const messaging = admin.messaging?.() || admin.messaging;
    if (!messaging) {
      throw new Error(
        'Firebase Admin messaging service not initialized properly'
      );
    }

    // ✅ For modern SDK (v11+)
    if (typeof messaging.sendEachForMulticast === 'function') {
      console.log('📡 Using: sendEachForMulticast()');
      const response = await messaging.sendEachForMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        console.warn(
          '⚠️ Some tokens failed:',
          response.responses.filter((r) => !r.success)
        );
      }
      return response;
    }

    // ✅ For older SDK (v10 or earlier)
    if (typeof messaging.sendMulticast === 'function') {
      console.log('📡 Using: sendMulticast()');
      const response = await messaging.sendMulticast(fcmMessage);
      console.log(`✅ FCM sent to ${response.successCount} devices`);
      if (response.failureCount > 0) {
        console.warn(
          '⚠️ Some tokens failed:',
          response.responses.filter((r) => !r.success)
        );
      }
      return response;
    }

    throw new Error(
      'sendMulticast() or sendEachForMulticast() not available in this SDK version'
    );
  } catch (error) {
    console.error('❌ [ERROR]: FCM send failed', error);
  }
};
