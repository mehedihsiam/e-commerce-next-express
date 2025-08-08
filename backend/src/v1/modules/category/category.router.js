import express from 'express';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';
import createCategory from './createCategory.js';
import updateCategory from './updateCategory.js';
import deleteCategory from './deleteCategory.js';
import restoreCategory from './restoreCategory.js';
import getCategories from './getCategories.js';
import getDeletedCategories from './getDeletedCategories.js';
import { uploadSingle, handleMulterError } from '../../utils/multerConfig.js';

const categoryRouter = express.Router();

// Public routes
categoryRouter.get('/', getCategories);

// Protected routes (Admin/Moderator only)
// Get deleted categories (for restoration)
categoryRouter.get('/deleted', verifyAdminOrModerator, getDeletedCategories);

// Create new category
categoryRouter.post(
  '/',
  verifyAdminOrModerator,
  uploadSingle('image'), // Handle single image upload with field name 'image'
  handleMulterError, // Handle multer-specific errors
  createCategory,
);

// Update existing category
categoryRouter.put(
  '/:id',
  verifyAdminOrModerator,
  uploadSingle('image'), // Handle optional image upload
  handleMulterError,
  updateCategory,
);

// Delete category (soft delete)
categoryRouter.delete('/:id', verifyAdminOrModerator, deleteCategory);

// Restore deleted category
categoryRouter.patch('/:id/restore', verifyAdminOrModerator, restoreCategory);

export default categoryRouter;
