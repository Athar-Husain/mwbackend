import {
  createOrder,
  fetchPayment,
  refundPayment,
} from "../services/razorpayService.js";
import Payment from "../models/Payment.js";
import { sendEmail } from "../utils/emailSender.js";

export const createPaymentOrder = async (req, res) => {
  try {
    const { amount, receipt } = req.body;
    const order = await createOrder({ amount, receipt });

    res.status(201).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Failed to create payment order", error });
  }
};

export const verifyPaymentWebhook = async (req, res) => {
  try {
    // Razorpay sends webhook with payment info - you should verify signature here (not shown for brevity)

    const event = req.body.event;
    if (event === "payment.captured") {
      const paymentData = req.body.payload.payment.entity;

      // Save payment info to DB
      await Payment.create({
        razorpayOrderId: paymentData.order_id,
        razorpayPaymentId: paymentData.id,
        amount: paymentData.amount / 100,
        status: "captured",
        user: paymentData.notes.userId, // Pass userId in notes while creating order
        method: paymentData.method,
        createdAt: new Date(paymentData.created_at * 1000),
      });

      // Send payment confirmation email (simplified)
      await sendEmail({
        to: paymentData.email,
        subject: "Payment Successful",
        text: `Your payment of ₹${paymentData.amount / 100} was successful.`,
      });
    }

    res.status(200).json({ status: "ok" });
  } catch (error) {
    res.status(500).json({ message: "Webhook handling failed", error });
  }
};

export const refundPaymentController = async (req, res) => {
  try {
    const { paymentId, amount } = req.body;
    const refund = await refundPayment(paymentId, amount);

    // Update payment/refund info in DB accordingly (omitted for brevity)

    res.status(200).json({ refund });
  } catch (error) {
    res.status(500).json({ message: "Refund failed", error });
  }
};
