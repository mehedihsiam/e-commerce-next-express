import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    // Store Basic Information
    store: {
      name: {
        type: String,
        required: [true, 'Store name is required'],
        trim: true,
        maxlength: [100, 'Store name cannot exceed 100 characters'],
      },
      tagline: {
        type: String,
        trim: true,
        maxlength: [200, 'Tagline cannot exceed 200 characters'],
      },
      description: {
        type: String,
        trim: true,
        maxlength: [1000, 'Description cannot exceed 1000 characters'],
      },
      logo: {
        url: String,
        alt: String,
      },
      favicon: {
        url: String,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      defaultLanguage: {
        type: String,
        default: 'en',
        enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar'],
      },
    },

    // Contact Information
    contact: {
      email: {
        type: String,
        required: [true, 'Contact email is required'],
        trim: true,
        lowercase: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          'Please enter a valid email',
        ],
      },
      phone: {
        type: String,
        trim: true,
      },
      address: {
        street: String,
        city: String,
        state: String,
        country: String,
        zipCode: String,
        coordinates: {
          latitude: Number,
          longitude: Number,
        },
      },
      socialMedia: {
        facebook: String,
        twitter: String,
        instagram: String,
        linkedin: String,
        youtube: String,
        tiktok: String,
      },
      businessHours: [
        {
          day: {
            type: String,
            enum: [
              'monday',
              'tuesday',
              'wednesday',
              'thursday',
              'friday',
              'saturday',
              'sunday',
            ],
          },
          isOpen: {
            type: Boolean,
            default: true,
          },
          openTime: String, // Format: "09:00"
          closeTime: String, // Format: "17:00"
        },
      ],
    },

    // Currency and Financial Settings
    financial: {
      currency: {
        code: {
          type: String,
          required: [true, 'Currency code is required'],
          default: 'USD',
          uppercase: true,
          enum: [
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
          ],
        },
        symbol: {
          type: String,
          required: [true, 'Currency symbol is required'],
          default: '$',
        },
        position: {
          type: String,
          enum: ['before', 'after'],
          default: 'before',
        },
        decimalPlaces: {
          type: Number,
          min: 0,
          max: 4,
          default: 2,
        },
      },
      taxSettings: {
        enableTax: {
          type: Boolean,
          default: true,
        },
        taxRate: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
        taxInclusive: {
          type: Boolean,
          default: false,
        },
        taxLabel: {
          type: String,
          default: 'Tax',
        },
      },
      acceptedPaymentMethods: [
        {
          method: {
            type: String,
            enum: [
              'stripe',
              'paypal',
              'cash_on_delivery',
              'bank_transfer',
              'apple_pay',
              'google_pay',
            ],
          },
          isEnabled: {
            type: Boolean,
            default: true,
          },
          displayName: String,
          processingFee: {
            type: Number,
            min: 0,
            default: 0,
          },
        },
      ],
    },

    // Shipping Configuration
    shipping: {
      enableShipping: {
        type: Boolean,
        default: true,
      },
      freeShippingThreshold: {
        type: Number,
        min: 0,
        default: 0,
      },
      shippingMethods: [
        {
          name: {
            type: String,
            required: true,
          },
          description: String,
          price: {
            type: Number,
            min: 0,
            required: true,
          },
          estimatedDays: {
            min: Number,
            max: Number,
          },
          isEnabled: {
            type: Boolean,
            default: true,
          },
        },
      ],
      shippingZones: [
        {
          name: String,
          countries: [String],
          states: [String],
          zipCodes: [String],
          shippingRate: {
            type: Number,
            min: 0,
          },
        },
      ],
      weightUnit: {
        type: String,
        enum: ['kg', 'lbs', 'g', 'oz'],
        default: 'kg',
      },
      dimensionUnit: {
        type: String,
        enum: ['cm', 'in', 'm', 'ft'],
        default: 'cm',
      },
    },

    // Inventory Management
    inventory: {
      trackInventory: {
        type: Boolean,
        default: true,
      },
      lowStockThreshold: {
        type: Number,
        min: 0,
        default: 10,
      },
      outOfStockBehavior: {
        type: String,
        enum: ['hide', 'show_unavailable', 'allow_backorder'],
        default: 'show_unavailable',
      },
      enableBackorders: {
        type: Boolean,
        default: false,
      },
      backorderMessage: {
        type: String,
        default: 'This item is on backorder',
      },
    },

    // Email Configuration
    email: {
      orderConfirmation: {
        enabled: {
          type: Boolean,
          default: true,
        },
        subject: {
          type: String,
          default: 'Order Confirmation #{orderNumber}',
        },
        template: String,
      },
      orderShipped: {
        enabled: {
          type: Boolean,
          default: true,
        },
        subject: {
          type: String,
          default: 'Your Order Has Been Shipped',
        },
        template: String,
      },
      orderDelivered: {
        enabled: {
          type: Boolean,
          default: true,
        },
        subject: {
          type: String,
          default: 'Order Delivered Successfully',
        },
        template: String,
      },
      lowStock: {
        enabled: {
          type: Boolean,
          default: true,
        },
        threshold: {
          type: Number,
          default: 5,
        },
        recipients: [String],
      },
      newsletter: {
        enabled: {
          type: Boolean,
          default: false,
        },
        provider: {
          type: String,
          enum: ['mailchimp', 'sendgrid', 'custom'],
        },
        listId: String,
      },
    },

    // SEO Settings
    seo: {
      metaTitle: {
        type: String,
        maxlength: [60, 'Meta title should not exceed 60 characters'],
      },
      metaDescription: {
        type: String,
        maxlength: [160, 'Meta description should not exceed 160 characters'],
      },
      metaKeywords: [String],
      ogImage: {
        url: String,
        alt: String,
      },
      twitterCard: {
        type: String,
        enum: ['summary', 'summary_large_image', 'app', 'player'],
        default: 'summary_large_image',
      },
      googleAnalyticsId: String,
      facebookPixelId: String,
      enableSitemap: {
        type: Boolean,
        default: true,
      },
      robotsTxt: String,
    },

    // Security Settings
    security: {
      enableSSL: {
        type: Boolean,
        default: true,
      },
      sessionTimeout: {
        type: Number,
        min: 15,
        max: 1440,
        default: 60, // minutes
      },
      maxLoginAttempts: {
        type: Number,
        min: 3,
        max: 10,
        default: 5,
      },
      lockoutDuration: {
        type: Number,
        min: 5,
        max: 60,
        default: 15, // minutes
      },
      enableCaptcha: {
        type: Boolean,
        default: false,
      },
      enableTwoFactor: {
        type: Boolean,
        default: false,
      },
      allowedFileTypes: {
        type: [String],
        default: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf'],
      },
      maxFileSize: {
        type: Number,
        default: 5242880, // 5MB in bytes
      },
    },

    // Performance Settings
    performance: {
      enableCaching: {
        type: Boolean,
        default: true,
      },
      cacheTimeout: {
        type: Number,
        default: 3600, // seconds
      },
      enableImageOptimization: {
        type: Boolean,
        default: true,
      },
      enableLazyLoading: {
        type: Boolean,
        default: true,
      },
      enableCompression: {
        type: Boolean,
        default: true,
      },
      cdn: {
        enabled: {
          type: Boolean,
          default: false,
        },
        url: String,
        provider: {
          type: String,
          enum: ['cloudflare', 'aws', 'google', 'custom'],
        },
      },
    },

    // User Experience Settings
    userExperience: {
      enableGuestCheckout: {
        type: Boolean,
        default: true,
      },
      enableWishlist: {
        type: Boolean,
        default: true,
      },
      enableProductComparison: {
        type: Boolean,
        default: true,
      },
      enableReviews: {
        type: Boolean,
        default: true,
      },
      reviewsRequireApproval: {
        type: Boolean,
        default: true,
      },
      enableSearch: {
        type: Boolean,
        default: true,
      },
      searchSuggestions: {
        type: Boolean,
        default: true,
      },
      productsPerPage: {
        type: Number,
        min: 6,
        max: 100,
        default: 12,
      },
      enableAutoComplete: {
        type: Boolean,
        default: true,
      },
    },

    // Legal and Compliance
    legal: {
      termsOfService: {
        url: String,
        lastUpdated: Date,
      },
      privacyPolicy: {
        url: String,
        lastUpdated: Date,
      },
      returnPolicy: {
        url: String,
        lastUpdated: Date,
      },
      shippingPolicy: {
        url: String,
        lastUpdated: Date,
      },
      cookieConsent: {
        enabled: {
          type: Boolean,
          default: true,
        },
        message: {
          type: String,
          default:
            'This website uses cookies to ensure you get the best experience on our website.',
        },
      },
      gdprCompliant: {
        type: Boolean,
        default: false,
      },
      ageVerification: {
        enabled: {
          type: Boolean,
          default: false,
        },
        minimumAge: {
          type: Number,
          default: 18,
        },
      },
    },

    // Maintenance Mode
    maintenance: {
      enabled: {
        type: Boolean,
        default: false,
      },
      message: {
        type: String,
        default:
          'We are currently performing scheduled maintenance. Please check back soon.',
      },
      allowedIPs: [String],
      estimatedEndTime: Date,
    },

    // API Configuration
    api: {
      enableAPIAccess: {
        type: Boolean,
        default: false,
      },
      rateLimiting: {
        enabled: {
          type: Boolean,
          default: true,
        },
        requestsPerMinute: {
          type: Number,
          default: 100,
        },
      },
      webhooks: [
        {
          event: {
            type: String,
            enum: [
              'order.created',
              'order.updated',
              'order.cancelled',
              'product.created',
              'product.updated',
              'user.registered',
            ],
          },
          url: String,
          isActive: {
            type: Boolean,
            default: true,
          },
          secretKey: String,
        },
      ],
    },

    // Integration Settings
    integrations: {
      googleMaps: {
        enabled: {
          type: Boolean,
          default: false,
        },
        apiKey: String,
      },
      analytics: {
        provider: {
          type: String,
          enum: ['google', 'facebook', 'custom'],
        },
        trackingCode: String,
        enabled: {
          type: Boolean,
          default: false,
        },
      },
      livechat: {
        enabled: {
          type: Boolean,
          default: false,
        },
        provider: {
          type: String,
          enum: ['intercom', 'zendesk', 'crisp', 'custom'],
        },
        widgetCode: String,
      },
      emailProvider: {
        service: {
          type: String,
          enum: ['smtp', 'sendgrid', 'mailgun', 'ses'],
          default: 'smtp',
        },
        host: String,
        port: Number,
        username: String,
        password: String,
        encryption: {
          type: String,
          enum: ['tls', 'ssl', 'none'],
          default: 'tls',
        },
      },
    },

    // System Configuration
    system: {
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY',
      },
      timeFormat: {
        type: String,
        enum: ['12', '24'],
        default: '24',
      },
      backupFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
      enableLogging: {
        type: Boolean,
        default: true,
      },
      logLevel: {
        type: String,
        enum: ['error', 'warn', 'info', 'debug'],
        default: 'info',
      },
      autoUpdates: {
        type: Boolean,
        default: false,
      },
    },

    // Last modified tracking
    lastModified: {
      by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      at: {
        type: Date,
        default: Date.now,
      },
      section: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Ensure only one settings document exists
settingsSchema.index({}, { unique: true });

// Virtual for formatted currency
settingsSchema.virtual('formattedCurrency').get(function () {
  const { symbol, position } = this.financial.currency;
  return amount => {
    const formatted = amount.toFixed(this.financial.currency.decimalPlaces);
    return position === 'before'
      ? `${symbol}${formatted}`
      : `${formatted}${symbol}`;
  };
});

// Instance method to get setting by path
settingsSchema.methods.getSetting = function (path) {
  return path.split('.').reduce((obj, key) => obj && obj[key], this);
};

// Instance method to update specific setting
settingsSchema.methods.updateSetting = function (path, value, userId) {
  const keys = path.split('.');
  let obj = this;

  // Navigate to the parent object
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) {
      obj[keys[i]] = {};
    }
    obj = obj[keys[i]];
  }

  // Set the value
  obj[keys[keys.length - 1]] = value;

  // Update modification tracking
  this.lastModified = {
    by: userId,
    at: new Date(),
    section: keys[0],
  };

  return this.save();
};

// Static method to get settings (create if doesn't exist)
settingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Static method to update multiple settings
settingsSchema.statics.updateSettings = async function (updates, userId) {
  const settings = await this.getSettings();

  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      settings.set(key, updates[key]);
    }
  });

  settings.lastModified = {
    by: userId,
    at: new Date(),
    section: Object.keys(updates)[0]?.split('.')[0] || 'general',
  };

  return settings.save();
};

// Pre-save middleware to validate business hours
settingsSchema.pre('save', function (next) {
  if (this.contact && this.contact.businessHours) {
    const days = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];
    const businessHours = this.contact.businessHours;

    // Ensure all days are represented
    days.forEach(day => {
      if (!businessHours.find(bh => bh.day === day)) {
        businessHours.push({
          day,
          isOpen: true,
          openTime: '09:00',
          closeTime: '17:00',
        });
      }
    });

    // Validate time format
    businessHours.forEach(bh => {
      if (
        bh.openTime &&
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bh.openTime)
      ) {
        throw new Error(
          `Invalid open time format for ${bh.day}. Use HH:MM format.`,
        );
      }
      if (
        bh.closeTime &&
        !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(bh.closeTime)
      ) {
        throw new Error(
          `Invalid close time format for ${bh.day}. Use HH:MM format.`,
        );
      }
    });
  }

  next();
});

const Settings = mongoose.model('Settings', settingsSchema);
export default Settings;
