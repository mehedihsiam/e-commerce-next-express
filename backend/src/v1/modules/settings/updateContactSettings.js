import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for business hours
const businessHourSchema = z.object({
  day: z.enum([
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]),
  isOpen: z.boolean().default(true),
  openTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM')
    .optional(),
  closeTime: z
    .string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:MM')
    .optional(),
});

// Validation schema for contact settings
const updateContactSettingsSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .trim()
    .toLowerCase()
    .optional(),
  phone: z.string().trim().optional(),
  address: z
    .object({
      street: z.string().trim().optional(),
      city: z.string().trim().optional(),
      state: z.string().trim().optional(),
      country: z.string().trim().optional(),
      zipCode: z.string().trim().optional(),
      coordinates: z
        .object({
          latitude: z.number().min(-90).max(90).optional(),
          longitude: z.number().min(-180).max(180).optional(),
        })
        .optional(),
    })
    .optional(),
  socialMedia: z
    .object({
      facebook: z.string().url('Invalid Facebook URL').optional(),
      twitter: z.string().url('Invalid Twitter URL').optional(),
      instagram: z.string().url('Invalid Instagram URL').optional(),
      linkedin: z.string().url('Invalid LinkedIn URL').optional(),
      youtube: z.string().url('Invalid YouTube URL').optional(),
      tiktok: z.string().url('Invalid TikTok URL').optional(),
    })
    .optional(),
  businessHours: z.array(businessHourSchema).optional(),
});

const updateContactSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateContactSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Get current settings
    const settings = await Settings.getSettings();

    // Update contact section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          if (key === 'address' || key === 'socialMedia') {
            // Merge nested objects
            settings.contact[key] = {
              ...settings.contact[key],
              ...updates[key],
            };
          } else {
            settings.contact[key] = updates[key];
          }
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'contact',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Contact settings updated successfully',
      settings: {
        contact: settings.contact,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update contact settings error:', error);

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

export default updateContactSettings;
