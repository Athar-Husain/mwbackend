import express from "express";
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcementController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Public (or protected based on your needs)
router.get("/", authMiddleware, getAnnouncements);
router.get("/:id", authMiddleware, getAnnouncementById);

// Admin-only routes
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  createAnnouncement
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  updateAnnouncement
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  deleteAnnouncement
);

export default router;
