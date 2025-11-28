import Referral from '../models/Referral.model.js';

// 1. Create Referral
export const createReferral = async (req, res) => {
  try {
    const { referrer, referredCustomer } = req.body;
    if (!referrer)
      return res.status(400).json({ message: 'Referrer required' });

    const referral = await Referral.create({ referrer, referredCustomer });
    res.status(201).json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Error creating referral', error });
  }
};

// 2. List Referrals
export const listReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find()
      .populate('referrer referredCustomer')
      .exec();
    res.status(200).json(referrals);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching referrals', error });
  }
};

// 3. Mark Referral as Converted (after first purchase)
export const markReferralConverted = async (customerId) => {
  try {
    const referral = await Referral.findOne({
      referredCustomer: customerId,
      status: 'pending',
    });
    if (referral) {
      referral.status = 'converted';
      await referral.save();
      // Trigger reward distribution if needed
      return referral;
    }
  } catch (error) {
    console.error('Referral conversion error:', error);
  }
};

// 4. Reward Referral
export const rewardReferral = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, rewardType } = req.body;

    const referral = await Referral.findById(id);
    if (!referral)
      return res.status(404).json({ message: 'Referral not found' });
    if (referral.status !== 'converted')
      return res.status(400).json({ message: 'Referral not converted yet' });

    referral.status = 'rewarded';
    referral.rewardDetails = {
      amount,
      rewardType,
      rewardedAt: new Date(),
    };

    await referral.save();
    res.status(200).json(referral);
  } catch (error) {
    res.status(500).json({ message: 'Error rewarding referral', error });
  }
};
