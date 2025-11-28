import Payment from '../models/Payment.model.js'; // adjust the path as necessary
import Razorpay from 'razorpay'; // assuming you use this SDK
import Customer from '../models/Customer.model.js'; // assuming you have this model
import Connection from '../models/Connection.model.js'; // assuming you have this model

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new payment
export const createPayment = async (req, res) => {
  try {
    const {
      user,
      connectionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      method,
      refund,
    } = req.body;

    // Validation: Ensure required fields are provided
    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !amount ||
      !user ||
      !connectionId
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const payment = new Payment({
      user,
      connectionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      method,
      refund,
    });

    await payment.save();
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error creating payment', error: error.message });
  }
};

export const createPaymentnew = async (req, res) => {
  try {
    const {
      user,
      connectionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      method,
      refund,
    } = req.body;

    // Validation: Ensure required fields are provided
    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !amount ||
      !user ||
      !connectionId
    ) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure the connection is active
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    if (!connection.isActive) {
      return res.status(400).json({ message: 'This connection is inactive' });
    }

    const payment = new Payment({
      user,
      connectionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      method,
      refund,
    });

    await payment.save();
    res.status(201).json({ message: 'Payment created successfully', payment });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error creating payment', error: error.message });
  }
};

// Get all payments
export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user')
      .populate('connectionId');
    res.status(200).json(payments);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error fetching payments', error: error.message });
  }
};

// Get payment by ID
export const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user')
      .populate('connectionId');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error fetching payment', error: error.message });
  }
};

// Update payment status
export const updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['created', 'captured', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json(payment);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error updating payment status', error: error.message });
  }
};

// Refund a payment (if applicable)
export const refundPayment = async (req, res) => {
  const session = await Payment.startSession(); // Using MongoDB session for transaction
  session.startTransaction();

  try {
    const { refundId, amount } = req.body;

    const payment = await Payment.findById(req.params.id).session(session);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Verify payment status and conditions for refund
    if (payment.status !== 'captured') {
      throw new Error('Only captured payments can be refunded');
    }

    // Interact with Razorpay API to process the refund (example)
    const refund = await razorpayInstance.payments.refund(
      payment.razorpayPaymentId,
      {
        amount: amount * 100, // Razorpay expects amount in paise
      }
    );

    payment.refund = {
      refundId: refund.id,
      amount,
      status: 'refunded',
      requestedAt: new Date(),
      refundedAt: new Date(),
    };

    payment.status = 'refunded';
    await payment.save();
    await session.commitTransaction();

    res.status(200).json({ message: 'Payment refunded successfully', payment });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error processing refund', error: error.message });
  } finally {
    session.endSession();
  }
};

// Soft delete a payment (optional)
export const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.status(200).json({ message: 'Payment marked as deleted' });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: 'Error deleting payment', error: error.message });
  }
};
