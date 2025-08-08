import Settings from './Settings.model.js';

const getPublicSettings = async (req, res) => {
  try {
    // Get settings
    const settings = await Settings.getSettings();

    // Only return public/non-sensitive settings that frontend needs
    const publicSettings = {
      store: {
        name: settings.store.name,
        tagline: settings.store.tagline,
        description: settings.store.description,
        logo: settings.store.logo,
        favicon: settings.store.favicon,
        timezone: settings.store.timezone,
        defaultLanguage: settings.store.defaultLanguage,
      },
      contact: {
        email: settings.contact.email,
        phone: settings.contact.phone,
        address: settings.contact.address,
        socialMedia: settings.contact.socialMedia,
        businessHours: settings.contact.businessHours,
      },
      financial: {
        currency: settings.financial.currency,
        taxSettings: {
          enableTax: settings.financial.taxSettings.enableTax,
          taxInclusive: settings.financial.taxSettings.taxInclusive,
          taxLabel: settings.financial.taxSettings.taxLabel,
        },
        acceptedPaymentMethods:
          settings.financial.acceptedPaymentMethods.filter(
            method => method.isEnabled,
          ),
      },
      shipping: {
        enableShipping: settings.shipping.enableShipping,
        freeShippingThreshold: settings.shipping.freeShippingThreshold,
        shippingMethods: settings.shipping.shippingMethods.filter(
          method => method.isEnabled,
        ),
        weightUnit: settings.shipping.weightUnit,
        dimensionUnit: settings.shipping.dimensionUnit,
      },
      inventory: {
        outOfStockBehavior: settings.inventory.outOfStockBehavior,
        enableBackorders: settings.inventory.enableBackorders,
        backorderMessage: settings.inventory.backorderMessage,
      },
      seo: {
        metaTitle: settings.seo.metaTitle,
        metaDescription: settings.seo.metaDescription,
        metaKeywords: settings.seo.metaKeywords,
        ogImage: settings.seo.ogImage,
        twitterCard: settings.seo.twitterCard,
      },
      userExperience: settings.userExperience,
      legal: {
        termsOfService: settings.legal.termsOfService,
        privacyPolicy: settings.legal.privacyPolicy,
        returnPolicy: settings.legal.returnPolicy,
        shippingPolicy: settings.legal.shippingPolicy,
        cookieConsent: settings.legal.cookieConsent,
        ageVerification: settings.legal.ageVerification,
      },
      maintenance: settings.maintenance,
      system: {
        dateFormat: settings.system.dateFormat,
        timeFormat: settings.system.timeFormat,
      },
    };

    res.status(200).json({
      message: 'Public settings retrieved successfully',
      settings: publicSettings,
    });
  } catch (error) {
    console.error('Get public settings error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getPublicSettings;
