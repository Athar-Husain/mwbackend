// controllers/leadController.js
import Lead from '../models/Lead.model.js';
import Customer from '../models/Customer.model.js';
import Team from '../models/Team.model.js';

// CREATE Lead - Any authenticated user
export const createLead = async (req, res) => {
  try {
    const { name, phone, alternatePhone, area, address, notes } = req.body;

    // req.user comes from auth middleware { _id, model: 'Admin'|'Team'|'Customer' }
    const lead = new Lead({
      name,
      phone,
      alternatePhone,
      area,
      address,
      notes,
      createdBy: req.user._id,
      createdByModel: req.user.model,
      assignedTo: req.user.model === 'Team' ? req.user._id : null, // Auto-assign if team creates
    });

    await lead.save();

    // Populate creator info for response
    await lead.populate('createdBy', 'firstName lastName phone');

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET Leads - Filtered for Dashboard
export const getAllLeads = async (req, res) => {
  try {
    const {
      status,
      area,
      assignedTo,
      createdBy,
      source, // 'customer' | 'team' | 'admin'
      page = 1,
      limit = 20,
      search,
    } = req.query;

    let query = {};

    if (status) query.status = status;
    if (area) query.area = area;
    if (assignedTo) query.assignedTo = assignedTo;

    // Source filtering (for referral tracking)
    if (source === 'customer') query.createdByModel = 'Customer';
    if (source === 'team') query.createdByModel = 'Team';
    if (source === 'admin') query.createdByModel = 'Admin';

    // Role-based restrictions
    if (req.user.model === 'Team') {
      // Team only sees their assigned leads OR unassigned in their areas
      query.$or = [
        { assignedTo: req.user._id },
        { assignedTo: null, area: { $in: req.user.areas } }, // assuming team has areas
      ];
    } else if (req.user.model === 'Customer') {
      // Customers only see leads they created
      query.createdBy = req.user._id;
    }
    // Admin sees all

    // Search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search } },
      ];
    }

    const leads = await Lead.find(query)
      .populate('createdBy', 'firstName lastName phone')
      .populate('assignedTo', 'firstName lastName')
      .populate('area', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      leads,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Lead Status or Assignment
export const updateLead = async (req, res) => {
  try {
    const { status, assignedTo, notes } = req.body;

    const lead = await Lead.findById(req.params.id);

    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Authorization: Admin full access, Team only if assigned or in area, Customer only if they created
    if (
      req.user.model !== 'Admin' &&
      req.user.model === 'Team' &&
      lead.assignedTo?.toString() !== req.user._id.toString() &&
      req.user.model === 'Customer' &&
      lead.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (status) {
      lead.status = status;
      if (status === 'converted') {
        lead.conversionDate = new Date();
        // Optional: create Customer from lead data here
      }
    }
    if (assignedTo) lead.assignedTo = assignedTo;
    if (notes) lead.notes = notes;

    await lead.save();
    await lead.populate(['createdBy', 'assignedTo', 'area']);

    res.json({ success: true, lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ADD FOLLOW-UP
export const addFollowUp = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { note, outcome, nextFollowUpDate } = req.body;

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    // Only Admin/Team can add follow-ups
    if (!['Admin', 'Team'].includes(req.user.model)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Optional: Only assigned team or admin
    if (
      req.user.model === 'Team' &&
      lead.assignedTo?.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Lead not assigned to you' });
    }

    lead.followUps.push({
      followedBy: req.user._id,
      followedByModel: req.user.model,
      note,
      outcome,
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
    });

    // Auto status update
    if (lead.status === 'new') lead.status = 'contacted';
    if (lead.followUps.length > 1) lead.status = 'follow_up';

    await lead.save();

    await lead.populate([
      { path: 'followUps.followedBy', select: 'firstName lastName' },
      { path: 'createdBy', select: 'firstName lastName' },
      { path: 'assignedTo', select: 'firstName lastName' },
      { path: 'area', select: 'name' },
    ]);

    res.json({ success: true, lead });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// CONVERT LEAD TO CUSTOMER
export const convertLead = async (req, res) => {
  try {
    const { leadId } = req.params;
    const { customerId } = req.body; // Customer created from lead

    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    if (lead.status === 'converted') {
      return res.status(400).json({ message: 'Lead already converted' });
    }

    // Only Admin/Team
    if (!['Admin', 'Team'].includes(req.user.model)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    lead.status = 'converted';
    lead.convertedToCustomer = customerId;
    lead.conversionDate = new Date();

    await lead.save();

    // Populate for response
    await lead.populate([
      'convertedToCustomer',
      'createdBy',
      'assignedTo',
      'followUps.followedBy',
    ]);

    res.json({ success: true, message: 'Lead converted successfully', lead });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// FINAL REWARD TRIGGER: When Connection is Activated
// Call this from your Connection creation endpoint
export const activateConnectionAndReward = async (customerId) => {
  const customer = await Customer.findById(customerId).populate('connections');
  if (!customer || customer.connections.length === 0) return;

  // Find leads that converted to this customer
  const lead = await Lead.findOne({
    convertedToCustomer: customerId,
    status: 'converted',
  });

  if (!lead || lead.connectionCreatedAt) return; // Already rewarded

  // Mark connection active → trigger reward
  lead.connectionCreatedAt = new Date();
  await lead.save();

  // === REWARD LOGIC ===
  if (lead.createdByModel === 'Customer') {
    const referrer = await Customer.findById(lead.createdBy);

    if (referrer) {
      // Example: Give ₹500 wallet credit or free month
      referrer.walletBalance = (referrer.walletBalance || 0) + 500;
      // Or create a ReferralReward document
      await referrer.save();

      // Send notification to referrer
      // sendNotification(referrer.fcmTokens, "Referral Bonus!", "Your friend is now connected! You've earned ₹500!");
    }
  }

  // Also reward the Team member who followed up
  if (lead.assignedTo) {
    const team = await Team.findById(lead.assignedTo);
    if (team) {
      team.conversions = (team.conversions || 0) + 1;
      await team.save();
    }
  }
};

// GET /api/referrals/my - Customer's referral dashboard data
export const getMyReferrals = async (req, res) => {
  try {
    const customerId = req.user._id;

    // 1. Find all leads created by this customer
    const referredLeads = await Lead.find({
      createdBy: customerId,
      createdByModel: 'Customer',
    })
      .populate('area', 'name')
      .sort({ createdAt: -1 });

    // 2. Count successful ones (converted + connection active)
    const successfulReferrals = referredLeads.filter(
      (lead) => lead.status === 'converted' && lead.connectionCreatedAt
    ).length;

    // 3. Calculate points (e.g., 500 base + milestone bonuses)
    let totalPoints = successfulReferrals * 500;

    const milestones = [5, 10, 25];
    milestones.forEach((milestone) => {
      if (successfulReferrals >= milestone) {
        totalPoints += milestone === 5 ? 250 : milestone === 10 ? 500 : 1000;
      }
    });

    // 4. Fetch customer's current available points (from Customer model or separate Wallet)
    const customer = await Customer.findById(customerId);
    const availablePoints = customer.walletBalance || totalPoints; // or use a separate points field

    // 5. Build points history (you can store transactions or derive)
    const pointsHistory = [
      // Example derived entries
      ...referredLeads
        .filter((l) => l.connectionCreatedAt)
        .map((l) => ({
          description: `Referral: ${l.name} connected`,
          points: 500,
          type: 'Earned',
          date: l.connectionCreatedAt,
        })),
      // Add redemptions from a Redemption model later
    ];

    res.json({
      success: true,
      stats: {
        referralCode:
          customer.referralCode ||
          `FIBER-${customer._id.toString().slice(-6).toUpperCase()}`,
        successfulReferrals,
        availablePoints,
        lifetimePoints: totalPoints,
      },
      referrals: referredLeads.map((lead) => ({
        _id: lead._id,
        name: lead.name,
        phone: lead.phone,
        area: lead.area?.name,
        date: lead.createdAt,
        status: lead.connectionCreatedAt
          ? 'Rewarded'
          : lead.status === 'converted'
            ? 'Registered'
            : 'Pending',
      })),
      pointsHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/referrals/redeem
export const redeemPoints = async (req, res) => {
  try {
    const { points, redemptionType, connectionId } = req.body;
    const customerId = req.user._id;

    const customer = await Customer.findById(customerId);
    if (!customer || customer.walletBalance < points) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    // Deduct points
    customer.walletBalance -= points;
    await customer.save();

    // Create redemption record (optional model)
    // Or apply directly: bill credit, speed boost for next month, etc.

    res.json({
      success: true,
      message: 'Points redeemed successfully',
      pointsRedeemed: points,
      newBalance: customer.walletBalance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
