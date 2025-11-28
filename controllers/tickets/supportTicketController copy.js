import SupportTicket from '../models/SupportTicket.js';
import Connection from '../models/Connection.js';
import Team from '../models/Team.js';
import Admin from '../models/Admin.js';
import Customer from '../models/Customer.js';
import mongoose from 'mongoose';

const ObjectId = mongoose.Types.ObjectId;

/**
 * Validate assigned team belongs to connection's serviceArea
 * @param {ObjectId} connectionId
 * @param {ObjectId} assignedToId
 * @param {String} assignedToModel
 */
async function validateAssignment(connectionId, assignedToId, assignedToModel) {
  if (!assignedToId || !assignedToModel) return;

  if (assignedToModel === 'Team') {
    // Get connection serviceArea
    const connection = await Connection.findById(connectionId)
      .select('serviceArea')
      .lean();
    if (!connection) throw new Error('Connection not found');

    // Get team areas
    const team = await Team.findById(assignedToId).select('area').lean();
    if (!team) throw new Error('Assigned Team not found');

    // Check if connection.serviceArea is in team.area array
    const match = team.area.some(
      (areaId) => areaId.toString() === connection.serviceArea.toString()
    );
    if (!match)
      throw new Error(
        'Assigned Team does not cover the Connection’s service area'
      );
  }

  // For Admin or other assignedToModel, no serviceArea validation needed
}

/**
 * Create Support Ticket
 */
export async function createTicket(req, res) {
  try {
    const {
      customer,
      connectionId,
      assignedTo,
      assignedToModel,
      issueType,
      description,
      priority,
      createdBy,
      createdByModel,
      note,
    } = req.body;

    // Validate mandatory fields
    if (
      !customer ||
      !connectionId ||
      !description ||
      !createdBy ||
      !createdByModel
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate connection exists
    const connection = await Connection.findById(connectionId);
    if (!connection)
      return res.status(404).json({ error: 'Connection not found' });

    // Validate assignedTo serviceArea if applicable
    if (assignedTo && assignedToModel) {
      await validateAssignment(connectionId, assignedTo, assignedToModel);
    }

    // Create assignment history entry if assignedTo provided
    const assignmentHistory = [];
    if (assignedTo && assignedToModel && createdBy && createdByModel) {
      assignmentHistory.push({
        assignedTo,
        assignedToModel,
        assignedBy: createdBy,
        assignedByModel: createdByModel,
        assignedAt: new Date(),
        note: note || '',
      });
    }

    // Create ticket
    const newTicket = new SupportTicket({
      customer,
      assignedTo,
      assignedToModel,
      assignmentHistory,
      issueType: issueType || 'other',
      description,
      priority: priority || 'low',
      status: 'Open',
      escalated: false,
      comments: [],
      attachments: [],
      createdBy,
      createdByModel,
      updatedBy: createdBy,
      updatedByModel: createdByModel,
    });

    const savedTicket = await newTicket.save();

    // Optionally link ticket to connection (if needed)
    connection.ticket = savedTicket._id;
    await connection.save();

    res.status(201).json(savedTicket);
  } catch (err) {
    console.error('Create Ticket Error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get Ticket By ID
 */
export async function getTicketById(req, res) {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid ticket ID' });

    const ticket = await SupportTicket.findById(id)
      .populate('customer', 'firstName lastName email')
      .populate('assignedTo')
      .populate('comments')
      .populate('attachments')
      .populate('createdBy')
      .populate('updatedBy')
      .lean();

    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    res.json(ticket);
  } catch (err) {
    console.error('Get Ticket Error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Update Ticket
 * Supports updating description, priority, status, assignedTo (with validation), escalated etc.
 */
export async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const {
      assignedTo,
      assignedToModel,
      description,
      priority,
      status,
      escalated,
      updatedBy,
      updatedByModel,
      note,
      resolutionMessage,
      resolvedBy,
      resolvedByModel,
    } = req.body;

    if (!ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid ticket ID' });

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // If assignedTo changed, validate serviceArea matching connection.serviceArea
    if (assignedTo && assignedToModel) {
      // Need to get connection for this ticket
      // Get connection linked to this ticket (via Connection model)
      const connection = await Connection.findOne({ ticket: ticket._id });
      if (!connection)
        return res
          .status(400)
          .json({ error: 'Connection linked to ticket not found' });

      await validateAssignment(connection._id, assignedTo, assignedToModel);

      // Add to assignmentHistory
      ticket.assignmentHistory.push({
        assignedTo,
        assignedToModel,
        assignedBy: updatedBy,
        assignedByModel: updatedByModel,
        assignedAt: new Date(),
        note: note || '',
      });

      ticket.assignedTo = assignedTo;
      ticket.assignedToModel = assignedToModel;
    }

    if (description !== undefined) ticket.description = description;
    if (priority !== undefined) ticket.priority = priority;
    if (status !== undefined) ticket.status = status;
    if (escalated !== undefined) ticket.escalated = escalated;

    // Handle resolution info if ticket is closed
    if (status === 'Closed') {
      ticket.resolutionMessage = resolutionMessage || ticket.resolutionMessage;
      ticket.resolvedBy = resolvedBy || ticket.resolvedBy;
      ticket.resolvedByModel = resolvedByModel || ticket.resolvedByModel;
      ticket.resolvedAt = new Date();
    }

    ticket.updatedBy = updatedBy || ticket.updatedBy;
    ticket.updatedByModel = updatedByModel || ticket.updatedByModel;

    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error('Update Ticket Error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * List tickets with filters (customer, status, priority, assignedTo, serviceArea)
 */
export async function listTickets(req, res) {
  try {
    const {
      customer,
      status,
      priority,
      assignedTo,
      assignedToModel,
      serviceArea,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (customer && ObjectId.isValid(customer)) query.customer = customer;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo && ObjectId.isValid(assignedTo)) {
      query.assignedTo = assignedTo;
    }
    if (assignedToModel) query.assignedToModel = assignedToModel;

    // If filtering by serviceArea - tickets where linked connection has that serviceArea
    if (serviceArea && ObjectId.isValid(serviceArea)) {
      // Get connections with this serviceArea
      const connections = await Connection.find({ serviceArea })
        .select('_id')
        .lean();
      const connectionIds = connections.map((c) => c._id);

      // Find tickets assigned to these connections
      // Tickets don't have connection ref, but connections link tickets
      // So find tickets with _id in connection.ticket
      query._id = {
        $in: connections.filter((c) => c.ticket).map((c) => c.ticket),
      };
    }

    const tickets = await SupportTicket.find(query)
      .populate('customer', 'firstName lastName')
      .populate('assignedTo')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .lean();

    res.json(tickets);
  } catch (err) {
    console.error('List Tickets Error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Assign ticket to team or admin
 */
export async function assignTicket(req, res) {
  try {
    const { ticketId } = req.params;
    const { assignedTo, assignedToModel, assignedBy, assignedByModel, note } =
      req.body;

    if (!ObjectId.isValid(ticketId))
      return res.status(400).json({ error: 'Invalid ticket ID' });
    if (!assignedTo || !assignedToModel || !assignedBy || !assignedByModel) {
      return res.status(400).json({ error: 'Missing assignment info' });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    // Find connection linked to ticket
    const connection = await Connection.findOne({ ticket: ticket._id });
    if (!connection)
      return res
        .status(400)
        .json({ error: 'Connection linked to ticket not found' });

    // Validate assignment
    await validateAssignment(connection._id, assignedTo, assignedToModel);

    // Update assignment
    ticket.assignedTo = assignedTo;
    ticket.assignedToModel = assignedToModel;

    // Add assignmentHistory record
    ticket.assignmentHistory.push({
      assignedTo,
      assignedToModel,
      assignedBy,
      assignedByModel,
      assignedAt: new Date(),
      note: note || '',
    });

    ticket.updatedBy = assignedBy;
    ticket.updatedByModel = assignedByModel;

    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error('Assign Ticket Error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Close/Resolve ticket
 */
export async function closeTicket(req, res) {
  try {
    const { ticketId } = req.params;
    const {
      resolutionMessage,
      resolvedBy,
      resolvedByModel,
      updatedBy,
      updatedByModel,
    } = req.body;

    if (!ObjectId.isValid(ticketId))
      return res.status(400).json({ error: 'Invalid ticket ID' });
    if (!resolvedBy || !resolvedByModel)
      return res.status(400).json({ error: 'Missing resolution info' });

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    ticket.status = 'Closed';
    ticket.resolutionMessage = resolutionMessage;
    ticket.resolvedBy = resolvedBy;
    ticket.resolvedByModel = resolvedByModel;
    ticket.resolvedAt = new Date();
    ticket.updatedBy = updatedBy || resolvedBy;
    ticket.updatedByModel = updatedByModel || resolvedByModel;

    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error('Close Ticket Error:', err);
    res.status(500).json({ error: err.message });
  }
}

const validateAssignment = async (
  connectionId,
  assignedToId,
  assignedToModel
) => {
  if (!assignedToId || !assignedToModel) return;

  if (assignedToModel === 'Team') {
    const connection = await Connection.findById(connectionId)
      .select('serviceArea')
      .lean();
    if (!connection) throw new Error('Connection not found');

    const team = await Team.findById(assignedToId).select('area').lean();
    if (!team) throw new Error('Assigned Team not found');

    const coversServiceArea = team.area.some(
      (areaId) => areaId.toString() === connection.serviceArea.toString()
    );
    if (!coversServiceArea)
      throw new Error(
        'Assigned Team does not cover the Connection’s service area'
      );
  }
};

// Controller for customers creating tickets (uses req.user)
export const createTicketByCustomer = async (req, res) => {
  try {
    const customerId = req.user._id;
    const {
      assignedTo,
      assignedToModel,
      issueType = 'other',
      description,
      priority = 'low',
      note,
    } = req.body;

    if (!description)
      return res.status(400).json({ error: 'Description is required' });

    // Find customer's active connection
    const connection = await Connection.findOne({
      customerId,
      isActive: true,
    }).lean();
    if (!connection)
      return res
        .status(404)
        .json({ error: 'Active connection not found for customer' });

    // Validate assignment if assigned
    if (assignedTo && assignedToModel) {
      await validateAssignment(connection._id, assignedTo, assignedToModel);
    }

    // Build assignmentHistory if assigned
    const assignmentHistory = [];
    if (assignedTo && assignedToModel) {
      assignmentHistory.push({
        assignedTo,
        assignedToModel,
        assignedBy: customerId,
        assignedByModel: 'Customer',
        assignedAt: new Date(),
        note: note || '',
      });
    }

    const ticket = new SupportTicket({
      customer: customerId,
      assignedTo,
      assignedToModel,
      assignmentHistory,
      issueType,
      description,
      priority,
      status: 'Open',
      escalated: false,
      createdBy: customerId,
      createdByModel: 'Customer',
      updatedBy: customerId,
      updatedByModel: 'Customer',
    });

    const savedTicket = await ticket.save();

    // Link ticket to connection
    await Connection.findByIdAndUpdate(connection._id, {
      ticket: savedTicket._id,
    });

    return res.status(201).json(savedTicket);
  } catch (error) {
    console.error('createTicketByCustomer:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Controller for internal team/admin creating tickets (no req.user)
export const createTicketByInternal = async (req, res) => {
  try {
    const {
      customer,
      connectionId,
      assignedTo,
      assignedToModel,
      issueType = 'other',
      description,
      priority = 'low',
      createdBy,
      createdByModel,
      note,
    } = req.body;

    if (
      !customer ||
      !connectionId ||
      !description ||
      !createdBy ||
      !createdByModel
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate connection exists and is linked to customer
    const connection = await Connection.findById(connectionId).lean();
    if (!connection)
      return res.status(404).json({ error: 'Connection not found' });
    if (connection.customerId.toString() !== customer) {
      return res
        .status(400)
        .json({
          error: 'Connection does not belong to the specified customer',
        });
    }

    // Validate assignedTo service area
    if (assignedTo && assignedToModel) {
      await validateAssignment(connectionId, assignedTo, assignedToModel);
    }

    // Create assignment history if assigned
    const assignmentHistory = [];
    if (assignedTo && assignedToModel) {
      assignmentHistory.push({
        assignedTo,
        assignedToModel,
        assignedBy: createdBy,
        assignedByModel: createdByModel,
        assignedAt: new Date(),
        note: note || '',
      });
    }

    const ticket = new SupportTicket({
      customer,
      assignedTo,
      assignedToModel,
      assignmentHistory,
      issueType,
      description,
      priority,
      status: 'Open',
      escalated: false,
      createdBy,
      createdByModel,
      updatedBy: createdBy,
      updatedByModel: createdByModel,
    });

    const savedTicket = await ticket.save();

    // Link ticket to connection
    await Connection.findByIdAndUpdate(connectionId, {
      ticket: savedTicket._id,
    });

    return res.status(201).json(savedTicket);
  } catch (error) {
    console.error('createTicketByInternal:', error);
    return res.status(500).json({ error: error.message });
  }
};

