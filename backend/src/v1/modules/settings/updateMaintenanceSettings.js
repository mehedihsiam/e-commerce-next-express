import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for maintenance settings
const updateMaintenanceSettingsSchema = z.object({
  enabled: z.boolean().optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Maintenance message must be at least 10 characters')
    .max(500, 'Maintenance message cannot exceed 500 characters')
    .optional(),
  allowedIPs: z.array(z.string().ip('Invalid IP address')).optional(),
  estimatedEndTime: z
    .string()
    .datetime()
    .transform(str => new Date(str))
    .optional(),
});

const updateMaintenanceSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateMaintenanceSettingsSchema.safeParse(
      req.body,
    );
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Validate estimated end time if provided
    if (updates.estimatedEndTime && updates.estimatedEndTime <= new Date()) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [
          {
            field: 'estimatedEndTime',
            message: 'Estimated end time must be in the future',
          },
        ],
      });
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Update maintenance section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings.maintenance[key] = updates[key];
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'maintenance',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Maintenance settings updated successfully',
      settings: {
        maintenance: settings.maintenance,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update maintenance settings error:', error);

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

export default updateMaintenanceSettings;
