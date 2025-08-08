import { z } from 'zod';
import Settings from './Settings.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for security settings
const updateSecuritySettingsSchema = z.object({
  enableSSL: z.boolean().optional(),
  sessionTimeout: z
    .number()
    .int()
    .min(15, 'Session timeout must be at least 15 minutes')
    .max(1440, 'Session timeout cannot exceed 24 hours')
    .optional(),
  maxLoginAttempts: z
    .number()
    .int()
    .min(3, 'Maximum login attempts must be at least 3')
    .max(10, 'Maximum login attempts cannot exceed 10')
    .optional(),
  lockoutDuration: z
    .number()
    .int()
    .min(5, 'Lockout duration must be at least 5 minutes')
    .max(60, 'Lockout duration cannot exceed 60 minutes')
    .optional(),
  enableCaptcha: z.boolean().optional(),
  enableTwoFactor: z.boolean().optional(),
  allowedFileTypes: z.array(z.string().trim().toLowerCase()).optional(),
  maxFileSize: z
    .number()
    .int()
    .min(1048576, 'Maximum file size must be at least 1MB')
    .max(52428800, 'Maximum file size cannot exceed 50MB')
    .optional(),
});

const updateSecuritySettings = async (req, res) => {
  try {
    const userId = req.user.id;

    // Validate input
    const validationResult = updateSecuritySettingsSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const updates = validationResult.data;

    // Validate file types if provided
    if (updates.allowedFileTypes) {
      const validFileTypes = [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'webp',
        'svg',
        'pdf',
        'doc',
        'docx',
        'txt',
        'mp4',
        'avi',
        'mov',
      ];
      const invalidTypes = updates.allowedFileTypes.filter(
        type => !validFileTypes.includes(type),
      );

      if (invalidTypes.length > 0) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: [
            {
              field: 'allowedFileTypes',
              message: `Invalid file types: ${invalidTypes.join(', ')}. Allowed types: ${validFileTypes.join(', ')}`,
            },
          ],
        });
      }
    }

    // Get current settings
    const settings = await Settings.getSettings();

    // Update security section
    if (Object.keys(updates).length > 0) {
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          settings.security[key] = updates[key];
        }
      });

      // Update modification tracking
      settings.lastModified = {
        by: userId,
        at: new Date(),
        section: 'security',
      };

      await settings.save();
    }

    res.status(200).json({
      message: 'Security settings updated successfully',
      settings: {
        security: {
          ...settings.security,
          // Don't expose sensitive settings in response
          enableSSL: settings.security.enableSSL,
          sessionTimeout: settings.security.sessionTimeout,
          maxLoginAttempts: settings.security.maxLoginAttempts,
          lockoutDuration: settings.security.lockoutDuration,
          enableCaptcha: settings.security.enableCaptcha,
          enableTwoFactor: settings.security.enableTwoFactor,
          allowedFileTypes: settings.security.allowedFileTypes,
          maxFileSize: settings.security.maxFileSize,
        },
        lastModified: settings.lastModified,
      },
    });
  } catch (error) {
    console.error('Update security settings error:', error);

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

export default updateSecuritySettings;
