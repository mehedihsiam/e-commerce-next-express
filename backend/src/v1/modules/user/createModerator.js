import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from './User.model.js';
import formatZodError from '../../utils/formatZodError.js';
import jwt from 'jsonwebtoken';
import welcomingModeratorEmail from '../../emails/welcomingModeratorEmail.js';
import sendEmail from '../../utils/sendEmail.js';

// Validation schema
const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must not exceed 50 characters')
    .trim(),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one lowercase letter, one uppercase letter, and one number',
    ),
});

const createModerator = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await User.findOneAndUpdate(
      { email },
      {
        name,
        email,
        password: hashedPassword,
        role: 'moderator',
        createdBy: req.user._id,
      },
      { new: true, upsert: true },
    );

    await sendEmail({
      to: email,
      subject: 'Welcome to E-Commerce as Moderator',
      text: `Hello ${name}, you have been assigned as a moderator on our E-Commerce platform!`,
      html: welcomingModeratorEmail({
        moderatorName: name,
        moderatorEmail: email,
        moderatorPassword: password,
        assignedBy: 'Team Admin',
        adminPanelUrl:
          process.env.ADMIN_PANEL_URL || 'https://admin.ecommerce-express.com',
      }),
    });
    res.status(201).json({ message: 'Moderator created successfully' });
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

export default createModerator;
