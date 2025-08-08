import { z } from 'zod';
import Product from './Product.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for stock update
const stockUpdateSchema = z.object({
  action: z.enum(['set', 'increase', 'decrease'], {
    errorMap: () => ({ message: 'Action must be set, increase, or decrease' }),
  }),
  amount: z
    .number()
    .int('Amount must be an integer')
    .min(0, 'Amount cannot be negative'),
  variantId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid variant ID format')
    .optional(),
  reason: z.string().max(200, 'Reason too long').optional(),
});

const updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate product ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Validate request body
    const validatedData = stockUpdateSchema.parse(req.body);
    const { action, amount, variantId, reason } = validatedData;

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    let updateResult;

    if (variantId) {
      // Update variant stock
      const variant = product.variants.id(variantId);
      if (!variant) {
        return res.status(404).json({
          message: 'Variant not found',
        });
      }

      const currentStock = variant.stock || 0;
      let newStock;

      switch (action) {
        case 'set':
          newStock = amount;
          break;
        case 'increase':
          newStock = currentStock + amount;
          break;
        case 'decrease':
          newStock = Math.max(0, currentStock - amount);
          break;
      }

      // Update variant stock
      variant.stock = newStock;
      updateResult = await product.save();

      console.log(
        `Variant stock updated: ${product.name} - Variant ${variantId} - ${currentStock} → ${newStock}`,
      );

      res.status(200).json({
        message: 'Variant stock updated successfully',
        data: {
          productId: product._id,
          variantId,
          action,
          amount,
          previousStock: currentStock,
          newStock,
          reason: reason || null,
        },
      });
    } else {
      // Update main product stock
      const currentStock = product.stock || 0;
      let newStock;

      switch (action) {
        case 'set':
          newStock = amount;
          break;
        case 'increase':
          newStock = currentStock + amount;
          break;
        case 'decrease':
          newStock = Math.max(0, currentStock - amount);
          break;
      }

      updateResult = await Product.findByIdAndUpdate(
        id,
        { stock: newStock },
        { new: true, runValidators: true },
      );

      console.log(
        `Product stock updated: ${product.name} - ${currentStock} → ${newStock}`,
      );

      res.status(200).json({
        message: 'Product stock updated successfully',
        data: {
          productId: product._id,
          action,
          amount,
          previousStock: currentStock,
          newStock,
          reason: reason || null,
        },
      });
    }
  } catch (error) {
    console.error('Update stock error:', error);

    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodErrors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid ID format',
      });
    }

    next(error);
  }
};

export default updateStock;
