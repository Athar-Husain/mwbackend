import SupportTicket from "../models/SupportTicket.js";
import { io } from "../config/socket.js"; // Import socket.io instance

// 1. Create a Support Ticket
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

// 2. Get All Support Tickets
export const getAllTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("customer")
      .populate("assignedTo")
      .populate("comments")
      .populate("attachments");

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ message: "Failed to fetch tickets", error });
  }
};

// 3. Get Ticket by ID
export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate("customer")
      .populate("assignedTo")
      .populate("comments")
      .populate("attachments");

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ message: "Failed to fetch ticket", error });
  }
};

// 4. Update Support Ticket
export const updateTicket = async (req, res) => {
  try {
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("customer")
      .populate("assignedTo");

    if (!updatedTicket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Emit socket event for ticket updated
    io.emit("ticketUpdated", { ticket: updatedTicket });

    res.status(200).json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    res.status(500).json({ message: "Failed to update ticket", error });
  }
};

// 5. Delete Support Ticket
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndDelete(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Emit socket event for ticket deletion
    io.emit("ticketDeleted", { ticket });

    res.status(200).json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    res.status(500).json({ message: "Failed to delete ticket", error });
  }
};

// 6. Assign Support Ticket
export const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.assignedTo = assignedTo;
    ticket.assignmentHistory.push({ assignedTo, assignedAt: new Date() });

    await ticket.save();

    // Emit socket event for ticket assignment
    io.emit("ticketAssigned", { ticket });

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error assigning ticket:", error);
    res.status(500).json({ message: "Failed to assign ticket", error });
  }
};

// 7. Escalate Support Ticket
export const escalateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.escalated = true;
    ticket.status = "escalated";

    await ticket.save();

    // Emit socket event for ticket escalation
    io.emit("ticketEscalated", { ticket });

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error escalating ticket:", error);
    res.status(500).json({ message: "Failed to escalate ticket", error });
  }
};

// 8. Resolve Support Ticket
export const resolveTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    ticket.status = "resolved";
    ticket.resolvedAt = new Date();

    await ticket.save();

    // Emit socket event for ticket resolution
    io.emit("ticketResolved", { ticket });

    res.status(200).json(ticket);
  } catch (error) {
    console.error("Error resolving ticket:", error);
    res.status(500).json({ message: "Failed to resolve ticket", error });
  }
};

// 9. Add Comment to Ticket
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const newComment = { text, ticket: ticket._id };
    ticket.comments.push(newComment);

    await ticket.save();

    // Emit socket event for new comment added
    io.emit("ticketCommented", { ticket, comment: newComment });

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment", error });
  }
};

// 10. Add Attachment to Ticket
export const addAttachment = async (req, res) => {
  try {
    const { file } = req.body; // Assuming file is sent in the body
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    const newAttachment = { file, ticket: ticket._id };
    ticket.attachments.push(newAttachment);

    await ticket.save();

    // Emit socket event for new attachment added
    io.emit("ticketAttachmentAdded", { ticket, attachment: newAttachment });

    res.status(201).json(newAttachment);
  } catch (error) {
    console.error("Error adding attachment:", error);
    res.status(500).json({ message: "Failed to add attachment", error });
  }
};

// 11. Get Filtered Support Tickets
export const getFilteredTickets = async (req, res) => {
  try {
    const { status, priority, customerId, assignedTo, escalated, issueType } = req.query;

    let filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (customerId) filter.customer = customerId;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (escalated !== undefined) filter.escalated = escalated === "true";
    if (issueType) filter.issueType = issueType;

    const tickets = await SupportTicket.find(filter)
      .populate("customer")
      .populate("assignedTo")
      .populate("comments")
      .populate("attachments");

    if (!tickets.length) {
      return res.status(404).json({ message: "No tickets found matching the criteria" });
    }

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching filtered tickets:", error);
    res.status(500).json({ message: "Failed to fetch filtered tickets", error });
  }
};
