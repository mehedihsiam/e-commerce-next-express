# Coupon Module Documentation

## Overview

The Coupon module provides comprehensive coupon management functionality for the e-commerce platform. It supports various discount types, usage limitations, user restrictions, and detailed validation logic.

## Features

- **Discount Types**: Flat amount and percentage-based discounts
- **Usage Controls**: Limit total usage and per-user restrictions
- **Time-based Validation**: Start date and expiration date controls
- **Product/Category Targeting**: Apply coupons to specific products or categories
- **User Restrictions**: First-time user only or specific user restrictions
- **Admin Management**: Full CRUD operations for administrators
- **Real-time Validation**: API endpoint for coupon validation during checkout

## API Endpoints

### Public Endpoints

#### Validate Coupon

```http
POST /api/v1/coupons/validate
```

**Request Body:**

```json
{
  "code": "SAVE20",
  "subtotal": 100.0,
  "userId": "64a123456789abcdef123456" // Optional
}
```

**Response (Valid):**

```json
{
  "message": "Coupon is valid",
  "valid": true,
  "coupon": {
    "id": "64a123456789abcdef123456",
    "code": "SAVE20",
    "name": "20% Off Sale",
    "discountType": "percent",
    "discountValue": 20,
    "minPurchase": 50,
    "maxDiscount": 50,
    "remainingUses": "Unlimited"
  },
  "calculation": {
    "subtotal": 100.0,
    "discountAmount": 20.0,
    "finalAmount": 80.0,
    "savings": 20.0
  }
}
```

**Response (Invalid):**

```json
{
  "message": "Minimum purchase amount is $50",
  "valid": false,
  "errors": ["Minimum purchase amount is $50"]
}
```

### Admin Endpoints (Require Admin Authentication)

#### Create Coupon

```http
POST /api/v1/coupons
Authorization: Bearer {admin_token}
```

**Request Body:**

```json
{
  "code": "SAVE20",
  "name": "20% Off Sale",
  "description": "Get 20% off your entire order",
  "discountType": "percent",
  "discountValue": 20,
  "minPurchase": 50,
  "maxDiscount": 50,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "usageLimit": 100,
  "applicableCategories": ["64a123456789abcdef123456"],
  "applicableProducts": ["64a123456789abcdef123457"],
  "userRestrictions": {
    "firstTimeOnly": true,
    "specificUsers": []
  }
}
```

#### Get All Coupons

```http
GET /api/v1/coupons?page=1&limit=10&status=active&search=SAVE
Authorization: Bearer {admin_token}
```

**Query Parameters:**

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `search` (string): Search in code, name, or description
- `status` (enum): `all`, `active`, `inactive`, `expired`
- `discountType` (enum): `all`, `flat`, `percent`
- `sortBy` (enum): `createdAt`, `expiresAt`, `code`, `usageCount`
- `sortOrder` (enum): `asc`, `desc`

#### Get Coupon by ID

```http
GET /api/v1/coupons/{id}
Authorization: Bearer {admin_token}
```

#### Update Coupon

```http
PATCH /api/v1/coupons/{id}
Authorization: Bearer {admin_token}
```

**Request Body (all fields optional):**

```json
{
  "name": "Updated Coupon Name",
  "description": "Updated description",
  "discountValue": 25,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "isActive": false
}
```

#### Delete Coupon

```http
DELETE /api/v1/coupons/{id}
Authorization: Bearer {admin_token}
```

**Note:** Coupons that have been used cannot be deleted, only deactivated.

## Model Schema

### Coupon Fields

- **code** (String): Unique uppercase coupon code (3-20 characters, alphanumeric)
- **name** (String): Display name for the coupon
- **description** (String): Optional description
- **discountType** (Enum): `flat` or `percent`
- **discountValue** (Number): Discount amount or percentage
- **minPurchase** (Number): Minimum order amount required
- **maxDiscount** (Number): Maximum discount amount (percentage discounts only)
- **startDate** (Date): When coupon becomes active
- **expiresAt** (Date): When coupon expires
- **usageCount** (Number): Current number of uses
- **usageLimit** (Number): Maximum allowed uses
- **isActive** (Boolean): Whether coupon is active
- **createdBy** (ObjectId): Admin who created the coupon
- **applicableCategories** (Array): Category IDs this coupon applies to
- **applicableProducts** (Array): Product IDs this coupon applies to
- **userRestrictions** (Object): User-specific restrictions

### Virtual Fields

- **isExpired**: Boolean indicating if coupon is expired
- **isValid**: Boolean indicating if coupon is currently valid
- **remainingUses**: Number of remaining uses or "Unlimited"

## Business Logic

### Discount Calculation

1. **Flat Discount**: Direct amount deduction, cannot exceed order total
2. **Percentage Discount**: Calculated as (subtotal × percentage / 100)
   - Limited by `maxDiscount` if specified
   - Cannot exceed order total

### Validation Rules

1. **Active Status**: Coupon must be active
2. **Expiration**: Must not be expired
3. **Usage Limit**: Must not exceed usage limit
4. **Minimum Purchase**: Order total must meet minimum requirement
5. **User Restrictions**: Must pass user-specific validations
6. **Category/Product**: Must apply to items in cart (if specified)

### Security Features

- Admin-only coupon management
- Backend-only validation and calculation
- Usage tracking and limits
- Automatic code uppercase conversion
- Comprehensive input validation

## Error Handling

### Common Error Responses

- **400 Bad Request**: Validation errors, invalid data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions (non-admin)
- **404 Not Found**: Coupon not found
- **409 Conflict**: Duplicate coupon code
- **500 Internal Server Error**: Server-side errors

## Usage Examples

### Frontend Integration

```javascript
// Validate coupon during checkout
const validateCoupon = async (code, subtotal, userId) => {
  const response = await fetch('/api/v1/coupons/validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, subtotal, userId }),
  });

  const result = await response.json();
  return result;
};

// Admin: Create new coupon
const createCoupon = async (couponData, adminToken) => {
  const response = await fetch('/api/v1/coupons', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify(couponData),
  });

  return response.json();
};
```

### Order Integration

The coupon validation is already integrated into the order placement process. When placing an order with a coupon code, the system automatically:

1. Validates the coupon
2. Calculates the discount
3. Applies the discount to the order
4. Increments the usage count
5. Stores coupon information in the order

## Best Practices

### Creating Effective Coupons

1. Use clear, memorable coupon codes
2. Set appropriate minimum purchase amounts
3. Consider usage limits to control costs
4. Use expiration dates to create urgency
5. Target specific categories or products when needed

### Performance Considerations

- Index on frequently queried fields (code, isActive, expiresAt)
- Use lean queries for list operations
- Cache frequently accessed coupons
- Monitor coupon usage patterns

### Security Best Practices

- Never trust discount amounts from frontend
- Always validate coupons server-side
- Log all coupon usage for audit trails
- Implement rate limiting on validation endpoints
- Regularly review and clean up expired coupons

## Testing

### Test Scenarios

1. Create coupon with various discount types
2. Validate coupons with different order amounts
3. Test usage limits and expiration
4. Verify user restrictions work correctly
5. Test category/product-specific coupons
6. Ensure proper error handling

### Sample Test Data

```json
{
  "code": "TEST20",
  "name": "Test 20% Off",
  "discountType": "percent",
  "discountValue": 20,
  "minPurchase": 25,
  "maxDiscount": 100,
  "expiresAt": "2025-12-31T23:59:59.000Z",
  "usageLimit": 50
}
```
