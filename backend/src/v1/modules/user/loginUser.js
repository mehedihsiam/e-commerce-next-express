import User from './User.model.js';
import bcrypt from 'bcryptjs';
import generateToken from '../../utils/generateToken.js';
import { formatUserForResponsePublic } from '../../utils/formatUserForResponse.js';

const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({
      email: email.toLowerCase(),
      deleted: { $ne: true },
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = await generateToken(user.email, user._id);

    const userObject = user.toObject();

    res.status(200).json({
      message: 'Login successful',
      token,
      user: formatUserForResponsePublic(userObject),
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

export default loginUser;
