import Connection from '../models/Connection.model.js';
import Customer from '../models/Customer.model.js';
<<<<<<< HEAD
=======
import asyncHandler from 'express-async-handler';
// import Connection from '../models/Connection.model.js';
>>>>>>> 0338fc4 (Initial commit - updated backend)
import SubscribedPlan from '../models/SubscribedPlan.model.js';
import Plan from '../models/Plan.model.js';

// Create a new connection
<<<<<<< HEAD
export const createConnection = async (req, res) => {
  // console.log('createConnection req.body', req.body);
=======
// export const createConnection = async (req, res) => {
//   // console.log('createConnection req.body', req.body);
//   try {
//     const {
//       boxId,
//       userName,
//       customerId,
//       // region,
//       userId,
//       contactNo,
//       connectionType,
//       stbNumber,
//       aliasName,
//       serviceArea,
//     } = req.body;

//     console.log('req body in connection', req.body);

//     // console.log('Request Body:', customer);

//     // Validate that the customer exists
//     const customerExists = await Customer.findById(customerId);
//     if (!customerExists) {
//       return res.status(404).json({ message: 'Customer not found' });
//     }

//     const connection = new Connection({
//       boxId,
//       userName,
//       customerId,
//       // region,
//       userId,
//       contactNo,
//       connectionType,
//       stbNumber,
//       aliasName,
//       serviceArea,
//       isActive: true, // default to true on create
//     });

//     await connection.save();
//     res
//       .status(201)
//       .json({ message: 'Connection created successfully', connection });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: 'Error creating connection', error: error.message });
//   }
// };

export const createConnection = async (req, res) => {
>>>>>>> 0338fc4 (Initial commit - updated backend)
  try {
    const {
      boxId,
      userName,
      customerId,
<<<<<<< HEAD
      // region,
=======
>>>>>>> 0338fc4 (Initial commit - updated backend)
      userId,
      contactNo,
      connectionType,
      stbNumber,
      aliasName,
      serviceArea,
    } = req.body;

<<<<<<< HEAD
    // console.log('Request Body:', customer);
=======
    console.log('req body in connection', req.body);
>>>>>>> 0338fc4 (Initial commit - updated backend)

    // Validate that the customer exists
    const customerExists = await Customer.findById(customerId);
    if (!customerExists) {
      return res.status(404).json({ message: 'Customer not found' });
    }

<<<<<<< HEAD
=======
    // Create a new connection
>>>>>>> 0338fc4 (Initial commit - updated backend)
    const connection = new Connection({
      boxId,
      userName,
      customerId,
<<<<<<< HEAD
      // region,
=======
>>>>>>> 0338fc4 (Initial commit - updated backend)
      userId,
      contactNo,
      connectionType,
      stbNumber,
      aliasName,
      serviceArea,
      isActive: true, // default to true on create
    });

<<<<<<< HEAD
    await connection.save();
    res
      .status(201)
      .json({ message: 'Connection created successfully', connection });
=======
    const savedConnection = await connection.save();

    // Add the connection to the customer's connections array
    await Customer.findByIdAndUpdate(customerId, {
      $push: { connections: savedConnection._id }, // Add connection ID to the connections array
      $set: {
        activeConnection:
          customerExists.activeConnection || savedConnection._id,
      }, // Set activeConnection if not already set
    });

    res.status(201).json({
      message: 'Connection created successfully',
      connection: savedConnection,
    });
>>>>>>> 0338fc4 (Initial commit - updated backend)
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
<<<<<<< HEAD
    const connections = await Connection.find()
      // .populate('customer')
      // .populate('activePlan')
      // .populate('serviceArea')
      // .populate('agent');
=======
    const connections = await Connection.find();
    // .populate('customer')
    // .populate('activePlan')
    // .populate('serviceArea')
    // .populate('agent');
>>>>>>> 0338fc4 (Initial commit - updated backend)

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
<<<<<<< HEAD
=======

export const getConnectionsForUser = async (req, res) => {
  try {
    const customerId = req.user.id; // Get the customer ID from req.user

    // Query the Connection collection directly
    const connections = await Connection.find({ customerId })
      // .populate('Customer')
      .populate('serviceArea')
      .populate('activePlan');

    if (!connections.length) {
      return res
        .status(404)
        .json({ message: 'No connections found for this user' });
    }

    res.status(200).json(connections);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching connections for the user',
      error: error.message,
    });
  }
};



export const getActiveConnectionForUser = asyncHandler(async (req, res) => {
  try {
    // Get the activeConnection from req.user (assuming it's passed from middleware)
    const { activeConnection } = req.user;

    console.log('activeConnection', activeConnection);

    // Check if activeConnection is set
    if (!activeConnection) {
      return res
        .status(404)
        .json({ message: 'No active connection found for this user' });
    }

    // Fetch the active connection with required populates
    const connection = await Connection.findById(activeConnection)
      .populate('serviceArea')
      .populate('activePlan');

    // If connection does not exist
    if (!connection) {
      return res.status(404).json({ message: 'Active connection not found' });
    }

    // Return the active connection
    return res.status(200).json(connection);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'Error fetching active connection for the user',
      error: error.message,
    });
  }
});

export const getActiveConnetionForUserold = asyncHandler(async (req, res) => {
  const customerId = req.user.id;

  const getActive = customerId.activeConnection;

  if (!getActive) {
    return res.status(404).json({ message: 'No Active connections found' });
  }

  try {
    const foundActiveconnection = await Connection.find({ getActive })
      // .populate('Customer')
      .populate('serviceArea')
      .populate('activePlan');

    if (!foundActiveconnection) {
      return res
        .status(404)
        .json({ message: 'No connections found for this user' });
    }

    res.status(200).json(foundActiveconnection);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching connections for the user',
      error: error.message,
    });
  }
});
>>>>>>> 0338fc4 (Initial commit - updated backend)
