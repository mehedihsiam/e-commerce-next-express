import Cart from './Cart.model.js';

const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's cart
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(200).json({
        message: 'Cart summary retrieved successfully',
        data: {
          summary: {
            totalItems: 0,
            itemCount: 0,
            subtotal: 0,
            totalDiscount: 0,
            finalTotal: 0,
            isEmpty: true,
            cartAge: 0,
          },
        },
      });
    }

    // Calculate summary
    const summary = {
      totalItems: cart.totalItems,
      itemCount: cart.totals.itemCount,
      subtotal: cart.totals.subtotal,
      totalDiscount: cart.totals.totalDiscount,
      finalTotal: cart.totals.finalTotal,
      isEmpty: cart.isEmpty,
      cartAge: cart.ageInDays,
      lastActivity: cart.lastActivity,
      itemDetails: cart.items.map(item => ({
        productId: item.product,
        productName: item.productSnapshot?.name,
        quantity: item.quantity,
        price: item.price,
        discountPrice: item.discountPrice,
        effectivePrice: item.effectivePrice,
        lineTotal: item.effectivePrice * item.quantity,
        variant: item.variant,
      })),
    };

    res.status(200).json({
      message: 'Cart summary retrieved successfully',
      data: {
        summary,
      },
    });
  } catch (error) {
    console.error('Get cart summary error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getCartSummary;
