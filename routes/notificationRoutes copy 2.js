// routes/notificationRoutes.js
import express from 'express';
import {
  registerCustomerFCMToken,
  sendNotificationToCustomer,
} from '../controllers/notificationController.js';

const router = express.Router();

router.post('/register-fcm-token', registerCustomerFCMToken);

router.post('/send', sendNotificationToCustomer);

export default router;
