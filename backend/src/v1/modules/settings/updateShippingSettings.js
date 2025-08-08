import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for shipping methods
const shippingMethodSchema = z.object({
  name: z.string().trim().min(1, 'Shipping method name is required'),
  description: z.string().trim().optional(),
  price: z.number().min(0, 'Price cannot be negative'),
  estimatedDays: z
    .object({
      min: z.number().int().min(0).optional(),
      max: z.number().int().min(0).optional(),
    })
    .optional(),
  isEnabled: z.boolean().default(true),
});

// Validation schema for shipping zones
const shippingZoneSchema = z.object({
  name: z.string().trim().min(1, 'Zone name is required'),
  countries: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  zipCodes: z.array(z.string()).optional(),
  shippingRate: z.number().min(0, 'Shipping rate cannot be negative'),
});

// Validation schema for shipping settings
const updateShippingSettingsSchema = z.object({
  enableShipping: z.boolean().optional(),
  freeShippingThreshold: z.number().min(0).optional(),
  shippingMethods: z.array(shippingMethodSchema).optional(),
  shippingZones: z.array(shippingZoneSchema).optional(),
  weightUnit: z.enum(['kg', 'lbs', 'g', 'oz']).optional(),
  dimensionUnit: z.enum(['cm', 'in', 'm', 'ft']).optional(),
});

const updateShippingSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateShippingSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Validate estimated days if provided
    if (updates.shippingMethods) {
      for (const method of updates.shippingMethods) {
        if (
          method.estimatedDays &&
          method.estimatedDays.min &&
          method.estimatedDays.max
        ) {
          if (method.estimatedDays.min > method.estimatedDays.max) {
            return res.status(400).json({
              message: 'Validation failed',
              errors: [
                {
                  field: 'shippingMethods.estimatedDays',
                  message: 'Minimum days cannot be greater than maximum days',
                },
              ],
            });
          }
        }
      }
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Update shipping section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings.shipping[key] = updates[key];
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'shipping',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Shipping settings updated successfully',
      settings: {
        shipping: settings.shipping,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update shipping settings error:', error);

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

export default updateShippingSettings;
