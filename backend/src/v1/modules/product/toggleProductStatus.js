import Product from './Product.model.js';

const toggleProductStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Find product
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Toggle status
    const newStatus = !product.isActive;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true, runValidators: true },
    ).select('_id name isActive updatedAt');

    console.log(
      `Product status toggled: ${product.name} - ${newStatus ? 'Activated' : 'Deactivated'}`,
    );

    res.status(200).json({
      message: `Product ${newStatus ? 'activated' : 'deactivated'} successfully`,
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Toggle product status error:', error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    next(error);
  }
};

export default toggleProductStatus;
