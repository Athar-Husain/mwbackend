import express from "express";
import {
  getTeamMembers,
  getTeamMemberById,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../controllers/TeamController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// GET /api/team - list all team members (admin, superadmin)
router.get(
  "/",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  getTeamMembers
);

// GET /api/team/:id - get single team member details
router.get(
  "/:id",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  getTeamMemberById
);

// POST /api/team - create new team member
router.post(
  "/",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  createTeamMember
);

// PUT /api/team/:id - update team member
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  updateTeamMember
);

// DELETE /api/team/:id - delete team member
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin", "superadmin"),
  deleteTeamMember
);

export default router;
