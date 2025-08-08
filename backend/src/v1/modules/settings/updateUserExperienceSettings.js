import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for user experience settings
const updateUserExperienceSettingsSchema = z.object({
  enableGuestCheckout: z.boolean().optional(),
  enableWishlist: z.boolean().optional(),
  enableProductComparison: z.boolean().optional(),
  enableReviews: z.boolean().optional(),
  reviewsRequireApproval: z.boolean().optional(),
  enableSearch: z.boolean().optional(),
  searchSuggestions: z.boolean().optional(),
  productsPerPage: z
    .number()
    .int()
    .min(6, 'Products per page must be at least 6')
    .max(100, 'Products per page cannot exceed 100')
    .optional(),
  enableAutoComplete: z.boolean().optional(),
});

const updateUserExperienceSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateUserExperienceSettingsSchema.safeParse(
      req.body,
    );
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Business logic validation
    if (
      updates.reviewsRequireApproval === true &&
      updates.enableReviews === false
    ) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [
          {
            field: 'reviewsRequireApproval',
            message:
              'Cannot require approval for reviews when reviews are disabled',
          },
        ],
      });
    }

    if (updates.searchSuggestions === true && updates.enableSearch === false) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [
          {
            field: 'searchSuggestions',
            message: 'Cannot enable search suggestions when search is disabled',
          },
        ],
      });
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Update user experience section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings.userExperience[key] = updates[key];
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'userExperience',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'User experience settings updated successfully',
      settings: {
        userExperience: settings.userExperience,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update user experience settings error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
      }));
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default updateUserExperienceSettings;
