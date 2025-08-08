import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for payment methods
const paymentMethodSchema = z.object({
  method: z.enum([
    'stripe',
    'paypal',
    'cash_on_delivery',
    'bank_transfer',
    'apple_pay',
    'google_pay',
  ]),
  isEnabled: z.boolean().default(true),
  displayName: z.string().trim().optional(),
  processingFee: z.number().min(0).default(0),
});

// Validation schema for financial settings
const updateFinancialSettingsSchema = z.object({
  currency: z
    .object({
      code: z
        .enum([
          'USD',
          'EUR',
          'GBP',
          'CAD',
          'AUD',
          'JPY',
          'INR',
          'BRL',
          'MXN',
          'CNY',
        ])
        .optional(),
      symbol: z
        .string()
        .trim()
        .min(1, 'Currency symbol is required')
        .optional(),
      position: z.enum(['before', 'after']).optional(),
      decimalPlaces: z.number().int().min(0).max(4).optional(),
    })
    .optional(),
  taxSettings: z
    .object({
      enableTax: z.boolean().optional(),
      taxRate: z.number().min(0).max(100).optional(),
      taxInclusive: z.boolean().optional(),
      taxLabel: z.string().trim().optional(),
    })
    .optional(),
  acceptedPaymentMethods: z.array(paymentMethodSchema).optional(),
});

const updateFinancialSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateFinancialSettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Get current settings
    const settings = await Settings.getSettings();

    // Update financial section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          if (key === 'currency' || key === 'taxSettings') {
            // Merge nested objects
            settings.financial[key] = {
              ...settings.financial[key],
              ...updates[key],
            };
          } else {
            settings.financial[key] = updates[key];
          }
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'financial',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Financial settings updated successfully',
      settings: {
        financial: settings.financial,
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update financial settings error:', error);

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

export default updateFinancialSettings;
