import Product from './Product.model.js';

const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // TODO: Add business logic checks before deletion
    // - Check if product has pending orders
    // - Check if product is in active carts
    // - Archive instead of hard delete for audit purposes

    // For now, perform soft delete by setting isActive to false
    // You can change this to hard delete if needed
    const deletedProduct = await Product.findByIdAndUpdate(
      id,
      {
        isActive: false,
        deletedAt: new Date(),
        name: `${product.name} (Deleted)`, // Mark as deleted
      },
      { new: true },
    );

    console.log(`Product deleted: ${product.name} (ID: ${id})`);

    res.status(200).json({
      message: 'Product deleted successfully',
      product: {
        _id: deletedProduct._id,
        name: deletedProduct.name,
        isActive: deletedProduct.isActive,
        deletedAt: deletedProduct.deletedAt,
      },
    });
  } catch (error) {
    console.error('Delete product error:', error);

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error during deletion',
        error: error.message,
      });
    }

    next(error);
  }
};

export default deleteProduct;
