import express from 'express';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';
import createProduct from './createProduct.js';
import updateProduct from './updateProduct.js';
import getAllProductsAdmin from './getAllProductsAdmin.js';
import getAllProductsPublic from './getAllProductsPublic.js';
import getProductPublic from './getProductPublic.js';
import getProductAdmin from './getProductAdmin.js';
import uploadImages from './uploadImages.js';
import { uploadMultiple, handleMulterError } from '../../utils/multerConfig.js';

const productRouter = express.Router();

// Public: Get products for customers (no auth required)
productRouter.get('/', getAllProductsPublic);

// Public: Get single product details (no auth required)
productRouter.get('/:slug', getProductPublic);

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

export default productRouter;
