export const generateOtp = () => {
  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  const expires = new Date(Date.now() + 10 * 60 * 1000);   // 10 minutes
  return { otp, expires };
};
