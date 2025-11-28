import Razorpay from "razorpay";

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async ({ amount, currency = "INR", receipt }) => {
  const options = {
    amount: amount * 100, // amount in paise
    currency,
    receipt,
  };
  return await razorpayInstance.orders.create(options);
};

export const fetchPayment = async (paymentId) => {
  return await razorpayInstance.payments.fetch(paymentId);
};

export const refundPayment = async (paymentId, amount) => {
  return await razorpayInstance.payments.refund(paymentId, {
    amount: amount * 100,
  });
};
