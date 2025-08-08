import Settings from './Settings.model.js';

const getAllSettings = async (req, res) => {
  try {
    // Get all settings
    const settings = await Settings.getSettings().populate(
      'lastModified.by',
      'firstName lastName email',
    );

    // Structure response to include all sections
    const response = {
      store: settings.store,
      contact: settings.contact,
      financial: settings.financial,
      shipping: settings.shipping,
      inventory: settings.inventory,
      email: settings.email,
      seo: settings.seo,
      security: {
        // Only include non-sensitive security settings
        enableSSL: settings.security.enableSSL,
        sessionTimeout: settings.security.sessionTimeout,
        maxLoginAttempts: settings.security.maxLoginAttempts,
        lockoutDuration: settings.security.lockoutDuration,
        enableCaptcha: settings.security.enableCaptcha,
        enableTwoFactor: settings.security.enableTwoFactor,
        allowedFileTypes: settings.security.allowedFileTypes,
        maxFileSize: settings.security.maxFileSize,
      },
      performance: settings.performance,
      userExperience: settings.userExperience,
      legal: settings.legal,
      maintenance: settings.maintenance,
      api: {
        // Only include non-sensitive API settings
        enableAPIAccess: settings.api.enableAPIAccess,
        rateLimiting: {
          enabled: settings.api.rateLimiting.enabled,
          requestsPerMinute: settings.api.rateLimiting.requestsPerMinute,
        },
        webhooks: settings.api.webhooks.map(webhook => ({
          event: webhook.event,
          url: webhook.url,
          isActive: webhook.isActive,
          // Don't expose secretKey
        })),
      },
      integrations: {
        googleMaps: {
          enabled: settings.integrations.googleMaps.enabled,
          // Don't expose API key
        },
        analytics: {
          provider: settings.integrations.analytics.provider,
          enabled: settings.integrations.analytics.enabled,
          // Don't expose tracking code
        },
        livechat: {
          enabled: settings.integrations.livechat.enabled,
          provider: settings.integrations.livechat.provider,
          // Don't expose widget code
        },
        emailProvider: {
          service: settings.integrations.emailProvider.service,
          host: settings.integrations.emailProvider.host,
          port: settings.integrations.emailProvider.port,
          encryption: settings.integrations.emailProvider.encryption,
          // Don't expose credentials
        },
      },
      system: settings.system,
      lastModified: settings.lastModified,
    };

    res.status(200).json({
      message: 'Settings retrieved successfully',
      settings: response,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getAllSettings;
