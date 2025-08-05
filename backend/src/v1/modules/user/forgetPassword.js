import otpSendingEmail from '../../emails/otpSendingEmail.js';
import sendEmail from '../../utils/sendEmail.js';
import User from './User.model.js';

const forgetPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Validate email input
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate reset token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    // Send reset password email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `Your OTP for password reset is: ${otp}`,
      html: otpSendingEmail({
        email: user.email,
        otp,
        userName: user.name,
        purpose: 'password reset',
        expiryMinutes: 15,
        supportEmail: 'support@ecommerce-express.com',
      }),
    });

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Forget password error:', error);
    next(error);
  }
};

export default forgetPassword;
