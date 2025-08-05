import User from './User.model.js';

const getMyProfile = async (req, res, next) => {
  try {
    // Extract user ID from request
    const email = req.userEmail;

    // Fetch user profile from database
    const userProfile = await User.findOne({ email }, '-password -__v');
    if (!userProfile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    // Return user profile
    res.status(200).json({
      message: 'User profile retrieved successfully',
      data: userProfile,
    });
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    // Handle any errors that occur during the process
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    next(error); // Pass error to the error handling middleware
  }
};

export default getMyProfile;
