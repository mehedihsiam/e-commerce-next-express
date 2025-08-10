import bcrypt from 'bcryptjs';
import { z } from 'zod';
import User from './User.model.js';
import formatZodError from '../../utils/formatZodError.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendEmail.js';
import welcomingUserEmail from '../../emails/welcomingUserEmail.js';
import generateToken from '../../utils/generateToken.js';
import { formatUserForResponsePublic } from '../../utils/formatUserForResponse.js';

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

const registerUserSelf = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });
    await newUser.save();

    const token = await generateToken(email, newUser._id);

    const userObject = newUser.toObject();

    await sendEmail({
      to: email,
      subject: 'Welcome to E-Commerce',
      text: `Hello ${name}, welcome to our E-Commerce platform!`,
      html: welcomingUserEmail({
        userName: name,
        userEmail: email,
      }),
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: formatUserForResponsePublic(userObject),
    });
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

export default registerUserSelf;
