import admin from 'firebase-admin';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import Customer from '../models/Customer.model.js';

// 🔥 Load Firebase credentials depending on environment
let serviceAccount;

if (process.env.NODE_ENV === 'production') {
  // 👉 Running on Vercel (load from environment variable)
  if (!process.env.FIREBASE_ADMIN_KEY) {
    throw new Error('❌ FIREBASE_ADMIN_KEY is missing in production');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
} else {
  // 👉 Local development (load from JSON file)
  serviceAccount = require('../config/firebaseAdminKey.json');
}

// 🔥 Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin Initialized');
}

// ======================================================
// 🚀 SEND FCM NOTIFICATIONS
// ======================================================
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
      data: Object.fromEntries(
        Object.entries(payload).map(([k, v]) => [k, String(v)])
      ),
      tokens,
    };

    console.log('🧠 Final FCM Message:', JSON.stringify(fcmMessage, null, 2));

    const messaging = admin.messaging?.() || admin.messaging;
    if (!messaging) {
      throw new Error(
        'Firebase Admin messaging service not initialized properly'
      );
    }

    console.log('📡 Sending with sendEachForMulticast()');
    const response = await messaging.sendEachForMulticast(fcmMessage);

    console.log(`✅ Sent to ${response.successCount} devices`);

    if (response.failureCount > 0) {
      const failed = response.responses
        .map((r, i) => (!r.success ? tokens[i] : null))
        .filter(Boolean);

      console.warn('⚠️ Failed tokens:', failed);

      // 🧹 Remove invalid tokens from DB
      await Customer.updateMany(
        { fcmTokens: { $in: failed } },
        { $pull: { fcmTokens: { $in: failed } } }
      );
    }

    return response;
  } catch (error) {
    console.error('❌ FCM send failed:', error);
  }
};
