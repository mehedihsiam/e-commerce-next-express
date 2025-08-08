import Cart from './Cart.model.js';

const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        message: 'Cart not found',
      });
    }

    // Store cart summary before clearing
    const clearedSummary = {
      itemsRemoved: cart.items.length,
      totalQuantity: cart.totalItems,
      totalValue: cart.totals.finalTotal,
    };

    // Clear all items
    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: 'Cart cleared successfully',
      data: {
        cart,
        clearedSummary,
      },
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default clearCart;
