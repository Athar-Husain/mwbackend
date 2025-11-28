import Connection from '../models/Connection.model.js';
import Customer from '../models/Customer.model.js'; // To validate customer existence
import SubscribedPlan from '../models/SubscribedPlan.model.js'; // To manage active and historical plans
import Plan from '../models/Plan.model.js'; // Assuming you have a Plan model

// Create a new connection
export const createConnection = async (req, res) => {
  try {
    const {
      boxId,
      username,
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
      username,
      customer,
      region,
      contactNo,
      connectionType,
      stbNumber,
      aliasName,
      serviceArea,
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
      .populate('customer') // Populate customer data
      .populate('activePlan'); // Populate the active plan data
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
      .populate('activePlan');
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

// Update connection (e.g., change the active plan, region, stbNumber, etc.)
export const updateConnection = async (req, res) => {
  try {
    const {
      boxId,
      username,
      customer,
      activePlan,
      region,
      stbNumber,
      aliasName,
      serviceArea,
    } = req.body;

    // Validate customer and active plan existence
    if (customer && !(await Customer.findById(customer))) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    if (activePlan && !(await SubscribedPlan.findById(activePlan))) {
      return res.status(404).json({ message: 'Subscribed plan not found' });
    }

    const connection = await Connection.findByIdAndUpdate(
      req.params.id,
      {
        boxId,
        username,
        customer,
        activePlan,
        region,
        stbNumber,
        aliasName,
        serviceArea,
      },
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
      .populate('customer') // Populate customer data
      .populate('activePlan'); // Populate the active plan data

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

// Add or update a subscription plan for a connection
export const updateSubscribedPlan = async (req, res) => {
  try {
    const { connectionId, planId, price, duration } = req.body;

    // Validate connection and plan existence
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Create a new SubscribedPlan
    const newSubscribedPlan = new SubscribedPlan({
      connection: connectionId,
      plan: planId,
      price,
      duration,
      startDate: new Date(),
    });

    // Save the new SubscribedPlan
    const savedSubscribedPlan = await newSubscribedPlan.save();

    // Add the new plan to the connection's planHistory
    connection.planHistory.push(savedSubscribedPlan._id);

    // Update the activePlan of the connection
    connection.activePlan = savedSubscribedPlan._id;

    // Save the updated connection
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

// Get all subscribed plans for a connection
export const getSubscribedPlans = async (req, res) => {
  try {
    const connectionId = req.params.connectionId;
    const connection = await Connection.findById(connectionId)
      .populate('activePlan') // Populate active plan
      .populate('planHistory'); // Populate plan history

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

// Get all connections
// export const getAllConnections = async (req, res) => {
//   try {
//     const connections = await Connection.find()
//       .populate('customer') // Populate customer data
//       .populate('activePlan') // Populate active plan data
//       .populate('serviceArea') // If needed, populate service area
//       .populate('agent'); // Populate agent data if required

//     res.status(200).json(connections);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching connections', error: error.message });
//   }
// };

// // Get connection by ID
// export const getConnectionById = async (req, res) => {
//   try {
//     const connection = await Connection.findById(req.params.id)
//       .populate('customer') // Populate customer data
//       .populate('activePlan') // Populate active plan data
//       .populate('serviceArea') // If needed, populate service area
//       .populate('agent'); // Populate agent data if required

//     if (!connection) {
//       return res.status(404).json({ message: 'Connection not found' });
//     }
//     res.status(200).json(connection);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Error fetching connection', error: error.message });
//   }
// };

// // Get filtered connections based on query parameters
// export const getFilteredConnections = async (req, res) => {
//   try {
//     const { boxId, customerId, region, isActive, connectionType } = req.query;

//     // Build the query dynamically based on provided query params
//     let filter = {};

//     if (boxId) {
//       filter.boxId = boxId; // Filter by boxId
//     }

//     if (customerId) {
//       filter.customer = customerId; // Filter by customer ID
//     }

//     if (region) {
//       filter.region = region; // Filter by region
//     }

//     if (isActive !== undefined) {
//       filter.isActive = isActive === 'true'; // Convert to boolean based on 'true' or 'false'
//     }

//     if (connectionType) {
//       filter.connectionType = connectionType; // Filter by connection type (Fiber, DSL, Cable)
//     }

//     const connections = await Connection.find(filter)
//       .populate('customer') // Populate customer data
//       .populate('activePlan') // Populate the active plan data
//       .populate('serviceArea') // Populate the service area if required
//       .populate('agent'); // Populate the agent if required

//     if (connections.length === 0) {
//       return res.status(404).json({ message: 'No connections found matching the criteria' });
//     }

//     res.status(200).json(connections);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       message: 'Error fetching filtered connections',
//       error: error.message,
//     });
//   }
// };
