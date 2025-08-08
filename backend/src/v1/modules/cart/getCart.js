import Cart from './Cart.model.js';

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user's cart
    let cart = await Cart.findOne({ user: userId }).populate([
      {
        path: 'items.product',
        select:
          'name slug images price discountPrice isActive hasVariants variants stock trackInventory',
        populate: {
          path: 'category',
          select: 'name slug',
        },
      },
    ]);

    // Create empty cart if doesn't exist
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Validate cart items and check for issues
    const validationIssues = [];
    const updatedItems = [];

    for (const item of cart.items) {
      const product = item.product;

      // Check if product still exists and is active
      if (!product || !product.isActive) {
        validationIssues.push({
          itemId: item._id,
          issue: 'product_unavailable',
          message: `Product "${item.productSnapshot?.name || 'Unknown'}" is no longer available`,
          action: 'removed',
        });
        continue;
      }

      let availableStock = product.stock;
      let currentPrice = product.price;
      let currentDiscountPrice = product.discountPrice;
      let stockIssue = false;
      let priceChanged = false;

      // Handle variant products
      if (product.hasVariants && item.variant?.variantId) {
        const variant = product.getVariantById(item.variant.variantId);

        if (!variant || !variant.isActive) {
          validationIssues.push({
            itemId: item._id,
            issue: 'variant_unavailable',
            message: `Selected variant for "${product.name}" is no longer available`,
            action: 'removed',
          });
          continue;
        }

        availableStock = variant.stock;
        currentPrice = variant.price || product.price;
        currentDiscountPrice = variant.discountPrice || product.discountPrice;
      }

      // Check stock availability
      if (product.trackInventory && availableStock < item.quantity) {
        if (availableStock === 0) {
          validationIssues.push({
            itemId: item._id,
            issue: 'out_of_stock',
            message: `"${product.name}" is out of stock`,
            action: 'removed',
          });
          continue;
        } else {
          stockIssue = true;
          validationIssues.push({
            itemId: item._id,
            issue: 'insufficient_stock',
            message: `Only ${availableStock} of "${product.name}" available. Quantity adjusted from ${item.quantity} to ${availableStock}`,
            action: 'quantity_adjusted',
            newQuantity: availableStock,
          });
        }
      }

      // Check price changes
      const currentEffectivePrice = currentDiscountPrice || currentPrice;
      if (item.effectivePrice !== currentEffectivePrice) {
        priceChanged = true;
        validationIssues.push({
          itemId: item._id,
          issue: 'price_changed',
          message: `Price for "${product.name}" has changed from $${item.effectivePrice} to $${currentEffectivePrice}`,
          action: 'price_updated',
          oldPrice: item.effectivePrice,
          newPrice: currentEffectivePrice,
        });
      }

      // Update item if needed
      const updatedItem = { ...item.toObject() };

      if (stockIssue) {
        updatedItem.quantity = availableStock;
      }

      if (priceChanged) {
        updatedItem.price = currentPrice;
        updatedItem.discountPrice = currentDiscountPrice;
        updatedItem.effectivePrice = currentEffectivePrice;
      }

      updatedItems.push(updatedItem);
    }

    // Update cart if there were changes
    if (validationIssues.length > 0) {
      cart.items = updatedItems;
      await cart.save();

      // Re-populate after update
      cart = await Cart.findOne({ user: userId }).populate([
        {
          path: 'items.product',
          select:
            'name slug images price discountPrice isActive hasVariants variants stock trackInventory',
          populate: {
            path: 'category',
            select: 'name slug',
          },
        },
      ]);
    }

    // Calculate cart summary
    const summary = {
      totalItems: cart.totalItems,
      isEmpty: cart.isEmpty,
      subtotal: cart.totals.subtotal,
      totalDiscount: cart.totals.totalDiscount,
      finalTotal: cart.totals.finalTotal,
      itemCount: cart.totals.itemCount,
      hasIssues: validationIssues.length > 0,
    };

    res.status(200).json({
      message: 'Cart retrieved successfully',
      data: {
        cart,
        summary,
        validationIssues:
          validationIssues.length > 0 ? validationIssues : undefined,
      },
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

export default getCart;
