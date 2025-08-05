import generateToken from '../../utils/generateToken.js';
import User from './User.model.js';

const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    // Here you would typically verify the OTP against your database or cache
    // For demonstration, let's assume the OTP is valid
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: new Date() },
    });
    const isValidOtp = user !== null;

    if (!isValidOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    const token = await generateToken(user.email, user._id);

    // If OTP is valid, proceed with the next steps (e.g., activating user account)
    res.status(200).json({ message: 'OTP verified successfully', token });
  } catch (error) {
    console.error('OTP verification error:', error);
    next(error);
  }
};

export default verifyOtp;
