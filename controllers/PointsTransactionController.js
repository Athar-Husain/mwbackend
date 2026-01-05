import AdminModel from '../models/Admin.model';
import CustomerModel from '../models/Customer.model';
import TeamModel from '../models/Team.model';
import { notifyUsers } from '../utils/notifyUsers';

// controllers/pointsController.js
export const redeemPoints = asyncHandler(async (req, res, next) => {
  const { points, redemptionType, connectionId } = req.body;
  const customerId = req.user._id;

  // 1. Fetch Customer
  const customer = await CustomerModel.findById(customerId);

  // 2. Validation
  if (customer.pointsBalance < points) {
    return next(new ApiError('Insufficient points balance.', 400));
  }

  if (points < 100) {
    return next(
      new ApiError('Minimum 100 points required for redemption.', 400)
    );
  }

  // 3. Update Customer Balance
  customer.pointsBalance -= points;
  await customer.save();

  // 4. Create Transaction Record (for the ledger)
  const transaction = await PointsTransaction.create({
    customer: customerId,
    type: 'Redeemed',
    points: points, // Note: You can store as positive but UI shows as minus
    description: `Redemption: ${redemptionType.replace('_', ' ').toUpperCase()}`,
    redemptionDetails: {
      item: redemptionType,
      connectionId: connectionId,
    },
    balanceAfter: customer.pointsBalance,
  });

  // 5. Optional: Create a "Service Request" for Admin
  // This notifies your team to manually apply the bill credit or speed boost
  await Notification.create({
    user: req.user._id,
    title: 'Redemption Request',
    message: `Customer requested ${redemptionType} using ${points} points.`,
  });

  //   const customer = await Customer.findById(ticket.customer);
  const team = await TeamModel.findById(ticket.assignedTo);
  const admins = await AdminModel.find({});
  const recipients = [customer];

  await notifyUsers({
    recipients,
    title: 'Redemption Request',
    message: `Customer requested ${redemptionType} using ${points} points.`,
    // payload: { ticketId: ticket._id, attachmentId: newAttachment._id },
  });

  res.status(200).json({
    status: 'success',
    data: {
      newBalance: customer.pointsBalance,
      transaction,
    },
  });
});
