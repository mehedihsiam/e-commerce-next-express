import Cart from './Cart.model.js';

const removeFromCart = async (req, res) => {
  try {
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

    // Store item info for response
    const removedItem = {
      itemId,
      productId: cartItem.product,
      productName: cartItem.productSnapshot?.name,
      quantity: cartItem.quantity,
      variant: cartItem.variant,
    };

    // Remove item from cart
    cart.items.pull(itemId);
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
      message: 'Item removed from cart successfully',
      data: {
        cart,
        removedItem,
      },
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default removeFromCart;
