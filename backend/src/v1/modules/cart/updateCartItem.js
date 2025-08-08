import { z } from 'zod';
import Cart from './Cart.model.js';
import Product from '../product/Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const updateCartItem = async (req, res) => {
  try {
    // Validate input
    const validationResult = updateCartItemSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: formatZodError(validationResult.error),
      });
    }

    const { quantity } = validationResult.data;
    const { itemId } = req.params;
    const userId = req.user.id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
      });
    }

    // Find the cart item
    const cartItem = cart.items.id(itemId);
    if (!cartItem) {
      return res.status(404).json({
        message: 'Item not found in cart',
      });
    }

    // Get product details to check stock
    const product = await Product.findById(cartItem.product);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    if (!product.isActive) {
      return res.status(400).json({
        message: 'Product is no longer available',
      });
    }

    // Check stock availability
    let availableStock = product.stock;

    if (product.hasVariants && cartItem.variant?.variantId) {
      const variant = product.getVariantById(cartItem.variant.variantId);
      if (!variant || !variant.isActive) {
        return res.status(400).json({
          message: 'Selected variant is no longer available',
        });
      }
      availableStock = variant.stock;
    }

    if (product.trackInventory && availableStock < quantity) {
      return res.status(400).json({
        message: `Insufficient stock. Only ${availableStock} items available`,
        availableStock,
      });
    }

    // Update item quantity
    cartItem.quantity = quantity;
    cartItem.updatedAt = new Date();

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
      message: 'Cart item updated successfully',
      data: {
        cart,
        updatedItem: {
          itemId,
          quantity,
          previousQuantity: cartItem.quantity,
        },
      },
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default updateCartItem;
