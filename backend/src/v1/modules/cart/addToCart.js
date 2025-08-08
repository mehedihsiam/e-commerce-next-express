import { z } from 'zod';
import Cart from './Cart.model.js';
import Product from '../product/Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  variantId: z.string().optional(),
  variant: z
    .object({
      color: z.string().optional(),
      size: z.string().optional(),
    })
    .optional(),
});

const addToCart = async (req, res) => {
  try {
    // Validate input
    const validationResult = addToCartSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { productId, quantity, variantId, variant } = validationResult.data;
    const userId = req.user.id;

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        message: 'Product is not available',
      });
    }

    // Handle variant validation and stock check
    let selectedVariant = null;
    let availableStock = product.stock;
    let productPrice = product.price;
    let discountPrice = product.discountPrice;
    let variantData = {};

    if (product.hasVariants) {
      if (!variantId && !variant?.color && !variant?.size) {
        return res.status(400).json({
          message: 'This product requires variant selection (color/size)',
        });
      }

      // Find variant by ID or color/size combination
      if (variantId) {
        selectedVariant = product.getVariantById(variantId);
      } else if (variant) {
        selectedVariant = product.variants.find(
          v =>
            v.isActive &&
            (!variant.color || v.color === variant.color.toLowerCase()) &&
            (!variant.size || v.size === variant.size.toUpperCase()),
        );
      }

      if (!selectedVariant) {
        return res.status(400).json({
          message: 'Selected variant is not available',
        });
      }

      if (!selectedVariant.isActive) {
        return res.status(400).json({
          message: 'Selected variant is not active',
        });
      }

      availableStock = selectedVariant.stock;
      productPrice = selectedVariant.price || product.price;
      discountPrice = selectedVariant.discountPrice || product.discountPrice;

      variantData = {
        variantId: selectedVariant._id,
        color: selectedVariant.color,
        size: selectedVariant.size,
        sku: selectedVariant.sku,
      };
    }

    // Check stock availability
    if (product.trackInventory && availableStock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${availableStock} items available`,
      });
    }

    // Find or create cart for user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => {
      const productMatch = item.product.toString() === productId;
      if (!product.hasVariants) return productMatch;

      return (
        productMatch &&
        (!variantId || item.variant.variantId?.toString() === variantId) &&
        (!variant?.color ||
          item.variant.color === variant.color.toLowerCase()) &&
        (!variant?.size || item.variant.size === variant.size.toUpperCase())
      );
    });

    if (existingItemIndex > -1) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;

      // Check stock for updated quantity
      if (product.trackInventory && availableStock < newQuantity) {
        return res.status(400).json({
          message: `Cannot add ${quantity} more items. Only ${availableStock - existingItem.quantity} more available`,
        });
      }

      existingItem.quantity = newQuantity;
      existingItem.price = productPrice;
      existingItem.discountPrice = discountPrice;
      existingItem.effectivePrice = discountPrice || productPrice;
      existingItem.updatedAt = new Date();
    } else {
      // Add new item to cart
      const productSnapshot = {
        name: product.name,
        image: product.images?.[0]?.url || selectedVariant?.images?.[0]?.url,
        category: product.category?.name || 'Unknown',
      };

      cart.items.push({
        product: productId,
        quantity,
        variant: variantData,
        price: productPrice,
        discountPrice,
        effectivePrice: discountPrice || productPrice,
        productSnapshot,
      });
    }

    await cart.save();

    // Populate the cart for response
    await cart.populate([
      {
        path: 'items.product',
        select:
          'name slug images price discountPrice isActive hasVariants variants',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      },
    ]);

    res.status(200).json({
      message: 'Item added to cart successfully',
      data: {
        cart,
        addedItem: {
          productId,
          quantity,
          variant: variantData,
          price: productPrice,
          discountPrice,
          effectivePrice: discountPrice || productPrice,
        },
      },
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default addToCart;
