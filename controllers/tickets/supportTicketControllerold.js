import SupportTicket from "../models/SupportTicket.js";
import { io } from "../config/socket.js"; // Import the socket.io instance

// Create a new support ticket
export const createTicket = async (req, res) => {
  try {
    const { setupBoxId, issueType, description, priority } = req.body;
    const customerId = req.user._id; // from auth middleware

    const ticket = await SupportTicket.create({
      customer: customerId,
      setupBox: setupBoxId,
      issueType,
      description,
      priority,
      status: "pending",
    });

    // Emit socket event for new ticket created
    io.emit("ticketCreated", { ticket });

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Failed to create ticket", error });
  }
};

// Get tickets of logged-in user
export const getUserTickets = async (req, res) => {
  try {
    const customerId = req.user._id;

    const tickets = await SupportTicket.find({ customer: customerId })
      .populate("setupBox")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error });
  }
};

// Get all tickets (for admin or team, depending on role)
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("customer setupBox technician") // adjust if technician renamed to team
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching all tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error });
  }
};

// Update ticket status (resolve, escalate, etc.)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status, technicianId } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    if (status) ticket.status = status;
    if (technicianId) ticket.technician = technicianId;

    await ticket.save();

    // Emit socket event for ticket updated
    io.emit("ticketUpdated", { ticket });

    res.status(200).json({ message: "Ticket updated", ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Failed to update ticket", error });
  }
};

// assigned move
import SupportTicket from "../models/SupportTicket.js";
import Team from "../models/Team.js";

// ✅ Reassign or assign a technician to a support ticket
export const assignTechnicianToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { technicianId } = req.body;

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const technician = await Team.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ message: "Technician not found" });
    }

    // ✅ Update assignedTo and push to history
    ticket.assignedTo = technicianId;
    ticket.assignmentHistory.push({
      assignedTo: technicianId,
      assignedAt: new Date(),
    });

    await ticket.save();

    res.status(200).json({
      message: "Technician assigned successfully",
      ticket,
    });
  } catch (error) {
    console.error("Error assigning technician:", error);
    res.status(500).json({ message: "Failed to assign technician", error });
  }
};
