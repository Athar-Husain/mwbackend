import Plan from '../models/Plan.model.js';
import PlanCategory from '../models/PlanCategory.model.js';
import Customer from '../models/Customer.model.js';
import Connection from '../models/Connection.model.js';
import SubscribedPlanModel from '../models/SubscribedPlan.model.js';

// 1. Create a Plan
export const createPlan = async (req, res) => {
  try {
    const {
      name,
      internetSpeed,
      internetSpeedUnit,
      duration,
      price,
      description,
      category,
      dataLimitType,
      dataLimit,
      features,
      Plancategories,
      isActive,
      featured,
    } = req.body;

    if (Plancategories && Plancategories.length > 0) {
      const categories = await PlanCategory.find({
        _id: { $in: Plancategories },
      });
      if (categories.length !== Plancategories.length) {
        return res
          .status(400)
          .json({ message: 'One or more plan categories do not exist' });
      }
    }

    const newPlan = new Plan({
      name,
      internetSpeed,
      internetSpeedUnit,
      duration,
      price,
      description,
      category,
      dataLimitType,
      dataLimit,
      features,
      Plancategories,
      isActive: isActive || true,
      featured: featured || false,
    });

    const savedPlan = await newPlan.save();
    return res.status(201).json({
      message: 'Plan created successfully',
      plan: savedPlan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 2. Get All Plans
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find().populate('Plancategories');
    return res.status(200).json({ plans });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// api/plans/getAllPlans
// export const getAllPlans = async (req, res) => {
//   try {
//     const plans = await Plan.find({ isDeleted: false }).populate(
//       'Plancategories'
//     );
//     return res.status(200).json({ plans });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// 3. Get Plan by ID
export const getPlanById = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id).populate('Plancategories');
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    return res.status(200).json(plan);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 4. Update Plan
export const updatePlan = async (req, res) => {
  try {
    const {
      name,
      internetSpeed,
      internetSpeedUnit,
      duration,
      price,
      description,
      category,
      dataLimitType,
      dataLimit,
      features,
      Plancategories,
      isActive,
      featured,
    } = req.body;

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      {
        name,
        internetSpeed,
        internetSpeedUnit,
        duration,
        price,
        description,
        category,
        dataLimitType,
        dataLimit,
        features,
        Plancategories,
        isActive: isActive !== undefined ? isActive : true,
        featured: featured !== undefined ? featured : false,
      },
      { new: true, runValidators: true }
    );

    if (!updatedPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    return res.status(200).json({
      message: 'Plan updated successfully',
      plan: updatedPlan,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 5. Delete Plan (Soft Delete)
// Soft delete a plan by setting isDeleted to true
// export const deletePlan = async (req, res) => {
//   try {
//     const deletedPlan = await Plan.findByIdAndUpdate(
//       req.params.id,
//       { isDeleted: true },
//       { new: true } // Return the updated document
//     );

//     if (!deletedPlan) {
//       return res.status(404).json({ message: 'Plan not found' });
//     }

//     return res
//       .status(200)
//       .json({ message: 'Plan deleted successfully', plan: deletedPlan });
//   } catch (error) {
//     console.error('Error deleting plan:', error);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };

export const deletePlan = async (req, res) => {
  try {
    const deletedPlan = await Plan.findByIdAndDelete(req.params.id);

    if (!deletedPlan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    return res.status(200).json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// 6. Get Plans by Criteria
export const getPlansByCriteria = async (req, res) => {
  try {
    const { internetSpeed, minPrice, maxPrice, category } = req.query;

    const query = {};
    if (internetSpeed) query.internetSpeed = internetSpeed;
    if (minPrice) query.price = { $gte: minPrice };
    if (maxPrice) query.price = { $lte: maxPrice };
    if (category) query.category = category;

    const plans = await Plan.find(query).populate('Plancategories');
    return res.status(200).json({ plans });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 7. Subscribe to a Plan
export const subscribeToPlan = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.subscribedPlan = planId;
    await customer.save();

    return res.status(200).json({
      message: 'Subscription successful',
      customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// adminOrTeamSubscribeToPlan

export const adminOrTeamSubscribeToPlanold = async (req, res) => {
  try {
    const { customerId, planId } = req.body; // Expecting admin/team to send customerId and planId

    // Find the plan by ID
    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    // Find the customer by ID (admin/team will specify the customer)
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Assign the plan to the customer
    customer.subscribedPlan = planId;
    await customer.save();

    return res.status(200).json({
      message: 'Subscription activated successfully by admin/team',
      customer,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

// export const adminOrTeamSubscribeToPlan = async (req, res) => {
//   try {
//     const { customerId, connectionId, planId, startDate } = req.body;

//     // 1. Fetch required entities
//     const customer = await Customer.findById(customerId);
//     if (!customer)
//       return res.status(404).json({ message: 'Customer not found' });

//     const connection = await Connection.findById(connectionId);
//     if (!connection)
//       return res.status(404).json({ message: 'Connection not found' });

//     const plan = await Plan.findById(planId);
//     if (!plan) return res.status(404).json({ message: 'Plan not found' });

//     // 2. Parse start date and calculate end date based on plan.duration
//     const start = startDate ? new Date(startDate) : new Date();
//     let end = new Date(start);

//     console.log('plan in adminOrTeamSubscribeToPlan', plan);

//     // Convert plan.duration (e.g., "1_month", "3_months") to number of days
//     const durationMap = {
//       '1-month': 30,
//       '3-months': 90,
//       '6-months': 180,
//       '12-months': 365,
//     };
//     const durationInDays = durationMap[plan.duration] || 30;

//     console.log('durationInDays in adminOrTeamSubscribeToPlan', durationInDays);
//     end.setDate(end.getDate() + durationInDays);

//     // console.log('plan in adminOrTeamSubscribeToPlan', plan);
//     console.log('start in adminOrTeamSubscribeToPlan', start);
//     console.log('end in adminOrTeamSubscribeToPlan', end);

//     // 3. Create SubscribedPlan
//     const subscribedPlan = await SubscribedPlanModel.create({
//       customer: customer._id,
//       connection: connection._id,
//       plan: plan._id,
//       startDate: start,
//       endDate: end,
//       priceAtPurchase: plan.price,
//       status: 'active',
//     });

//     // 4. Update Connection: set as activePlan and push to planHistory
//     connection.activePlan = subscribedPlan._id;
//     connection.planHistory.push(subscribedPlan._id);
//     await connection.save();

//     return res.status(201).json({
//       message: 'Plan subscribed successfully',
//       subscribedPlan,
//     });
//   } catch (error) {
//     console.error('Error subscribing to plan:', error);
//     return res
//       .status(500)
//       .json({ message: 'Server error', error: error.message });
//   }
// };

// 8. Get Customer's Current Plan

export const adminOrTeamSubscribeToPlan = async (req, res) => {
  try {
    const { customerId, connectionId, planId, startDate } = req.body;

    // 1. Fetch required entities
    const customer = await Customer.findById(customerId);
    if (!customer)
      return res.status(404).json({ message: 'Customer not found' });

    const connection = await Connection.findById(connectionId);
    if (!connection)
      return res.status(404).json({ message: 'Connection not found' });

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    // 2. Parse start date and calculate end date based on plan.duration
    const start = startDate ? new Date(startDate) : new Date();
    let end = new Date(start);

    // Convert plan.duration to number of days
    const durationMap = {
      '1-month': 30,
      '3-months': 90,
      '6-months': 180,
      '12-months': 365,
    };

    const durationInDays = durationMap[plan.duration] || 30;
    end.setDate(end.getDate() + durationInDays);

    // 3. Create SubscribedPlan
    const subscribedPlan = await SubscribedPlanModel.create({
      connection: connection._id,
      plan: plan._id,
      startDate: start,
      endDate: end,
      status: 'Active',
      price: plan.price,
      duration: durationInDays,
    });

    // 4. Update Connection with new plan
    connection.activePlan = subscribedPlan._id;
    connection.planHistory.push(subscribedPlan._id);
    await connection.save();

    return res.status(201).json({
      message: 'Plan subscribed successfully',
      subscribedPlan,
    });
  } catch (error) {
    console.error('Error subscribing to plan:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

export const getCustomerCurrentPlanold = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).populate(
      'subscribedPlan'
    );
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const plan = customer.subscribedPlan;
    return res.status(200).json({ plan });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// NOTE: Make sure you have imported all necessary models (Customer, Connection, SubscribedPlan)

export const getCustomerCurrentPlanold2 = async (req, res) => {
  try {
    // The authenticated customer ID comes from the user token
    const customerId = req.user.id;

    console.log('req.users getCustomerCurrentPlan', req.user);
    // The customer must specify which of their connections they want to check

    const activeConnection = req.user.activeConnection;
    // const { connectionId } = req.params; // Assuming connectionId is passed as a URL parameter

    // 1. Validate Connection and Ownership
    const connection = await Connection.findById(activeConnection.id).populate({
      path: 'activePlan', // Populate the SubscribedPlan document
      select: '-connection -__v', // Exclude connection ID from the SubscribedPlan and version key
      populate: {
        path: 'plan', // Inside SubscribedPlan, populate the actual Plan details
        select: 'name description price duration', // Select key fields from the Plan model
      },
    });

    // Check if connection exists
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Security Check: Ensure the connection belongs to the authenticated customer
    if (connection.customerId.toString() !== customerId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized: Connection does not belong to this customer.',
      });
    }

    // 2. Check for Active Plan
    if (!connection.activePlan) {
      return res.status(200).json({
        message: 'No active plan found for this connection.',
        currentPlan: null,
      });
    }

    // 3. Success Response
    return res.status(200).json({
      message: 'Current active plan retrieved successfully',
      currentPlan: connection.activePlan,
      connectionId: connection._id,
    });
  } catch (error) {
    console.error('Error in getCurrentPlan:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

export const getCustomerCurrentPlan = async (req, res) => {
  try {
    // The authenticated customer ID comes from the user token
    const customerId = req.user._id; // Use _id for consistency

    // console.log('req.users getCustomerCurrentPlan', req.user);

    // --- FIX IS HERE ---
    // 1. Get the activeConnection ID from the user object.
    const activeConnectionId = req.user.activeConnection;

    // If the activeConnection is an ObjectId object (as shown in your logs),
    // using toString() ensures we pass a valid string ID to findById().
    if (!activeConnectionId) {
      return res
        .status(404)
        .json({ message: 'No active connection is set on user profile.' });
    }

    // Ensure it's a string, especially if it was an ObjectId object/Buffer
    const connectionId = activeConnectionId.toString();

    // 1. Validate Connection and Ownership
    const connection = await Connection.findById(connectionId).populate({
      path: 'activePlan', // Populate the SubscribedPlan document
      select: '-connection -__v', // Exclude connection ID from the SubscribedPlan and version key
      populate: {
        path: 'plan', // Inside SubscribedPlan, populate the actual Plan details
        select: 'name description price duration internetSpeed internetSpeedUnit', // Select key fields from the Plan model
      },
    });

    // Check if connection exists
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    // Security Check: Ensure the connection belongs to the authenticated customer
    if (connection.customerId.toString() !== customerId.toString()) {
      return res.status(403).json({
        message: 'Unauthorized: Connection does not belong to this customer.',
      });
    }

    // 2. Check for Active Plan
    if (!connection.activePlan) {
      return res.status(200).json({
        message: 'No active plan found for this connection.',
        currentPlan: null,
      });
    }

    // 3. Success Response
    return res.status(200).json({
      message: 'Current active plan retrieved successfully',
      currentPlan: connection.activePlan,
      connectionId: connection._id,
    });
  } catch (error) {
    console.error('Error in getCurrentPlan:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message,
    });
  }
};

// 9. Renew Subscription
export const renewSubscription = async (req, res) => {
  try {
    const { planId } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const customer = await Customer.findById(req.user.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    customer.subscribedPlan = planId;
    await customer.save();

    return res.status(200).json({
      message: 'Subscription renewed successfully',
      customer,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// 10. Check Plan Expiry
export const checkPlanExpiry = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id).populate(
      'subscribedPlan'
    );
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const plan = customer.subscribedPlan;
    if (!plan) {
      return res.status(404).json({ message: 'No active subscription found' });
    }

    const currentDate = new Date();
    const expiryDate = new Date(customer.subscriptionExpiryDate);
    if (expiryDate < currentDate) {
      return res.status(200).json({ message: 'Plan has expired' });
    }

    return res.status(200).json({ message: 'Plan is active' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
