import express from "express";
import {
  createTicket,
  getUserTickets,
  getTicketById,
  updateTicketStatus,
} from "../controllers/ticketController.js";

import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// POST /api/tickets - create a new ticket (customer only)
router.post("/", authenticate, authorizeRoles("customer"), createTicket);

// GET /api/tickets - get tickets for logged-in user (customer)
router.get("/", authenticate, authorizeRoles("customer"), getUserTickets);

// GET /api/tickets/:id - get ticket details (authorized users)
router.get("/:id", authenticate, getTicketById);

// PUT /api/tickets/:id/status - update ticket status (technician/admin)
router.put(
  "/:id/status",
  authenticate,
  authorizeRoles("technician", "admin", "superadmin"),
  updateTicketStatus
);

// export default router;

import express from "express";
import {
  createTicket,
  getUserTickets,
  getAllTickets,
  updateTicketStatus,
  assignTicket,
} from "../controllers/ticketController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

// const router = express.Router();

// Routes for Customers (create, view own tickets)
router.post("/", authMiddleware, roleMiddleware(["customer"]), createTicket);
router.get(
  "/my-tickets",
  authMiddleware,
  roleMiddleware(["customer"]),
  getUserTickets
);

// Routes for Admin/Team (view all tickets, update status, assign tickets)
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "technician", "agent"]),
  getAllTickets
);
router.patch(
  "/:ticketId/status",
  authMiddleware,
  roleMiddleware(["admin", "technician", "agent"]),
  updateTicketStatus
);
router.patch(
  "/:ticketId/assign",
  authMiddleware,
  roleMiddleware(["admin"]),
  assignTicket
);

router.put(
  "/:ticketId/assign",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  assignTechnicianToTicket
);
export default router;
