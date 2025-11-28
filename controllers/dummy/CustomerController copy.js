import Connection from '../models/Connection.model.js';
import Customer from '../models/Customer.model.js';
import SubscribedPlan from '../models/SubscribedPlan.model.js';
import Plan from '../models/Plan.model.js';

// Create a new connection
export const createConnection = async (req, res) => {
  try {
    const {
      boxId,
      userName,
      customer,
      region,
      contactNo,
      connectionType,
      stbNumber,
      aliasName,
      serviceArea,
    } = req.body;

    // Validate that the customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const connection = new Connection({
      boxId,
      userName,
      customer,
      region,
      contactNo,
      connectionType,
      stbNumber,
      aliasName,
      serviceArea,
      isActive: true, // default to true on create
    });

    await connection.save();
    res
      .status(201)
      .json({ message: 'Connection created successfully', connection });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error creating connection', error: error.message });
  }
};

// Get all connections
export const getAllConnections = async (req, res) => {
  try {
    const connections = await Connection.find()
      .populate('customer')
      .populate('activePlan')
      .populate('serviceArea')
      .populate('agent');

    res.status(200).json(connections);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error fetching connections', error: error.message });
  }
};

// Get connection by ID
export const getConnectionById = async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.id)
      .populate('customer')
      .populate('activePlan')
      .populate('serviceArea')
      .populate('agent');

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    res.status(200).json(connection);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error fetching connection', error: error.message });
  }
};

// Update connection
export const updateConnection = async (req, res) => {
  try {
    const {
      boxId,
      userName,
      customer,
      activePlan,
      region,
      stbNumber,
      aliasName,
      serviceArea,
      contactNo,
      connectionStatus,
      connectionType,
      agent,
      isActive,
      address, // If you want to allow updating address as well
    } = req.body;

    // Validate customer if provided
    if (customer && !(await Customer.findById(customer))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate active plan if provided
    if (activePlan && !(await SubscribedPlan.findById(activePlan))) {
      return res.status(404).json({ message: 'Subscribed plan not found' });
    }

    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      {
        boxId,
        userName,
        customer,
        activePlan,
        region,
        stbNumber,
        aliasName,
        serviceArea,
        contactNo,
        connectionStatus,
        connectionType,
        agent,
        isActive,
        address,
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    res
      .status(200)
      .json({ message: 'Connection updated successfully', connection });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error updating connection', error: error.message });
  }
};

// Soft deactivate connection
export const deactivateConnection = async (req, res) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    res
      .status(200)
      .json({ message: 'Connection deactivated successfully', connection });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error deactivating connection', error: error.message });
  }
};

// Hard delete connection
export const deleteConnection = async (req, res) => {
  try {
    const connection = await Connection.findByIdAndDelete(req.params.id);

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    res.status(200).json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error deleting connection', error: error.message });
  }
};

// Filtered connections
export const getFilteredConnections = async (req, res) => {
  try {
    const {
      boxId,
      customerId,
      region,
      isActive,
      connectionType,
      connectionStatus,
      aliasName,
    } = req.query;

    let filter = {};

    if (boxId) filter.boxId = boxId;
    if (customerId) filter.customer = customerId;
    if (region) filter.region = region;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (connectionType) filter.connectionType = connectionType;
    if (connectionStatus) filter.connectionStatus = connectionStatus;
    if (aliasName) filter.aliasName = aliasName;

    const connections = await Connection.find(filter)
      .populate('customer')
      .populate('activePlan')
      .populate('serviceArea')
      .populate('agent');

    if (!connections.length) {
      return res
        .status(404)
        .json({ message: 'No connections found matching the criteria' });
    }

    res.status(200).json(connections);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching filtered connections',
      error: error.message,
    });
  }
};

// Update subscribed plan for a connection
export const updateSubscribedPlan = async (req, res) => {
  try {
    const { connectionId, planId, price, duration } = req.body;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const newSubscribedPlan = new SubscribedPlan({
      connection: connectionId,
      plan: planId,
      price,
      duration,
      startDate: new Date(),
    });

    const savedSubscribedPlan = await newSubscribedPlan.save();

    connection.planHistory.push(savedSubscribedPlan._id);
    connection.activePlan = savedSubscribedPlan._id;

    await connection.save();

    res.status(200).json({
      message: 'Successfully updated subscribed plan for the connection',
      plan: savedSubscribedPlan,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error updating subscribed plan',
      error: error.message,
    });
  }
};

// Get subscribed plans for a connection
export const getSubscribedPlans = async (req, res) => {
  try {
    const connectionId = req.params.connectionId;
    const connection = await Connection.findById(connectionId)
      .populate('activePlan')
      .populate('planHistory');

    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    res.status(200).json({
      activePlan: connection.activePlan,
      planHistory: connection.planHistory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching subscribed plans',
      error: error.message,
    });
  }
};


export const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const admin = await Customer.findById(req.user.id);

  if (!admin) {
    return res.status(404).json({ message: 'Admin not found' });
  }

  const isMatch = await admin.comparePassword(oldPassword);
  if (!isMatch) {
    return res.status(400).json({ message: 'Old password is incorrect' });
  }

  admin.password = newPassword;
  await admin.save();

  res.status(200).json({ message: 'Password changed successfully' });
});