/**
 * Generates a dynamic HTML order confirmation email template
 * @param {Object} options - Email template options
 * @param {Object} options.order - Order object with all details
 * @param {string} options.customerName - Customer's name
 * @param {string} options.customerEmail - Customer's email address
 * @param {string} [options.companyName] - Company name (default: E-Commerce Express)
 * @param {string} [options.logoUrl] - Company logo URL
 * @param {string} [options.websiteUrl] - Website URL
 * @param {string} [options.supportEmail] - Support email address
 * @param {string} [options.trackingUrl] - Order tracking URL base
 * @returns {string} HTML email template
 */
const orderConfirmationEmail = (options = {}) => {
  const {
    order,
    customerName = 'Valued Customer',
    customerEmail = '',
    companyName = 'E-Commerce Express',
    logoUrl = '',
    websiteUrl = '#',
    supportEmail = 'support@ecommerce-express.com',
    trackingUrl = '#',
  } = options;

  if (!order) {
    throw new Error('Order object is required for order confirmation email');
  }

  const theme = {
    primary: '#007bff',
    success: '#28a745',
    secondary: '#6c757d',
    background: '#f8f9fa',
    text: '#212529',
    textLight: '#6c757d',
    border: '#e9ecef',
  };

  // Helper function to format currency
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Helper function to format date
  const formatDate = date => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to get payment method display name
  const getPaymentMethodName = method => {
    const methods = {
      cash_on_delivery: 'Cash on Delivery',
      bkash: 'bKash',
      nagad: 'Nagad',
      rocket: 'Rocket',
      bank_transfer: 'Bank Transfer',
      card: 'Credit/Debit Card',
    };
    return methods[method] || method;
  };

  // Helper function to get shipping method display name
  const getShippingMethodName = method => {
    const methods = {
      standard: 'Standard Shipping',
      express: 'Express Shipping',
      overnight: 'Overnight Shipping',
      pickup: 'Store Pickup',
    };
    return methods[method] || method;
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Order Confirmation - ${order.orderNumber}</title>
    <style>
        /* Reset styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${theme.text};
            background-color: ${theme.background};
            margin: 0;
            padding: 0;
        }
        
        /* Email container */
        .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        /* Header */
        .header {
            background: linear-gradient(135deg, ${theme.success} 0%, #1e7e34 100%);
            padding: 40px 20px;
            text-align: center;
            color: white;
        }
        
        .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .order-number {
            font-size: 18px;
            opacity: 0.9;
            margin: 0;
            font-weight: 600;
        }
        
        /* Content */
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 24px;
            font-weight: 600;
            color: ${theme.primary};
            margin-bottom: 20px;
        }
        
        .confirmation-text {
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.7;
        }
        
        /* Order Summary */
        .order-summary {
            background-color: ${theme.background};
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
            border: 1px solid ${theme.border};
        }
        
        .order-summary h2 {
            color: ${theme.primary};
            margin-bottom: 20px;
            font-size: 20px;
        }
        
        .order-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid ${theme.border};
        }
        
        .order-info:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        
        .order-info .label {
            font-weight: 600;
            color: ${theme.textLight};
        }
        
        .order-info .value {
            color: ${theme.text};
            font-weight: 500;
        }
        
        /* Order Items */
        .items-section {
            margin: 30px 0;
        }
        
        .items-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: ${theme.text};
        }
        
        .item {
            display: flex;
            align-items: center;
            padding: 20px 0;
            border-bottom: 1px solid ${theme.border};
        }
        
        .item:last-child {
            border-bottom: none;
        }
        
        .item-image {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 8px;
            margin-right: 20px;
            border: 1px solid ${theme.border};
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-size: 16px;
            font-weight: 600;
            color: ${theme.text};
            margin-bottom: 5px;
        }
        
        .item-variant {
            font-size: 14px;
            color: ${theme.textLight};
            margin-bottom: 5px;
        }
        
        .item-quantity {
            font-size: 14px;
            color: ${theme.textLight};
        }
        
        .item-price {
            text-align: right;
            font-weight: 600;
            color: ${theme.text};
        }
        
        /* Pricing Table */
        .pricing-table {
            background-color: #ffffff;
            border: 1px solid ${theme.border};
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
        }
        
        .pricing-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid ${theme.border};
        }
        
        .pricing-row:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 18px;
            margin-top: 10px;
            padding-top: 15px;
            border-top: 2px solid ${theme.border};
        }
        
        .pricing-row.discount {
            color: ${theme.success};
        }
        
        /* Address Section */
        .address-section {
            display: flex;
            gap: 30px;
            margin: 30px 0;
        }
        
        .address-card {
            flex: 1;
            background-color: ${theme.background};
            border-radius: 8px;
            padding: 20px;
            border: 1px solid ${theme.border};
        }
        
        .address-card h3 {
            color: ${theme.primary};
            margin-bottom: 15px;
            font-size: 16px;
        }
        
        .address-card p {
            margin: 5px 0;
            font-size: 14px;
            line-height: 1.4;
        }
        
        /* CTA Button */
        .cta-section {
            text-align: center;
            margin: 40px 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, ${theme.primary} 0%, #0056b3 100%);
            color: white;
            text-decoration: none;
            padding: 15px 35px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin: 0 10px 10px 0;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }
        
        .cta-button.secondary {
            background: linear-gradient(135deg, ${theme.secondary} 0%, #495057 100%);
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
        }
        
        /* Info box */
        .info-box {
            background-color: ${theme.background};
            border-left: 4px solid ${theme.primary};
            padding: 20px;
            margin: 30px 0;
            border-radius: 0 8px 8px 0;
        }
        
        .info-box h3 {
            color: ${theme.primary};
            margin-bottom: 10px;
            font-size: 18px;
        }
        
        .info-box p {
            margin: 0;
            color: ${theme.textLight};
        }
        
        /* Footer */
        .footer {
            background-color: #f8f9fa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .footer p {
            color: ${theme.textLight};
            font-size: 14px;
            margin-bottom: 10px;
        }
        
        /* Responsive */
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
            }
            
            .header, .content, .footer {
                padding-left: 20px !important;
                padding-right: 20px !important;
            }
            
            .address-section {
                flex-direction: column !important;
                gap: 20px !important;
            }
            
            .item {
                flex-direction: column !important;
                text-align: center !important;
            }
            
            .item-image {
                margin: 0 0 15px 0 !important;
            }
            
            .cta-button {
                display: block !important;
                margin: 10px 0 !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="${companyName} Logo" class="logo">` : ''}
            <h1>✅ Order Confirmed!</h1>
            <p class="order-number">Order #${order.orderNumber}</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <div class="greeting">Thank you ${customerName}! 🎉</div>
            
            <div class="confirmation-text">
                <p>We've received your order and are getting it ready. You'll receive a shipping confirmation email with tracking information once your order has shipped.</p>
            </div>
            
            <!-- Order Summary -->
            <div class="order-summary">
                <h2>📋 Order Summary</h2>
                <div class="order-info">
                    <span class="label">Order Number:</span>
                    <span class="value">${order.orderNumber}</span>
                </div>
                <div class="order-info">
                    <span class="label">Order Date:</span>
                    <span class="value">${formatDate(order.placedAt || order.createdAt)}</span>
                </div>
                <div class="order-info">
                    <span class="label">Payment Method:</span>
                    <span class="value">${getPaymentMethodName(order.payment.method)}</span>
                </div>
                <div class="order-info">
                    <span class="label">Shipping Method:</span>
                    <span class="value">${getShippingMethodName(order.shipping.method)}</span>
                </div>
                ${
                  order.shipping.estimatedDelivery
                    ? `
                <div class="order-info">
                    <span class="label">Estimated Delivery:</span>
                    <span class="value">${formatDate(order.shipping.estimatedDelivery)}</span>
                </div>
                `
                    : ''
                }
            </div>
            
            <!-- Order Items -->
            <div class="items-section">
                <h2 class="items-title">🛍️ Your Items</h2>
                ${order.items
                  .map(
                    item => `
                    <div class="item">
                        ${
                          item.productSnapshot.image
                            ? `
                            <img src="${item.productSnapshot.image}" alt="${item.productSnapshot.name}" class="item-image">
                        `
                            : ''
                        }
                        <div class="item-details">
                            <div class="item-name">${item.productSnapshot.name}</div>
                            ${
                              item.variant &&
                              (item.variant.color || item.variant.size)
                                ? `
                                <div class="item-variant">
                                    ${item.variant.color ? `Color: ${item.variant.color}` : ''}
                                    ${item.variant.color && item.variant.size ? ' • ' : ''}
                                    ${item.variant.size ? `Size: ${item.variant.size}` : ''}
                                </div>
                            `
                                : ''
                            }
                            <div class="item-quantity">Quantity: ${item.quantity}</div>
                        </div>
                        <div class="item-price">
                            ${formatCurrency(item.lineTotal)}
                        </div>
                    </div>
                `,
                  )
                  .join('')}
            </div>
            
            <!-- Pricing -->
            <div class="pricing-table">
                <div class="pricing-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(order.pricing.subtotal)}</span>
                </div>
                ${
                  order.pricing.itemDiscount > 0
                    ? `
                    <div class="pricing-row discount">
                        <span>Item Discount:</span>
                        <span>-${formatCurrency(order.pricing.itemDiscount)}</span>
                    </div>
                `
                    : ''
                }
                ${
                  order.pricing.couponDiscount > 0
                    ? `
                    <div class="pricing-row discount">
                        <span>Coupon Discount ${order.coupon ? `(${order.coupon.code})` : ''}:</span>
                        <span>-${formatCurrency(order.pricing.couponDiscount)}</span>
                    </div>
                `
                    : ''
                }
                <div class="pricing-row">
                    <span>Shipping:</span>
                    <span>${order.pricing.shippingCost > 0 ? formatCurrency(order.pricing.shippingCost) : 'FREE'}</span>
                </div>
                ${
                  order.pricing.tax > 0
                    ? `
                    <div class="pricing-row">
                        <span>Tax:</span>
                        <span>${formatCurrency(order.pricing.tax)}</span>
                    </div>
                `
                    : ''
                }
                <div class="pricing-row">
                    <span>Total:</span>
                    <span>${formatCurrency(order.pricing.total)}</span>
                </div>
            </div>
            
            <!-- Addresses -->
            <div class="address-section">
                <div class="address-card">
                    <h3>📦 Shipping Address</h3>
                    <p><strong>${order.shippingAddress.fullName}</strong></p>
                    <p>${order.shippingAddress.street}</p>
                    ${order.shippingAddress.landmark ? `<p>${order.shippingAddress.landmark}</p>` : ''}
                    <p>${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.postalCode}</p>
                    <p>${order.shippingAddress.country}</p>
                    <p>📞 ${order.shippingAddress.phone}</p>
                    ${order.shippingAddress.email ? `<p>✉️ ${order.shippingAddress.email}</p>` : ''}
                </div>
                
                <div class="address-card">
                    <h3>💳 Billing Address</h3>
                    ${
                      order.sameAsBilling
                        ? `
                        <p><em>Same as shipping address</em></p>
                    `
                        : `
                        <p><strong>${order.billingAddress.fullName}</strong></p>
                        <p>${order.billingAddress.street}</p>
                        ${order.billingAddress.landmark ? `<p>${order.billingAddress.landmark}</p>` : ''}
                        <p>${order.billingAddress.city}, ${order.billingAddress.state} ${order.billingAddress.postalCode}</p>
                        <p>${order.billingAddress.country}</p>
                        <p>📞 ${order.billingAddress.phone}</p>
                        ${order.billingAddress.email ? `<p>✉️ ${order.billingAddress.email}</p>` : ''}
                    `
                    }
                </div>
            </div>
            
            <!-- CTA Buttons -->
            <div class="cta-section">
                <a href="${trackingUrl}/track/${order.orderNumber}" class="cta-button">Track Your Order</a>
                <a href="${websiteUrl}" class="cta-button secondary">Continue Shopping</a>
            </div>
            
            <!-- Info Box -->
            <div class="info-box">
                <h3>📞 Need Help?</h3>
                <p>If you have any questions about your order, please don't hesitate to contact our customer support team. We're here to help!</p>
            </div>
            
            ${
              order.notes
                ? `
                <div class="info-box">
                    <h3>📝 Order Notes</h3>
                    <p>${order.notes}</p>
                </div>
            `
                : ''
            }
            
            <div class="confirmation-text">
                <p>Thank you for choosing ${companyName}. We appreciate your business and look forward to serving you again!</p>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>${companyName}</strong></p>
            <p>Your trusted shopping destination</p>
            <p>Questions? Contact us at <a href="mailto:${supportEmail}" style="color: ${theme.primary};">${supportEmail}</a></p>
            <p>&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            ${customerEmail ? `<p style="font-size: 12px; margin-top: 15px;">This email was sent to ${customerEmail}</p>` : ''}
        </div>
    </div>
</body>
</html>`;
};

export default orderConfirmationEmail;
