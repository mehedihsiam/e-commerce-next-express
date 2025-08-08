import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for store settings
const updateStoreSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Store name is required')
    .max(100, 'Store name cannot exceed 100 characters')
    .optional(),
  tagline: z
    .string()
    .trim()
    .max(200, 'Tagline cannot exceed 200 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, 'Description cannot exceed 1000 characters')
    .optional(),
  logo: z
    .object({
      url: z.string().url('Invalid logo URL').optional(),
      alt: z.string().trim().optional(),
    })
    .optional(),
  favicon: z
    .object({
      url: z.string().url('Invalid favicon URL').optional(),
    })
    .optional(),
  timezone: z.string().optional(),
  defaultLanguage: z
    .enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'ar'])
    .optional(),
});

const updateStoreSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateStoreSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Get current settings
    const settings = await Settings.getSettings();

    // Update store section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings.store[key] = updates[key];
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'store',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Store settings updated successfully',
      settings: {
        store: settings.store,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update store settings error:', error);

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

export default updateStoreSettings;
