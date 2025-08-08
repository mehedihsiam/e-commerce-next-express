import { z } from 'zod';
import Cart from './Cart.model.js';
import Product from '../product/Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

const validateCartSchema = z.object({
  includeDetails: z.boolean().default(false),
});

const validateCart = async (req, res) => {
  try {
    // Validate query parameters
    const validationResult = validateCartSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { includeDetails } = validationResult.data;
    const userId = req.user.id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId }).populate([
      {
        path: 'items.product',
        select:
          'name slug price discountPrice isActive hasVariants variants stock trackInventory',
      },
    ]);

    if (!cart || cart.isEmpty) {
      return res.status(200).json({
        message: 'Cart is empty',
        data: {
          isValid: true,
          isEmpty: true,
          issues: [],
        },
      });
    }

    const issues = [];
    const validItems = [];
    let hasErrors = false;

    // Validate each cart item
    for (const item of cart.items) {
      const itemIssues = [];
      const product = item.product;

      // Check if product exists and is active
      if (!product) {
        itemIssues.push({
          type: 'product_not_found',
          severity: 'error',
          message: 'Product no longer exists',
        });
        hasErrors = true;
      } else if (!product.isActive) {
        itemIssues.push({
          type: 'product_inactive',
          severity: 'error',
          message: 'Product is no longer available',
        });
        hasErrors = true;
      } else {
        let availableStock = product.stock;
        let currentPrice = product.price;
        let currentDiscountPrice = product.discountPrice;

        // Validate variant if applicable
        if (product.hasVariants) {
          if (!item.variant?.variantId) {
            itemIssues.push({
              type: 'variant_missing',
              severity: 'error',
              message: 'Variant selection required',
            });
            hasErrors = true;
          } else {
            const variant = product.getVariantById(item.variant.variantId);
            if (!variant) {
              itemIssues.push({
                type: 'variant_not_found',
                severity: 'error',
                message: 'Selected variant no longer exists',
              });
              hasErrors = true;
            } else if (!variant.isActive) {
              itemIssues.push({
                type: 'variant_inactive',
                severity: 'error',
                message: 'Selected variant is no longer available',
              });
              hasErrors = true;
            } else {
              availableStock = variant.stock;
              currentPrice = variant.price || product.price;
              currentDiscountPrice =
                variant.discountPrice || product.discountPrice;
            }
          }
        }

        // Check stock availability
        if (!hasErrors && product.trackInventory) {
          if (availableStock === 0) {
            itemIssues.push({
              type: 'out_of_stock',
              severity: 'error',
              message: 'Item is out of stock',
            });
            hasErrors = true;
          } else if (availableStock < item.quantity) {
            itemIssues.push({
              type: 'insufficient_stock',
              severity: 'warning',
              message: `Only ${availableStock} items available (requested: ${item.quantity})`,
              availableStock,
              requestedQuantity: item.quantity,
            });
          }
        }

        // Check price changes
        const currentEffectivePrice = currentDiscountPrice || currentPrice;
        if (item.effectivePrice !== currentEffectivePrice) {
          itemIssues.push({
            type: 'price_changed',
            severity: 'info',
            message: `Price has changed from $${item.effectivePrice} to $${currentEffectivePrice}`,
            oldPrice: item.effectivePrice,
            newPrice: currentEffectivePrice,
            priceIncrease: currentEffectivePrice > item.effectivePrice,
          });
        }

        // If no errors, item is valid
        if (!itemIssues.some(issue => issue.severity === 'error')) {
          validItems.push({
            itemId: item._id,
            productId: product._id,
            productName: product.name,
            quantity: item.quantity,
            availableStock,
            price: currentPrice,
            discountPrice: currentDiscountPrice,
            effectivePrice: currentEffectivePrice,
          });
        }
      }

      if (itemIssues.length > 0) {
        issues.push({
          itemId: item._id,
          productId: item.product?._id,
          productName: item.productSnapshot?.name || item.product?.name,
          quantity: item.quantity,
          variant: item.variant,
          issues: itemIssues,
        });
      }
    }

    // Calculate validation summary
    const totalItems = cart.items.length;
    const validItemsCount = validItems.length;
    const errorCount = issues.filter(item =>
      item.issues.some(issue => issue.severity === 'error'),
    ).length;
    const warningCount = issues.filter(item =>
      item.issues.some(issue => issue.severity === 'warning'),
    ).length;

    const isValid = !hasErrors;
    const needsAttention = issues.length > 0;

    const response = {
      message: 'Cart validation completed',
      data: {
        isValid,
        needsAttention,
        isEmpty: cart.isEmpty,
        summary: {
          totalItems,
          validItems: validItemsCount,
          itemsWithErrors: errorCount,
          itemsWithWarnings: warningCount,
          canProceedToCheckout: isValid && validItemsCount > 0,
        },
        issues: issues.length > 0 ? issues : undefined,
      },
    };

    // Include detailed valid items if requested
    if (includeDetails && validItems.length > 0) {
      response.data.validItems = validItems;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Validate cart error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default validateCart;
