// utils/sendNotification.js
import { messaging } from '../config/firebase';

const sendNotification = async (deviceToken, payload) => {
  try {
    const response = await messaging().send({
      token: deviceToken,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
    });
    console.log('✅ Notification sent:', response);
    return response;
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    throw error;
  }
};

export default sendNotification;
