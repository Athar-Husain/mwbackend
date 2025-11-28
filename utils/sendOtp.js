const sendOtp = async (phoneNumber) => {
  const mockOtp = "123456";

  // Log the "sent" OTP (replace with actual SMS/email integration if needed)
  console.log(`Sending OTP "${mockOtp}" to phone number: ${phoneNumber}`);

  return mockOtp;
};

export default sendOtp;
