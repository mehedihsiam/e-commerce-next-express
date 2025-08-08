import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for SEO settings
const updateSEOSettingsSchema = z.object({
  metaTitle: z
    .string()
    .trim()
    .max(60, 'Meta title should not exceed 60 characters')
    .optional(),
  metaDescription: z
    .string()
    .trim()
    .max(160, 'Meta description should not exceed 160 characters')
    .optional(),
  metaKeywords: z
    .array(z.string().trim())
    .max(10, 'Maximum 10 keywords allowed')
    .optional(),
  ogImage: z
    .object({
      url: z.string().url('Invalid OG image URL').optional(),
      alt: z.string().trim().optional(),
    })
    .optional(),
  twitterCard: z
    .enum(['summary', 'summary_large_image', 'app', 'player'])
    .optional(),
  googleAnalyticsId: z
    .string()
    .trim()
    .regex(
      /^G-[A-Z0-9]+$|^UA-[0-9]+-[0-9]+$/,
      'Invalid Google Analytics ID format',
    )
    .optional(),
  facebookPixelId: z
    .string()
    .trim()
    .regex(/^[0-9]+$/, 'Invalid Facebook Pixel ID format')
    .optional(),
  enableSitemap: z.boolean().optional(),
  robotsTxt: z.string().trim().optional(),
});

const updateSEOSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateSEOSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Get current settings
    const settings = await Settings.getSettings();

    // Update SEO section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          if (key === 'ogImage') {
            // Merge nested objects
            settings.seo[key] = {
              ...settings.seo[key],
              ...updates[key],
            };
          } else {
            settings.seo[key] = updates[key];
          }
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'seo',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'SEO settings updated successfully',
      settings: {
        seo: settings.seo,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update SEO settings error:', error);

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

export default updateSEOSettings;
