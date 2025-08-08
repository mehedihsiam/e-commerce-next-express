import { z } from 'zod';
import Order from './Order.model.js';
import Cart from '../cart/Cart.model.js';
import Product from '../product/Product.model.js';
import Coupon from '../cupon/Cupon.model.js';
import User from '../user/User.model.js';
import formatZodError from '../../utils/formatZodError.js';
import sendEmail from '../../utils/sendEmail.js';
import orderConfirmationEmail from '../../emails/orderConfirmationEmail.js';

const shippingAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required').trim(),
  phone: z.string().min(1, 'Phone number is required').trim(),
  email: z.string().email().optional(),
  street: z.string().min(1, 'Street address is required').trim(),
  city: z.string().min(1, 'City is required').trim(),
  state: z.string().min(1, 'State is required').trim(),
  postalCode: z.string().min(1, 'Postal code is required').trim(),
  country: z.string().default('Bangladesh'),
  landmark: z.string().optional(),
  addressType: z.enum(['home', 'office', 'other']).default('home'),
});

// Schema for cart items when cart is managed locally (guest orders)
// SECURITY: No price fields - all prices fetched from database
const cartItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  variant: z
    .object({
      variantId: z.string().optional(),
      color: z.string().optional(),
      size: z.string().optional(),
      sku: z.string().optional(),
    })
    .optional(),
  // NO PRICE FIELDS - All pricing fetched from backend for security
});

const placeOrderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  sameAsBilling: z.boolean().default(true),
  paymentMethod: z.enum([
    'cash_on_delivery',
    'bkash',
    'nagad',
    'rocket',
    'bank_transfer',
    'card',
  ]),
  shippingMethod: z
    .enum(['standard', 'express', 'overnight', 'pickup'])
    .default('standard'),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  guestInfo: z
    .object({
      email: z.string().email(),
      phone: z.string().min(1),
    })
    .optional(),
  // Cart items for guest orders or when cart is managed locally
  cartItems: z.array(cartItemSchema).optional(),
});

const placeOrder = async (req, res) => {
  try {
    // Validate input
    const validationResult = placeOrderSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const {
      shippingAddress,
      billingAddress,
      sameAsBilling,
      paymentMethod,
      shippingMethod,
      couponCode,
      notes,
      guestInfo,
      cartItems,
    } = validationResult.data;

    const userId = req.user?.id;

    // For guest orders, validate guest info OR cartItems
    if (!userId && !guestInfo) {
      return res.status(400).json({
        message: 'Guest information is required for guest orders',
      });
    }

    // Handle cart items - either from database (registered user) or from request body (guest/local cart)
    let orderItems = [];
    let subtotal = 0;

    if (cartItems && cartItems.length > 0) {
      // Process cart items from request body (local cart or guest checkout)
      for (const cartItem of cartItems) {
        const product = await Product.findById(cartItem.productId).populate(
          'category',
        );

        if (!product || !product.isActive) {
          return res.status(400).json({
            message: `Product with ID "${cartItem.productId}" is no longer available`,
          });
        }

        // Get actual prices from database (SECURITY: Never trust client-side prices)
        let actualPrice = product.price;
        let actualDiscountPrice = product.discountPrice || product.price;
        let availableStock = product.stock;

        // If product has variants, get variant-specific pricing
        if (product.hasVariants && cartItem.variant?.variantId) {
          const variant = product.getVariantById(cartItem.variant.variantId);
          if (!variant || !variant.isActive) {
            return res.status(400).json({
              message: `Selected variant for "${product.name}" is no longer available`,
            });
          }
          availableStock = variant.stock;

          // Use variant pricing if available, otherwise use product pricing
          actualPrice = variant.price || product.price;
          actualDiscountPrice =
            variant.discountPrice ||
            variant.price ||
            product.discountPrice ||
            product.price;
        }

        // Check stock availability
        if (product.trackInventory && availableStock < cartItem.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Only ${availableStock} available`,
            availableStock,
            requestedQuantity: cartItem.quantity,
          });
        }

        // Calculate effective price (use discount price if available and valid)
        const effectivePrice =
          actualDiscountPrice < actualPrice ? actualDiscountPrice : actualPrice;

        // Create order item with actual database prices
        const orderItem = {
          product: product._id,
          quantity: cartItem.quantity,
          variant: cartItem.variant,
          price: actualPrice,
          discountPrice: actualDiscountPrice,
          effectivePrice,
          lineTotal: effectivePrice * cartItem.quantity,
          productSnapshot: {
            name: product.name,
            image: product.images?.[0]?.url || '',
            category: product.category?.name || '',
            slug: product.slug,
          },
        };

        orderItems.push(orderItem);
        subtotal += orderItem.lineTotal;
      }
    } else {
      // Get cart from database (registered users)
      if (!userId) {
        return res.status(400).json({
          message:
            'Cart items are required for guest orders or user must be logged in',
        });
      }

      const cart = await Cart.findOne({ user: userId }).populate(
        'items.product',
      );

      if (!cart || cart.isEmpty) {
        return res.status(400).json({
          message: 'Cart is empty',
        });
      }

      // Process cart items from database
      for (const cartItem of cart.items) {
        const product = cartItem.product;

        if (!product || !product.isActive) {
          return res.status(400).json({
            message: `Product "${cartItem.productSnapshot?.name}" is no longer available`,
          });
        }

        // Check stock
        let availableStock = product.stock;
        if (product.hasVariants && cartItem.variant?.variantId) {
          const variant = product.getVariantById(cartItem.variant.variantId);
          if (!variant || !variant.isActive) {
            return res.status(400).json({
              message: `Selected variant for "${product.name}" is no longer available`,
            });
          }
          availableStock = variant.stock;
        }

        if (product.trackInventory && availableStock < cartItem.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for "${product.name}". Only ${availableStock} available`,
            availableStock,
            requestedQuantity: cartItem.quantity,
          });
        }

        // Create order item
        const orderItem = {
          product: product._id,
          quantity: cartItem.quantity,
          variant: cartItem.variant,
          price: cartItem.price,
          discountPrice: cartItem.discountPrice,
          effectivePrice: cartItem.effectivePrice,
          lineTotal: cartItem.effectivePrice * cartItem.quantity,
          productSnapshot: {
            name: product.name,
            image: cartItem.productSnapshot?.image || product.images?.[0]?.url,
            category:
              product.category?.name || cartItem.productSnapshot?.category,
            slug: product.slug,
          },
        };

        orderItems.push(orderItem);
        subtotal += orderItem.lineTotal;
      }
    }

    // Validate that we have items to order
    if (orderItems.length === 0) {
      return res.status(400).json({
        message: 'No items to order',
      });
    }

    // Calculate shipping cost (BACKEND CONTROLLED - never trust client)
    const calculateShippingCost = (
      method,
      subtotal,
      country = 'Bangladesh',
    ) => {
      const shippingRates = {
        standard: {
          domestic: subtotal >= 500 ? 0 : 50, // Free shipping over 500
          international: 200,
        },
        express: {
          domestic: subtotal >= 1000 ? 50 : 100, // Discounted express for high orders
          international: 400,
        },
        overnight: {
          domestic: 150,
          international: 600,
        },
        pickup: {
          domestic: 0,
          international: 0,
        },
      };

      const isInternational = country !== 'Bangladesh';
      return (
        shippingRates[method]?.[
          isInternational ? 'international' : 'domestic'
        ] || 50
      );
    };

    const shippingCost = calculateShippingCost(
      shippingMethod,
      subtotal,
      shippingAddress.country,
    );

    // Calculate tax (BACKEND CONTROLLED)
    const calculateTax = (subtotal, country = 'Bangladesh', state = '') => {
      const taxRates = {
        Bangladesh: {
          default: 0.05, // 5% VAT
          Dhaka: 0.05,
          Chittagong: 0.05,
          Sylhet: 0.03,
          Khulna: 0.03,
        },
        // Add other countries if needed
      };

      const countryRates = taxRates[country];
      if (!countryRates) return 0;

      const rate = countryRates[state] || countryRates.default || 0;
      return subtotal * rate;
    };

    const tax = calculateTax(
      subtotal,
      shippingAddress.country,
      shippingAddress.state,
    );

    // Initialize pricing with backend-controlled values
    let pricing = {
      subtotal,
      itemDiscount: 0,
      couponDiscount: 0,
      shippingCost,
      tax,
      total: 0,
    };

    // Calculate item-level discounts (from product discount prices)
    orderItems.forEach(item => {
      if (item.discountPrice < item.price) {
        const itemDiscount = (item.price - item.discountPrice) * item.quantity;
        pricing.itemDiscount += itemDiscount;
      }
    });

    // Apply coupon if provided
    let appliedCoupon = null;
    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });

      if (!coupon) {
        return res.status(400).json({
          message: 'Invalid coupon code',
        });
      }

      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return res.status(400).json({
          message: 'Coupon has expired',
        });
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        return res.status(400).json({
          message: 'Coupon usage limit exceeded',
        });
      }

      if (subtotal < coupon.minPurchase) {
        return res.status(400).json({
          message: `Minimum purchase amount for this coupon is $${coupon.minPurchase}`,
        });
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discountType === 'percent') {
        discount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount > 0) {
          discount = Math.min(discount, coupon.maxDiscount);
        }
      } else {
        discount = coupon.discountValue;
      }

      pricing.couponDiscount = discount;
      appliedCoupon = {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        appliedDiscount: discount,
      };

      // Update coupon usage
      coupon.usageCount += 1;
      await coupon.save();
    }

    // Calculate total
    pricing.total =
      pricing.subtotal -
      pricing.itemDiscount -
      pricing.couponDiscount +
      pricing.shippingCost +
      pricing.tax;

    // SECURITY: Validate pricing to prevent manipulation
    const validatePricing = (calculatedPricing, items) => {
      let recalculatedSubtotal = 0;

      items.forEach(item => {
        // Recalculate to ensure no manipulation
        const itemTotal = item.effectivePrice * item.quantity;
        recalculatedSubtotal += itemTotal;

        // Validate effective price matches our calculation
        const expectedEffectivePrice =
          item.discountPrice < item.price ? item.discountPrice : item.price;
        if (Math.abs(item.effectivePrice - expectedEffectivePrice) > 0.01) {
          throw new Error(
            `Price validation failed for product: ${item.productSnapshot.name}`,
          );
        }
      });

      if (Math.abs(recalculatedSubtotal - calculatedPricing.subtotal) > 0.01) {
        throw new Error(
          'Subtotal validation failed - possible price manipulation detected',
        );
      }

      // Validate minimum order amount
      if (calculatedPricing.total < 0) {
        throw new Error('Invalid order total - total cannot be negative');
      }

      return true;
    };

    // Validate pricing before creating order
    validatePricing(pricing, orderItems);

    // Generate unique order number
    const generateOrderNumber = () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, '0');

      return `ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    };

    // Create order
    const orderData = {
      orderNumber: generateOrderNumber(), // Generate order number here
      user: userId || undefined,
      guestEmail: guestInfo?.email,
      guestPhone: guestInfo?.phone,
      customerType: userId ? 'registered' : 'guest',
      items: orderItems,
      shippingAddress,
      billingAddress: sameAsBilling ? shippingAddress : billingAddress,
      sameAsBilling,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      },
      pricing,
      coupon: appliedCoupon,
      shipping: {
        method: shippingMethod,
        cost: shippingCost,
        estimatedDelivery: calculateEstimatedDelivery(shippingMethod),
      },
      notes,
      source: 'web',
      sessionId: req.sessionID,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    };

    const order = new Order(orderData);
    await order.save();

    console.log(`✅ New order created with order number: ${order.orderNumber}`);
    console.log(`💰 Order total: $${order.pricing.total}`);

    // Update product stock
    for (const orderItem of orderItems) {
      const product = await Product.findById(orderItem.product);
      if (product && product.trackInventory) {
        if (product.hasVariants && orderItem.variant?.variantId) {
          const variant = product.getVariantById(orderItem.variant.variantId);
          if (variant) {
            variant.stock -= orderItem.quantity;
          }
        } else {
          product.stock -= orderItem.quantity;
        }
        await product.save();
      }
    }

    // Mark cart as converted and clear it (only for database carts)
    if (userId && !cartItems) {
      // Only clear database cart if we used database cart (not local cart)
      const cart = await Cart.findOne({ user: userId });
      if (cart) {
        await cart.markAsConverted();
        await cart.clearCart();
      }
    }

    // Populate order for response
    await order.populate([
      {
        path: 'items.product',
        select: 'name slug images category',
      },
    ]);

    // Send order confirmation email
    try {
      let customerEmail = guestInfo?.email;
      const customerName = shippingAddress.fullName;

      // If it's a registered user, get email from user account
      if (userId) {
        const user = await User.findById(userId).select('email');
        customerEmail = user?.email;
      }

      if (customerEmail) {
        const emailHtml = orderConfirmationEmail({
          order,
          customerName,
          customerEmail,
          companyName: process.env.COMPANY_NAME || 'E-Commerce Express',
          logoUrl: process.env.LOGO_URL || '',
          websiteUrl: process.env.WEBSITE_URL || 'http://localhost:3000',
          supportEmail:
            process.env.SUPPORT_EMAIL || 'support@ecommerce-express.com',
          trackingUrl:
            process.env.TRACKING_URL || 'http://localhost:3000/orders',
        });

        await sendEmail({
          to: customerEmail,
          subject: `Order Confirmation - ${order.orderNumber}`,
          html: emailHtml,
        });

        console.log(`Order confirmation email sent to: ${customerEmail}`);
      }
    } catch (emailError) {
      // Log the error but don't fail the order placement
      console.error('Failed to send order confirmation email:', emailError);
    }

    res.status(201).json({
      message: 'Order placed successfully',
      data: {
        order,
        orderNumber: order.orderNumber,
        estimatedDelivery: order.shipping.estimatedDelivery,
      },
    });
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Helper function to calculate estimated delivery
const calculateEstimatedDelivery = shippingMethod => {
  const deliveryDays = {
    standard: 5,
    express: 3,
    overnight: 1,
    pickup: 0,
  };

  const days = deliveryDays[shippingMethod] || 5;
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + days);

  return estimatedDate;
};

export default placeOrder;
