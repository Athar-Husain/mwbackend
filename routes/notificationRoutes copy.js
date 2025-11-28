// import express from "express";
// import {
//   sendNotification,
//   getNotifications,
// } from "../controllers/notificationController.js";
// import { authMiddleware } from "../middlewares/authMiddleware.js";
// import { roleMiddleware } from "../middlewares/roleMiddleware.js";

// const router = express.Router();

// // Send a notification (usually admin)
// router.post(
//   "/send",
//   authMiddleware,
//   roleMiddleware(["admin", "superadmin"]),
//   sendNotification
// );

// // Get notifications for logged-in user
// router.get("/", authMiddleware, getNotifications);

// export default router;


