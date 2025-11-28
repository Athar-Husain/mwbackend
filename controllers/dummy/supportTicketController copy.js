// src/controllers/TicketController.js
import SupportTicket from '../models/SupportTicket';
import Customer from '../models/Customer';
import Connection from '../models/Connection';
import ServiceArea from '../models/ServiceArea';

const TicketController = {
  // Create a new ticket
  createTicket: async (req, res) => {
    try {
      const { description, priority, customerId } = req.body;

      // Check if the customer exists
      const customer =
        await Customer.findById(customerId).populate('activeConnection');
      if (!customer)
        return res.status(404).json({ message: 'Customer not found' });

      const connection = customer.activeConnection;
      const serviceArea = connection ? connection.serviceArea : null;

      // Create the ticket
      const newTicket = new SupportTicket({
        customerId,
        connectionId: connection._id,
        serviceArea: serviceArea ? serviceArea._id : null,
        description,
        priority: priority || 'medium',
        status: 'open',
      });

      await newTicket.save();

      res
        .status(201)
        .json({ message: 'Ticket created successfully', ticket: newTicket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get all tickets
  getAllTickets: async (req, res) => {
    try {
      const tickets = await SupportTicket.find()
        .populate('customerId')
        .populate('connectionId')
        .populate('serviceArea');
      res.status(200).json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get ticket by ID
  getTicketById: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id)
        .populate('customerId')
        .populate('connectionId')
        .populate('serviceArea');
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
      res.status(200).json(ticket);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get tickets by customer ID
  getTicketsByCustomer: async (req, res) => {
    try {
      const tickets = await SupportTicket.find({
        customerId: req.params.customerId,
      })
        .populate('customerId')
        .populate('connectionId')
        .populate('serviceArea');
      res.status(200).json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Get recent tickets
  getRecentTickets: async (req, res) => {
    try {
      const tickets = await SupportTicket.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('customerId')
        .populate('connectionId')
        .populate('serviceArea');
      res.status(200).json(tickets);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Update a ticket
  updateTicket: async (req, res) => {
    try {
      const updatedTicket = await SupportTicket.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      )
        .populate('customerId')
        .populate('connectionId')
        .populate('serviceArea');
      if (!updatedTicket)
        return res.status(404).json({ message: 'Ticket not found' });
      res.status(200).json(updatedTicket);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Delete a ticket
  deleteTicket: async (req, res) => {
    try {
      const deletedTicket = await SupportTicket.findByIdAndDelete(
        req.params.id
      );
      if (!deletedTicket)
        return res.status(404).json({ message: 'Ticket not found' });
      res.status(200).json({ message: 'Ticket deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Assign a ticket
  assignTicket: async (req, res) => {
    try {
      const { serviceAreaId } = req.body;
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.serviceArea = serviceAreaId;
      await ticket.save();

      res.status(200).json({ message: 'Ticket assigned successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Reassign a ticket
  reassignTicket: async (req, res) => {
    try {
      const { serviceAreaId } = req.body;
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.serviceArea = serviceAreaId;
      await ticket.save();

      res
        .status(200)
        .json({ message: 'Ticket reassigned successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Escalate a ticket
  escalateTicket: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.status = 'escalated';
      await ticket.save();

      res
        .status(200)
        .json({ message: 'Ticket escalated successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Resolve a ticket
  resolveTicket: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.status = 'resolved';
      await ticket.save();

      res.status(200).json({ message: 'Ticket resolved successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Reopen a ticket
  reopenTicket: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.status = 'open';
      await ticket.save();

      res.status(200).json({ message: 'Ticket reopened successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Close a ticket
  closeTicket: async (req, res) => {
    try {
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      ticket.status = 'closed';
      await ticket.save();

      res.status(200).json({ message: 'Ticket closed successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Add a comment to a ticket
  addComment: async (req, res) => {
    try {
      const { commentId } = req.body;
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      // Assuming you have a Comment model to link to tickets
      ticket.comments.push(commentId);
      await ticket.save();

      res.status(200).json({ message: 'Comment added successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },

  // Add an attachment to a ticket
  addAttachment: async (req, res) => {
    try {
      const { attachmentId } = req.body;
      const ticket = await SupportTicket.findById(req.params.id);
      if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

      // Assuming you have an Attachment model to link to tickets
      ticket.attachments.push(attachmentId);
      await ticket.save();

      res
        .status(200)
        .json({ message: 'Attachment added successfully', ticket });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  },
};

export default TicketController;
