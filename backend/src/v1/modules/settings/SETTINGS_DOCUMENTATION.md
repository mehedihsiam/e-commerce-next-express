# Settings Management System Documentation

## Overview

The Settings Management System provides comprehensive configuration options for a single vendor e-commerce platform. It includes admin-only endpoints for modifying various aspects of the store, from basic information to advanced security and performance settings.

## Key Features

- ✅ **Comprehensive Configuration**: 12+ setting categories covering all aspects of e-commerce
- ✅ **Admin-Only Access**: All modification endpoints require admin authentication
- ✅ **Public API**: Non-sensitive settings available for frontend without authentication
- ✅ **Granular Updates**: Separate endpoints for each settings category
- ✅ **Audit Trail**: Track who modified what settings and when
- ✅ **Validation**: Robust input validation for all setting types
- ✅ **Security**: Sensitive information filtered from public responses

## Settings Categories

### 1. Store Information

Basic store details and branding

- Store name, tagline, description
- Logo and favicon
- Timezone and default language

### 2. Contact Information

Store contact details and business hours

- Email, phone, physical address
- Social media links
- Business hours configuration
- Geographic coordinates

### 3. Financial Settings

Currency, tax, and payment configuration

- Multi-currency support
- Tax settings (rate, inclusive/exclusive)
- Accepted payment methods
- Processing fees

### 4. Shipping Configuration

Shipping methods, zones, and policies

- Shipping methods with pricing
- Geographic shipping zones
- Free shipping thresholds
- Weight and dimension units

### 5. Inventory Management

Stock tracking and availability settings

- Low stock thresholds
- Out-of-stock behavior
- Backorder management

### 6. Email Configuration

Automated email settings

- Order confirmation emails
- Shipping notifications
- Low stock alerts
- Newsletter integration

### 7. SEO Settings

Search engine optimization configuration

- Meta tags (title, description, keywords)
- Open Graph and Twitter Card settings
- Google Analytics and Facebook Pixel
- Sitemap and robots.txt

### 8. Security Settings

Platform security configuration

- SSL enforcement
- Session timeouts
- Login attempt limits
- Two-factor authentication
- File upload restrictions

### 9. Performance Settings

Optimization and caching configuration

- Cache settings
- Image optimization
- CDN configuration
- Compression settings

### 10. User Experience

Customer-facing feature toggles

- Guest checkout
- Wishlist functionality
- Product comparison
- Review system
- Search configuration

### 11. Legal & Compliance

Policy links and compliance settings

- Terms of service
- Privacy policy
- Return policy
- Cookie consent
- GDPR compliance
- Age verification

### 12. Maintenance Mode

Site maintenance configuration

- Enable/disable maintenance mode
- Custom maintenance message
- Allowed IP addresses
- Estimated restoration time

## API Endpoints

### Public Endpoints

#### Get Public Settings

```http
GET /api/v1/settings/public
```

Returns non-sensitive settings needed by the frontend application.

**Response:**

```json
{
  "message": "Public settings retrieved successfully",
  "settings": {
    "store": {
      "name": "My E-commerce Store",
      "tagline": "Quality products for everyone",
      "logo": {
        "url": "https://example.com/logo.png",
        "alt": "Store Logo"
      },
      "timezone": "UTC",
      "defaultLanguage": "en"
    },
    "contact": {
      "email": "contact@store.com",
      "phone": "+1-555-0123",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "zipCode": "10001"
      },
      "socialMedia": {
        "facebook": "https://facebook.com/store",
        "instagram": "https://instagram.com/store"
      },
      "businessHours": [...]
    },
    "financial": {
      "currency": {
        "code": "USD",
        "symbol": "$",
        "position": "before",
        "decimalPlaces": 2
      },
      "taxSettings": {
        "enableTax": true,
        "taxInclusive": false,
        "taxLabel": "Sales Tax"
      }
    },
    "userExperience": {
      "enableGuestCheckout": true,
      "enableWishlist": true,
      "enableReviews": true,
      "productsPerPage": 12
    }
  }
}
```

### Admin Endpoints (Require Admin Authentication)

#### Get All Settings

```http
GET /api/v1/settings
Authorization: Bearer {admin_token}
```

Returns complete settings configuration (filtered for security).

#### Update Store Settings

```http
PATCH /api/v1/settings/store
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "name": "Updated Store Name",
  "tagline": "New tagline",
  "logo": {
    "url": "https://example.com/new-logo.png",
    "alt": "New Logo"
  },
  "timezone": "America/New_York",
  "defaultLanguage": "en"
}
```

#### Update Contact Settings

```http
PATCH /api/v1/settings/contact
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "email": "newcontact@store.com",
  "phone": "+1-555-9999",
  "address": {
    "street": "456 New Street",
    "city": "Los Angeles",
    "state": "CA",
    "country": "USA",
    "zipCode": "90210"
  },
  "socialMedia": {
    "facebook": "https://facebook.com/newstore",
    "instagram": "https://instagram.com/newstore",
    "twitter": "https://twitter.com/newstore"
  },
  "businessHours": [
    {
      "day": "monday",
      "isOpen": true,
      "openTime": "09:00",
      "closeTime": "18:00"
    }
  ]
}
```

#### Update Financial Settings

```http
PATCH /api/v1/settings/financial
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "currency": {
    "code": "EUR",
    "symbol": "€",
    "position": "after",
    "decimalPlaces": 2
  },
  "taxSettings": {
    "enableTax": true,
    "taxRate": 8.5,
    "taxInclusive": false,
    "taxLabel": "VAT"
  },
  "acceptedPaymentMethods": [
    {
      "method": "stripe",
      "isEnabled": true,
      "displayName": "Credit Card",
      "processingFee": 2.9
    },
    {
      "method": "paypal",
      "isEnabled": true,
      "displayName": "PayPal",
      "processingFee": 3.5
    }
  ]
}
```

#### Update Shipping Settings

```http
PATCH /api/v1/settings/shipping
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "enableShipping": true,
  "freeShippingThreshold": 50,
  "shippingMethods": [
    {
      "name": "Standard Shipping",
      "description": "5-7 business days",
      "price": 9.99,
      "estimatedDays": {
        "min": 5,
        "max": 7
      },
      "isEnabled": true
    },
    {
      "name": "Express Shipping",
      "description": "2-3 business days",
      "price": 19.99,
      "estimatedDays": {
        "min": 2,
        "max": 3
      },
      "isEnabled": true
    }
  ],
  "weightUnit": "kg",
  "dimensionUnit": "cm"
}
```

#### Update SEO Settings

```http
PATCH /api/v1/settings/seo
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "metaTitle": "Best E-commerce Store - Quality Products",
  "metaDescription": "Shop quality products at affordable prices. Fast shipping, great customer service.",
  "metaKeywords": ["ecommerce", "shopping", "quality", "affordable"],
  "ogImage": {
    "url": "https://example.com/og-image.jpg",
    "alt": "Store Preview"
  },
  "twitterCard": "summary_large_image",
  "googleAnalyticsId": "G-XXXXXXXXXX",
  "enableSitemap": true
}
```

#### Update Security Settings

```http
PATCH /api/v1/settings/security
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "enableSSL": true,
  "sessionTimeout": 120,
  "maxLoginAttempts": 5,
  "lockoutDuration": 15,
  "enableCaptcha": true,
  "enableTwoFactor": false,
  "allowedFileTypes": ["jpg", "jpeg", "png", "gif", "webp", "pdf"],
  "maxFileSize": 5242880
}
```

#### Update Maintenance Settings

```http
PATCH /api/v1/settings/maintenance
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "enabled": true,
  "message": "We're performing scheduled maintenance. We'll be back soon!",
  "allowedIPs": ["192.168.1.1", "10.0.0.1"],
  "estimatedEndTime": "2025-08-09T02:00:00.000Z"
}
```

#### Update User Experience Settings

```http
PATCH /api/v1/settings/user-experience
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "enableGuestCheckout": true,
  "enableWishlist": true,
  "enableProductComparison": true,
  "enableReviews": true,
  "reviewsRequireApproval": true,
  "enableSearch": true,
  "searchSuggestions": true,
  "productsPerPage": 12,
  "enableAutoComplete": true
}
```

## Response Format

### Success Response

```json
{
  "message": "Settings updated successfully",
  "settings": {
    "store": {
      /* updated store settings */
    },
    "lastModified": {
      "by": "64a123456789abcdef123456",
      "at": "2025-08-08T15:30:00.000Z",
      "section": "store"
    }
  }
}
```

### Error Response

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "store.name",
      "message": "Store name is required"
    }
  ]
}
```

## Implementation Examples

### Frontend Integration

#### React Settings Management

```javascript
// hooks/useSettings.js
import { useState, useEffect } from 'react';
import { settingsApi } from '../api/settings';

export const usePublicSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsApi.getPublicSettings();
        setSettings(response.settings);
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
};

// Admin Settings Form Component
const StoreSettingsForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
  });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await settingsApi.updateStoreSettings(formData);
      toast.success('Store settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type='text'
        placeholder='Store Name'
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
      />
      {/* Other form fields */}
      <button type='submit'>Update Settings</button>
    </form>
  );
};
```

#### Settings API Service

```javascript
// api/settings.js
const API_BASE = '/api/v1/settings';

export const settingsApi = {
  // Public settings (no auth required)
  getPublicSettings: async () => {
    const response = await fetch(`${API_BASE}/public`);
    return response.json();
  },

  // Admin endpoints (require admin token)
  getAllSettings: async () => {
    const response = await fetch(API_BASE, {
      headers: {
        Authorization: `Bearer ${getAdminToken()}`,
      },
    });
    return response.json();
  },

  updateStoreSettings: async data => {
    const response = await fetch(`${API_BASE}/store`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateContactSettings: async data => {
    const response = await fetch(`${API_BASE}/contact`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAdminToken()}`,
      },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // ... other setting update methods
};
```

## Security Considerations

### Access Control

- All modification endpoints require admin authentication
- Sensitive settings (API keys, passwords) are filtered from responses
- Public endpoint only exposes non-sensitive configuration

### Data Protection

- Input validation prevents malicious data
- Business logic validation ensures consistency
- Audit trail tracks all modifications

### Best Practices

- Regular backup of settings
- Test setting changes in staging environment
- Monitor setting modifications for unauthorized changes
- Use environment variables for truly sensitive data

## Database Design

### Single Document Architecture

- Settings stored as single MongoDB document
- Prevents data inconsistency
- Supports atomic updates
- Includes modification tracking

### Indexing Strategy

- Unique index ensures single settings document
- Compound indexes for efficient querying
- Text indexes for search functionality

This comprehensive settings system provides enterprise-level configuration management for your e-commerce platform while maintaining security and ease of use.
