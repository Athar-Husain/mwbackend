// import admin from 'firebase-admin';
// import serviceAccount from '../config/firebaseAdminKey.json' assert { type: 'json' };
// import Customer from '../models/Customer.model.js'; // optional: only if you want to auto-clean tokens

import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const serviceAccount = require('../config/firebaseAdminKey.json');
import Customer from '../models/Customer.model.js';

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

    const messaging = admin.messaging?.() || admin.messaging;
    if (!messaging) {
      throw new Error(
        'Firebase Admin messaging service not initialized properly'
      );
    }

    console.log('📡 Using: sendEachForMulticast()');
    const response = await messaging.sendEachForMulticast(fcmMessage);
    console.log(`✅ FCM sent to ${response.successCount} devices`);

    if (response.failureCount > 0) {
      const failed = response.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter(Boolean);

      console.warn('⚠️ Some tokens failed and will be removed:', failed);

      // 🧹 Optional: Remove invalid tokens from DB
      await Customer.updateMany(
        { fcmTokens: { $in: failed } },
        { $pull: { fcmTokens: { $in: failed } } }
      );
    }

    return response;
  } catch (error) {
    console.error('❌ [ERROR]: FCM send failed', error);
  }
};
