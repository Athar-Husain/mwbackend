import Connection from '../models/Connection.model.js';
import Customer from '../models/Customer.model.js'; // Assuming you need to fetch customer data
// import SubscribedPlan from '../models/subscribedPlanModel'; // Assuming you have a SubscribedPlan model

// Create a new connection
export const createConnection = async (req, res) => {
  try {
    const {
      boxId,
      username,
      customer,
      // activePlan,
      region,
    } = req.body;

    // Validate that the customer exists
    const customerExists = await Customer.findById(customer);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const connection = new Connection({
      boxId,
      username,
      customer,
      // activePlan,
      region,
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
      .populate('customer') // Assuming you want to populate the customer data
      // .populate('activePlan'); // Assuming you want to populate the active plan data
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
      // .populate('activePlan');
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

// Update connection (e.g., change the active plan or region)
export const updateConnection = async (req, res) => {
  try {
    const { boxId, username, customer, activePlan, isActive, region } =
      req.body;

    // Validate customer and active plan existence
    if (customer && !(await Customer.findById(customer))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (activePlan && !(await SubscribedPlan.findById(activePlan))) {
      return res.status(404).json({ message: 'Subscribed plan not found' });
    }

    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { boxId, username, customer, activePlan, isActive, region },
      { new: true } // Return the updated connection
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

// Deactivate or delete a connection (soft delete with "isActive" flag)
export const deactivateConnection = async (req, res) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true } // Return the updated connection
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

// Delete a connection (optional hard delete)
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

// Get filtered connections based on query parameters
export const getFilteredConnections = async (req, res) => {
  try {
    const { boxId, customerId, region, isActive } = req.query;

    // Build the query dynamically based on provided query params
    let filter = {};

    if (boxId) {
      filter.boxId = boxId;
    }

    if (customerId) {
      filter.customer = customerId; // Match customer ID
    }

    if (region) {
      filter.region = region;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true'; // Convert to boolean based on 'true' or 'false'
    }

    const connections = await Connection.find(filter)
      .populate('customer') // Assuming you want to populate customer data
      .populate('activePlan'); // Assuming you want to populate the active plan data

    if (connections.length === 0) {
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
