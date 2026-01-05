import Lead from '../models/Lead.model.js';

// 1. Create Lead
export const createLead = async (req, res) => {
  try {
    const { leadOwner, leadOwnerModel, leadCustomer } = req.body;

    if (!leadOwner || !leadOwnerModel) {
      return res.status(400).json({ message: 'Lead owner and model required' });
    }

    const lead = await Lead.create({ leadOwner, leadOwnerModel, leadCustomer });
    res.status(201).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead', error });
  }
};

// 2. List Leads
export const listLeads = async (req, res) => {
  try {
    const leads = await Lead.find().populate('leadOwner leadCustomer').exec();
    res.status(200).json(leads);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leads', error });
  }
};

// 3. Mark Lead as Converted (after first purchase)
export const markLeadConverted = async (customerId) => {
  try {
    const lead = await Lead.findOne({
      leadCustomer: customerId,
      status: 'pending',
    });
    if (lead) {
      lead.status = 'converted';
      await lead.save();
      // Trigger reward distribution if needed
      return lead;
    }
  } catch (error) {
    console.error('Lead conversion error:', error);
  }
};

// 4. Reward Lead
export const rewardLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, rewardType } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    if (lead.status !== 'converted')
      return res.status(400).json({ message: 'Lead not converted yet' });

    lead.status = 'rewarded';
    lead.rewardDetails = {
      amount,
      rewardType,
      rewardedAt: new Date(),
    };

    await lead.save();
    res.status(200).json(lead);
  } catch (error) {
    res.status(500).json({ message: 'Error rewarding lead', error });
  }
};
