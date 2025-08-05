import { ROLES } from '../../constants/ROLES.js';
import User from './User.model.js';

/**
 * Get all customers with pagination, search, and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const allModerators = async (req, res, next) => {
  try {
    // Extract query parameters with defaults
    const {} = req.query;
    const moderators = await User.find({ role: ROLES.MODERATOR }).lean();

    res.status(200).json({
      success: true,
      message: 'Moderators fetched successfully',
      data: {
        moderators,
      },
    });
  } catch (error) {
    console.error('Error fetching moderators:', error);
    next(error);
  }
};

export default allModerators;
