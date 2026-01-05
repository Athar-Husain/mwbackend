import Lead from '../models/Lead.model.js';
import Customer from '../models/Customer.model.js'; // assuming you have this
import Connection from '../models/Connection.model.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from 'express-async-handler';
import csv from 'csv-parser';
import { Readable } from 'stream';

export const getAllLeadsold = asyncHandler(async (req, res) => {
  console.log('Getl ALl Leads hit');
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  let query = {};

  if (req.query.status && req.query.status !== 'all')
    query.status = req.query.status;
  if (req.query.serviceArea) query.serviceArea = req.query.serviceArea;
  if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
  if (req.query.phone) query.phone = { $regex: req.query.phone, $options: 'i' };

  const leads = await Lead.find(query)
    // .populate('serviceArea', 'name')
    // .populate('assignedTo', 'name phone')
    // .populate('createdBy', 'name phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lead.countDocuments(query);

  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: { leads },
  });
});

export const getAllLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  let query = {};

  // 1. Handle Status: Ensure 'all' doesn't filter out data
  if (req.query.status && req.query.status !== 'all') {
    query.status = req.query.status;
  }

  // 2. Handle Service Area: Case-insensitive search since it's now a String
  if (req.query.serviceArea) {
    query.serviceArea = { $regex: req.query.serviceArea, $options: 'i' };
  }

  // 3. Handle Phone/Search
  if (req.query.phone) {
    query.phone = { $regex: req.query.phone, $options: 'i' };
  }

  // 4. Handle Assignment
  if (req.query.assignedTo) {
    query.assignedTo = req.query.assignedTo;
  }

  const leads = await Lead.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lead.countDocuments(query);

  console.log(`Query: ${JSON.stringify(query)} | Found: ${leads.length}`);

  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: { leads },
  });
});

export const getLeadById = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;

  // We populate createdBy and assignedTo to show names in the UI
  // Note: serviceArea is now a String, so we don't populate it
  const lead = await Lead.findById(leadId)
    .populate({
      path: 'createdBy',
      select: 'name phone email',
    })
    .populate({
      path: 'assignedTo',
      select: 'name phone',
    })
    .populate({
      // path: 'followUps.followedBy',
      path: 'followUps.followedBy',
      select: 'firstName email userType',
    });

  if (!lead) {
    return next(new ApiError('Lead not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const getAllLeads1 = asyncHandler(async (req, res) => {
  console.log('Fetching ALL leads without filters...');

  // Simple query: empty object {} gets everything
  const leads = await Lead.find({}).sort({ createdAt: -1 }).limit(100); // Limit to 100 for safety

  const total = await Lead.countDocuments({});

  // LOG THIS: This is the most important part for debugging
  console.log('Total Leads in DB:', total);
  console.log('First Lead structure:', leads[0] || 'No leads found');

  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    data: { leads },
  });
});

export const createReferral = asyncHandler(async (req, res) => {
  const { name, phone, alternatePhone, serviceArea, address, notes, email } =
    req.body;

  // Prevent self-referral or duplicate active lead
  const existing = await Lead.findOne({
    phone,
    createdBy: req.user._id,
    status: { $nin: ['converted', 'lost'] },
  });

  if (existing) {
    return next(new ApiError('You already referred this number.', 400));
  }

  const lead = await Lead.create({
    name,
    phone,
    alternatePhone,
    email,
    serviceArea,
    address,
    notes,
    createdBy: req.user._id,
    createdByModel: 'Customer',
    reward: {
      pointsAwarded: 0,
      incentivePaid: false,
    },
  });

  res.status(201).json({
    status: 'success',
    data: { lead },
  });
});

export const createReferral1 = asyncHandler(async (req, res, next) => {
  const { name, phone, alternatePhone, serviceArea, address, notes, email } =
    req.body;

  // Normalize phone (remove +91, spaces, etc.) if needed — recommended
  const normalizedPhone = phone?.replace(/[^0-9]/g, '').slice(-10); // last 10 digits

  if (!normalizedPhone || normalizedPhone.length !== 10) {
    return next(new ApiError('Invalid phone number.', 400));
  }

  // 1. Check if this customer already referred this phone (active lead)
  const existingBySameUser = await Lead.findOne({
    phone: normalizedPhone,
    createdBy: req.user._id,
    status: { $nin: ['Rewarded', 'Lost'] }, // or whatever your closed statuses are
  });

  if (existingBySameUser) {
    return next(
      new ApiError('You have already referred this phone number.', 400)
    );
  }

  // 2. Check if ANYONE (other customers/team) already created a lead for this phone (active)
  const existingLeadByAnyone = await Lead.findOne({
    phone: normalizedPhone,
    status: { $nin: ['Rewarded', 'Lost'] },
  });

  if (existingLeadByAnyone) {
    return next(
      new ApiError(
        'This phone number has already been referred by someone else.',
        400
      )
    );
  }

  // 3. MOST IMPORTANT: Check if phone already belongs to an existing Customer
  const existingCustomer = await Customer.findOne({
    phone: normalizedPhone,
  });

  if (existingCustomer) {
    return next(
      new ApiError(
        'This phone number is already registered as a customer.',
        400
      )
    );
  }

  // 4. Check if phone is already used in any Connection (active or past)
  const existingConnection = await Connection.findOne({
    contactNo: normalizedPhone,
  });

  if (existingConnection) {
    return next(
      new ApiError('This phone number is already linked to a connection.', 400)
    );
  }

  // Optional: Check alternatePhone too (if provided)
  if (alternatePhone) {
    const normAlt = alternatePhone.replace(/[^0-9]/g, '').slice(-10);
    const altChecks = await Promise.all([
      Lead.findOne({ phone: normAlt, status: { $nin: ['Rewarded', 'Lost'] } }),
      Customer.findOne({ phone: normAlt }),
      Connection.findOne({ contactNo: normAlt }),
    ]);

    if (altChecks.some((doc) => doc)) {
      return next(
        new ApiError('Alternate phone number is already in use.', 400)
      );
    }
  }

  // All clear → create the lead
  const lead = await Lead.create({
    name,
    phone: normalizedPhone,
    alternatePhone: alternatePhone
      ? alternatePhone.replace(/[^0-9]/g, '').slice(-10)
      : undefined,
    email,
    serviceArea,
    address,
    notes,
    createdBy: req.user._id,
    createdByModel: 'Customer',
    reward: {
      pointsAwarded: 0,
      incentivePaid: false,
    },
  });

  res.status(201).json({
    status: 'success',
    data: { lead },
  });
});

export const createReferralNew2 = asyncHandler(async (req, res, next) => {
  const { name, phone, alternatePhone, serviceArea, address, notes, email } =
    req.body;

  /* -----------------------------
     1. Normalize & Validate Phone
  ------------------------------*/
  const normalizePhone = (num) => num?.replace(/[^0-9]/g, '').slice(-10);

  const primaryPhone = normalizePhone(phone);
  const altPhone = alternatePhone ? normalizePhone(alternatePhone) : null;

  if (!primaryPhone || primaryPhone.length !== 10) {
    return next(new ApiError('Invalid primary phone number.', 400));
  }

  if (altPhone && altPhone.length !== 10) {
    return next(new ApiError('Invalid alternate phone number.', 400));
  }

  if (altPhone && altPhone === primaryPhone) {
    return next(
      new ApiError('Alternate phone must be different from primary phone.', 400)
    );
  }

  /* -----------------------------
     2. Prevent Self-Referral
     (customer referring own number)
  ------------------------------*/
  if (req.user.phone === primaryPhone) {
    return next(new ApiError('You cannot refer your own phone number.', 400));
  }

  /* -----------------------------
     3. Prevent Duplicate Referral
     by same customer (active)
  ------------------------------*/
  const existingBySameUser = await Lead.findOne({
    phone: primaryPhone,
    createdBy: req.user._id,
    status: { $nin: ['Rewarded', 'Lost', 'Converted'] },
  });

  if (existingBySameUser) {
    return next(
      new ApiError('You have already referred this phone number.', 400)
    );
  }

  /* -----------------------------
     4. Prevent Duplicate Referral
     by anyone (global active lead)
  ------------------------------*/
  const existingLead = await Lead.findOne({
    phone: primaryPhone,
    status: { $nin: ['Rewarded', 'Lost', 'Converted'] },
  });

  if (existingLead) {
    return next(
      new ApiError(
        'This phone number has already been referred by someone else.',
        400
      )
    );
  }

  /* -----------------------------
     5. Prevent Referral of
     Existing Customer
  ------------------------------*/
  const existingCustomer = await Customer.findOne({
    phone: primaryPhone,
  });

  if (existingCustomer) {
    return next(
      new ApiError(
        'This phone number already belongs to an existing customer.',
        400
      )
    );
  }

  /* -----------------------------
     6. Prevent Referral of
     Existing / Past Connections
  ------------------------------*/
  const existingConnection = await Connection.findOne({
    contactNo: primaryPhone,
  });

  if (existingConnection) {
    return next(
      new ApiError('This phone number is already linked to a connection.', 400)
    );
  }

  /* -----------------------------
     7. Validate Alternate Phone
  ------------------------------*/
  if (altPhone) {
    const [leadAlt, customerAlt, connectionAlt] = await Promise.all([
      Lead.findOne({
        phone: altPhone,
        status: { $nin: ['Rewarded', 'Lost', 'Converted'] },
      }),
      Customer.findOne({ phone: altPhone }),
      Connection.findOne({ contactNo: altPhone }),
    ]);

    if (leadAlt || customerAlt || connectionAlt) {
      return next(
        new ApiError(
          'Alternate phone number is already associated with another record.',
          400
        )
      );
    }
  }

  /* -----------------------------
     8. Create Referral Lead
  ------------------------------*/
  const lead = await Lead.create({
    name,
    phone: primaryPhone,
    alternatePhone: altPhone || undefined,
    email,
    serviceArea,
    address,
    notes,
    createdBy: req.user._id,
    createdByModel: 'Customer',
    status: 'New',
    reward: {
      pointsAwarded: 0,
      incentivePaid: false,
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Referral created successfully.',
    data: { lead },
  });
});

export const createReferralNew = asyncHandler(async (req, res, next) => {
  const { name, phone, alternatePhone, serviceArea, address, notes, email } =
    req.body;

  /* -----------------------------
     1. Normalize Phones
  ------------------------------*/
  const normalizePhone = (num) => num?.replace(/\D/g, '').slice(-10);

  const primaryPhone = normalizePhone(phone);
  const altPhone = alternatePhone ? normalizePhone(alternatePhone) : null;

  if (!primaryPhone || primaryPhone.length !== 10) {
    return next(new ApiError('Invalid primary phone number.', 400));
  }

  if (altPhone && altPhone.length !== 10) {
    return next(new ApiError('Invalid alternate phone number.', 400));
  }

  if (altPhone && altPhone === primaryPhone) {
    return next(
      new ApiError('Alternate phone must be different from primary phone.', 400)
    );
  }

  /* -----------------------------
     2. Prevent Self Referral
  ------------------------------*/
  if (req.user.phone === primaryPhone) {
    return next(new ApiError('You cannot refer your own phone number.', 400));
  }

  /* -----------------------------
     3. Active Statuses
     (single source of truth)
  ------------------------------*/
  const ACTIVE_STATUSES = [
    'new',
    'contacted',
    'follow_up',
    'site_survey',
    'interested',
    'on_hold',
  ];

  /* -----------------------------
     4. Duplicate by Same Customer
  ------------------------------*/
  const existingBySameUser = await Lead.findOne({
    phone: primaryPhone,
    createdBy: req.user._id,
    status: { $in: ACTIVE_STATUSES },
  });

  if (existingBySameUser) {
    return next(
      new ApiError('You have already referred this phone number.', 400)
    );
  }

  /* -----------------------------
     5. Duplicate by Anyone
  ------------------------------*/
  const existingLead = await Lead.findOne({
    phone: primaryPhone,
    status: { $in: ACTIVE_STATUSES },
  });

  if (existingLead) {
    return next(
      new ApiError(
        'This phone number has already been referred by someone else.',
        400
      )
    );
  }

  /* -----------------------------
     6. Existing Customer
  ------------------------------*/
  const existingCustomer = await Customer.findOne({
    phone: primaryPhone,
  });

  if (existingCustomer) {
    return next(
      new ApiError(
        'This phone number already belongs to an existing customer.',
        400
      )
    );
  }

  /* -----------------------------
     7. Existing Connection
  ------------------------------*/
  const existingConnection = await Connection.findOne({
    contactNo: primaryPhone,
  });

  if (existingConnection) {
    return next(
      new ApiError('This phone number is already linked to a connection.', 400)
    );
  }

  /* -----------------------------
     8. Validate Alternate Phone
  ------------------------------*/
  if (altPhone) {
    const [leadAlt, customerAlt, connectionAlt] = await Promise.all([
      Lead.findOne({ phone: altPhone, status: { $in: ACTIVE_STATUSES } }),
      Customer.findOne({ phone: altPhone }),
      Connection.findOne({ contactNo: altPhone }),
    ]);

    if (leadAlt || customerAlt || connectionAlt) {
      return next(
        new ApiError(
          'Alternate phone number is already associated with another record.',
          400
        )
      );
    }
  }

  /* -----------------------------
     9. Create Lead
  ------------------------------*/
  const lead = await Lead.create({
    name,
    phone: primaryPhone,
    alternatePhone: altPhone || undefined,
    email,
    serviceArea,
    address,
    notes,
    createdBy: req.user._id,
    createdByModel: req.user.userType,
    status: 'new', // ✅ schema-aligned
    reward: {
      pointsAwarded: 0,
      incentivePaid: false,
    },
  });

  res.status(201).json({
    status: 'success',
    message: 'Referral created successfully.',
    data: { lead },
  });
});

export const assignLeadToTeam = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { teamMemberId } = req.body;

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      assignedTo: teamMemberId,
      status: 'contacted',
      updatedBy: req.user._id,
      updatedByModel: 'Admin',
    },
    { new: true }
  );

  // if (!lead) return next(new ApiError('Lead not found', 404));
  if (!lead) return next(new ApiError('Lead not found', 404));

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const convertLead = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { connectionId, customerId } = req.body;

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      status: 'converted',
      convertedToConnection: connectionId || null,
      convertedToCustomer: customerId || null,
      conversionDate: new Date(),
      connectionCreatedAt: new Date(),
      updatedBy: req.user._id,
      updatedByModel: 'Admin',
    },
    { new: true }
  );

  if (!lead) return next(new ApiError('Lead not found', 404));

  // TODO: Trigger reward logic (points/incentive payout) here

  res.status(200).json({
    status: 'success',
    message: 'Lead converted successfully',
    data: { lead },
  });
});

export const markRewardPaid = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { pointsAwarded, incentiveAmount } = req.body;

  const update = {
    'reward.incentivePaid': true,
    updatedBy: req.user._id,
    updatedByModel: 'Admin',
  };

  if (pointsAwarded) update['reward.pointsAwarded'] = pointsAwarded;
  if (incentiveAmount) update['reward.incentiveAmount'] = incentiveAmount;

  const lead = await Lead.findByIdAndUpdate(leadId, update, { new: true });

  if (!lead) return next(new ApiError('Lead not found', 404));

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const getMyAssignedLeads = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 15;
  const skip = (page - 1) * limit;

  const filter = {
    assignedTo: req.user._id,
  };

  if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }

  const leads = await Lead.find(filter)
    .populate('serviceArea', 'name')
    .populate('createdBy', 'name phone')
    .sort({ 'followUps.createdAt': -1 })
    .skip(skip)
    .limit(limit);

  const total = await Lead.countDocuments(filter);

  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    data: { leads },
  });
});

export const addFollowUp1 = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { note, outcome, nextFollowUpDate } = req.body;

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, assignedTo: req.user._id },
    {
      $push: {
        followUps: {
          followedBy: req.user._id,
          followedByModel: 'Team',
          note,
          outcome,
          nextFollowUpDate: nextFollowUpDate || undefined,
        },
      },
      updatedBy: req.user._id,
      updatedByModel: 'Team',
    },
    { new: true }
  ).populate('serviceArea', 'name');

  if (!lead) {
    return next(new ApiError('Lead not found or not assigned to you.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const addFollowUp2 = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { note, outcome, nextFollowUpDate } = req.body;

  // 1. Determine permissions:
  // If Admin, they can find any lead by ID.
  // If Team, they must be the assignedTo user.
  let query = { _id: leadId };

  if (req.user.userType !== 'Admin') {
    query.assignedTo = req.user._id;
  }

  // 2. Prepare the update data
  const followUpEntry = {
    followedBy: req.user._id,
    followedByModel: req.user.userType, // Automatically 'Admin' or 'Team'
    note,
    outcome,
    nextFollowUpDate: nextFollowUpDate || undefined,
  };

  const lead = await Lead.findOneAndUpdate(
    query,
    {
      $push: { followUps: followUpEntry },
      updatedBy: req.user._id,
      updatedByModel: req.user.userType,
    },
    { new: true, runValidators: true }
  );

  if (!lead) {
    const errorMsg =
      req.user.userType === 'Admin'
        ? 'Lead not found.'
        : 'Lead not found or not assigned to you.';
    return next(new ApiError(errorMsg, 404));
  }

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const addFollowUp = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { note, outcome, nextFollowUpDate, status } = req.body; // Added status

  let query = { _id: leadId };
  if (req.user.userType !== 'Admin') {
    query.assignedTo = req.user._id;
  }

  const followUpEntry = {
    followedBy: req.user._id,
    followedByModel: req.user.userType,
    note,
    outcome,
    nextFollowUpDate: nextFollowUpDate || undefined,
  };

  const updatePayload = {
    $push: { followUps: followUpEntry },
    updatedBy: req.user._id,
    updatedByModel: req.user.userType,
  };

  // If a status is explicitly provided, update it
  if (status) {
    updatePayload.status = status;
  }

  const lead = await Lead.findOneAndUpdate(query, updatePayload, {
    new: true,
    runValidators: true,
  }).populate('followUps.followedBy', 'name');

  if (!lead) return next(new ApiError('Lead not found.', 404));

  res.status(200).json({ status: 'success', data: { lead } });
});

export const updateLeadStatus = asyncHandler(async (req, res, next) => {
  const { leadId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    'contacted',
    'follow_up',
    'site_survey',
    'interested',
    'on_hold',
    'lost',
    'converted',
  ];

  if (!allowedStatuses.includes(status)) {
    return next(new ApiError('Invalid status transition.', 400));
  }

  const updateData = {
    status,
    updatedBy: req.user._id,
    updatedByModel: 'Team',
  };

  const lead = await Lead.findOneAndUpdate(
    { _id: leadId, assignedTo: req.user._id },
    updateData,
    { new: true }
  );

  if (!lead) {
    return next(new ApiError('Lead not found or not assigned to you.', 404));
  }

  res.status(200).json({
    status: 'success',
    data: { lead },
  });
});

export const getMyReferrals = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const leads = await Lead.find({
    createdBy: req.user._id,
    // createdByModel: 'Customer',
  })
    .select(
      'name phone status reward.pointsAwarded reward.incentivePaid createdAt'
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('serviceArea', 'name');

  const total = await Lead.countDocuments({
    createdBy: req.user._id,
    // createdByModel: 'Customer',
  });

  res.status(200).json({
    status: 'success',
    results: leads.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    // data: { leads },
    leads,
  });
});

// export const getMyTeamReferrals = asyncHandler(async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 10;
//   const skip = (page - 1) * limit;

//   const leads = await Lead.find({
//     createdBy: req.user._id,
//     // createdByModel: 'Customer',
//   })
//     .select(
//       'name phone status reward.pointsAwarded reward.incentivePaid createdAt'
//     )
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit)
//     .populate('serviceArea', 'name');

//   const total = await Lead.countDocuments({
//     createdBy: req.user._id,
//     // createdByModel: 'Customer',
//   });

//   res.status(200).json({
//     status: 'success',
//     results: leads.length,
//     total,
//     page,
//     pages: Math.ceil(total / limit),
//     // data: { leads },
//     leads,
//   });
// });

export const createLeadManuallyNew = async (req, res) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      createdBy: req.admin?._id || req.team?._id,
      createdByModel: req.admin ? 'Admin' : 'Team',
    });
    res.status(201).json({ status: 'success', data: { lead } });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const createLeadManually = asyncHandler(async (req, res) => {
  const { name, phone, serviceArea, notes, assignedTo } = req.body;

  const lead = await Lead.create({
    name,
    phone,
    serviceArea,
    notes,
    assignedTo: assignedTo || null,
    createdBy: req.user._id,
    createdByModel: 'Admin',
    status: assignedTo ? 'contacted' : 'new',
  });

  res.status(201).json({
    status: 'success',
    data: { lead },
  });
});

export const bulkUploadLeadswithexpressfileupload = async (req, res) => {
  // Multer uses req.file, not req.files
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  const errors = [];
  // Multer puts the buffer in req.file.buffer
  const stream = Readable.from(req.file.buffer);

  stream
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      // ... the rest of your logic remains the same
    });
};

// export const bulkUploadLeads = async (req, res) => {
//   console.log('check bulk upload');

//   console.log('req.files ', req.file);

//   // if (!req.files || !req.files.file) {
//   //   return res.status(400).json({ message: 'No file uploaded' });
//   // }

//   if (!req.file) {
//     return res.status(400).json({ message: 'No file uploaded' });
//   }

//   const results = [];
//   const errors = [];
//   // const stream = Readable.from(req.files.file.data);
//   const stream = Readable.from(req.file.buffer);

//   stream
//     .pipe(csv())
//     .on('data', (data) => results.push(data))
//     .on('end', async () => {
//       const leadsToSave = [];
//       for (let [index, row] of results.entries()) {
//         if (!row.name || !row.phone) {
//           errors.push(`Row ${index + 1}: Name and Phone are required`);
//           continue;
//         }
//         leadsToSave.push({
//           name: row.name.trim(),
//           phone: row.phone.trim(),
//           email: row.email?.trim(),
//           serviceArea: row.area?.trim() || 'General', // Now a string
//           address: row.address?.trim(),
//           notes: row.notes?.trim(),
//           createdBy: req.admin?._id,
//           createdByModel: 'Admin',
//         });
//       }

//       if (leadsToSave.length > 0) {
//         await Lead.insertMany(leadsToSave, { ordered: false });
//       }

//       res.status(200).json({
//         status: 'success',
//         message: `${leadsToSave.length} leads imported.`,
//         errors: errors.length > 0 ? errors : null,
//       });
//     });
// };

export const bulkUploadLeads2 = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];
    const stream = Readable.from(req.file.buffer);

    // Create a promise to wait for the stream to finish
    const processCSV = () => {
      return new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('error', (err) => reject(err))
          .on('end', resolve);
      });
    };

    // Wait for parsing to complete
    await processCSV();

    const leadsToSave = [];
    const errors = [];

    for (let [index, row] of results.entries()) {
      // Check column names exactly as they appear in your CSV log
      // Based on your log: 'name', 'phone', 'area', 'email', 'address', 'notes'
      if (!row.name || !row.phone) {
        errors.push(`Row ${index + 1}: Name and Phone are required`);
        continue;
      }

      leadsToSave.push({
        name: row.name.trim(),
        phone: row.phone.trim(),
        email: row.email?.trim(),
        serviceArea: row.area?.trim() || 'General',
        address: row.address?.trim(),
        notes: row.notes?.trim(),
        createdBy: req.admin?._id,
        createdByModel: 'Admin',
        status: 'new', // Explicitly set status
      });
    }

    if (leadsToSave.length > 0) {
      // ordered: false allows continuing even if one document fails (e.g. duplicate phone)
      await Lead.insertMany(leadsToSave, { ordered: false });
    }

    res.status(200).json({
      status: 'success',
      message: `${leadsToSave.length} leads imported successfully.`,
      errors: errors.length > 0 ? errors : null,
    });
  } catch (error) {
    console.error('Bulk Upload Error:', error);
    res.status(500).json({
      message: 'Error processing bulk upload',
      error: error.message,
    });
  }
};

export const bulkUploadLeads = async (req, res) => {
  try {
    // console.log('--- Bulk Upload Started ---');
    // console.log('req.user', req.user);
    if (!req.file) return res.status(400).json({ message: 'No file found' });

    const results = [];
    const stream = Readable.from(req.file.buffer);

    // 1. Wrap parsing in a Promise so we AWAIT the result
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on('data', (data) => {
          console.log('Row Parsed:', data); // Log each row to see if keys match
          results.push(data);
        })
        .on('error', (err) => reject(err))
        .on('end', resolve);
    });

    // console.log(`Total Rows Parsed: ${results.length}`);

    if (results.length === 0) {
      return res
        .status(400)
        .json({ message: 'CSV file is empty or headers are wrong' });
    }

    // 2. Map the data to your schema
    const leadsToSave = results.map((row, index) => {
      // Use bracket notation to handle hidden spaces in CSV headers
      const name = row.name || row[' name'] || row.Name;
      const phone = row.phone || row[' phone'] || row.Phone;
      const area = row.area || row[' area'] || row.Area;

      return {
        name: name?.trim(),
        phone: phone?.trim(),
        serviceArea: area?.trim() || 'General',
        email: (row.email || '').trim(),
        address: (row.address || '').trim(),
        notes: (row.notes || '').trim(),
        status: 'new',
        createdBy: req.user?._id,
        createdByModel: req.user.userType,
      };
    });

    // 3. Filter out invalid rows (missing name/phone)
    const validLeads = leadsToSave.filter((l) => l.name && l.phone);
    console.log(`Valid Leads to Save: ${validLeads.length}`);

    if (validLeads.length > 0) {
      const saved = await Lead.insertMany(validLeads, { ordered: false });
      console.log('Database saved count:', saved.length);
    }

    res.status(200).json({
      status: 'success',
      message: `${validLeads.length} leads imported successfully`,
      count: validLeads.length,
    });
  } catch (error) {
    console.error('CRITICAL UPLOAD ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// Example logic when a lead is converted
export const rewardCustomer = async (leadId) => {
  const lead = await Lead.findById(leadId);
  if (lead.status === 'converted' && !lead.reward.pointsTransaction) {
    const pointsToGive = 100; // Define your business logic here

    // 1. Update Customer Totals
    const customer = await Customer.findByIdAndUpdate(
      lead.createdBy,
      {
        $inc: {
          pointsBalance: pointsToGive,
          lifetimePoints: pointsToGive,
          totalSuccessfulReferrals: 1,
        },
      },
      { new: true }
    );

    // 2. Create the Transaction Record
    const transaction = await PointsTransaction.create({
      customer: customer._id,
      type: 'Earned',
      points: pointsToGive,
      description: `Referral: ${lead.name}`,
      lead: lead._id,
      balanceAfter: customer.pointsBalance,
    });

    // 3. Link transaction back to Lead
    lead.reward.pointsAwarded = pointsToGive;
    lead.reward.pointsTransaction = transaction._id;
    await lead.save();
  }
};
