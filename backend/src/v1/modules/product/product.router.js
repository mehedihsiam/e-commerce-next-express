import express from 'express';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';
import createProduct from './createProduct.js';
import updateProduct from './updateProduct.js';
import deleteProduct from './deleteProduct.js';
import toggleProductStatus from './toggleProductStatus.js';
import updateStock from './updateStock.js';
import getAllProductsAdmin from './getAllProductsAdmin.js';
import getAllProductsPublic from './getAllProductsPublic.js';
import getProductPublic from './getProductPublic.js';
import getProductAdmin from './getProductAdmin.js';
import getFeaturedProducts from './getFeaturedProducts.js';
import getRelatedProducts from './getRelatedProducts.js';
import uploadImages from './uploadImages.js';
import { uploadMultiple, handleMulterError } from '../../utils/multerConfig.js';

const productRouter = express.Router();

// Public: Get products for customers (no auth required)
productRouter.get('/', getAllProductsPublic);

// Public: Get featured products (no auth required)
productRouter.get('/featured', getFeaturedProducts);

// Public: Get single product details (no auth required)
productRouter.get('/:slug', getProductPublic);

// Public: Get related products (no auth required)
productRouter.get('/:id/related', getRelatedProducts);

// Admin: Get all products with filtering, sorting, and pagination
productRouter.get('/private/list', verifyAdminOrModerator, getAllProductsAdmin);

// Admin: Get single product details with full analytics
productRouter.get('/private/:id', verifyAdminOrModerator, getProductAdmin);

// Image upload endpoint (Step 1: Upload images first)
productRouter.post(
  '/upload-images',
  verifyAdminOrModerator,
  uploadMultiple('images', 5),
  handleMulterError,
  uploadImages,
);

// Product creation endpoint (Step 2: Create product with image URLs)
productRouter.post('/', verifyAdminOrModerator, createProduct);

// Product update endpoint
productRouter.put('/:id', verifyAdminOrModerator, updateProduct);

// Product delete endpoint (soft delete)
productRouter.delete('/:id', verifyAdminOrModerator, deleteProduct);

// Toggle product status (activate/deactivate)
productRouter.patch(
  '/:id/toggle-status',
  verifyAdminOrModerator,
  toggleProductStatus,
);

// Update product stock
productRouter.patch('/:id/stock', verifyAdminOrModerator, updateStock);

export default productRouter;
