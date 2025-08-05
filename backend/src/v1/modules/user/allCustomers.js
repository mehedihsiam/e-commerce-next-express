import { ROLES } from '../../constants/ROLES.js';
import User from './User.model.js';

/**
 * Get all customers with pagination, search, and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const allCustomers = async (req, res, next) => {
  try {
    // Extract query parameters with defaults
    const {
      page = 1,
      limit = 10,
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Convert page and limit to numbers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber;

    // Validate pagination parameters
    if (pageNumber < 1 || limitNumber < 1 || limitNumber > 100) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid pagination parameters. Page must be >= 1, limit must be 1-100.',
      });
    }

    // Build search query
    const searchQuery = {
      role: ROLES.CUSTOMER,
    };

    // Add search filter for name or email
    if (search) {
      searchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Validate sortBy field to prevent NoSQL injection
    const allowedSortFields = ['createdAt', 'name', 'email', '_id'];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';

    // Build sort object
    const sortOptions = {};
    sortOptions[validSortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries in parallel for better performance
    const [customers, totalCount] = await Promise.all([
      User.find(searchQuery)
        .select('-password') // Exclude password field
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        .lean(), // Use lean() for better performance
      User.countDocuments(searchQuery),
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    // Prepare response
    const response = {
      success: true,
      data: {
        customers,
        pagination: {
          currentPage: pageNumber,
          totalPages,
          totalCustomers: totalCount,
          customersPerPage: limitNumber,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? pageNumber + 1 : null,
          prevPage: hasPrevPage ? pageNumber - 1 : null,
        },
        filters: {
          search,
          sortBy: validSortBy,
          sortOrder,
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching customers:', error);
    next(error);
  }
};

export default allCustomers;
