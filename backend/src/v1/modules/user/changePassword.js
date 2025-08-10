import formatZodError from '../../utils/formatZodError.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from './User.model.js';

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(128, 'New password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'New password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),
});

const changePassword = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);
    const { newPassword } = validatedData;

    // Get the user from the request (assuming user is set by verifyToken middleware)
    const user = req.user;

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 8);

    await User.findByIdAndUpdate(
      user._id,
      { password: hashedNewPassword },
      { new: true },
    );

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodErrors,
      });
    }

    next(error); // Pass error to the error handling middleware
  }
};

export default changePassword;
