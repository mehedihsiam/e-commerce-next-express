import User from './User.model.js';

const deleteModerator = async (req, res, next) => {
  try {
    // Extract email from request body
    const { email } = req.body;

    // Find and delete the moderator
    const deletedModerator = await User.findOneAndUpdate(
      {
        email,
        role: 'moderator',
      },
      {
        $set: { isDeleted: true },
      },
      { new: true },
    );

    if (!deletedModerator) {
      return res.status(404).json({ message: 'Moderator not found' });
    }

    res.status(200).json({ message: 'Moderator deleted successfully' });
  } catch (error) {
    console.error('Error deleting moderator:', error);
    next(error); // Pass error to the error handling middleware
  }
};

export default deleteModerator;
