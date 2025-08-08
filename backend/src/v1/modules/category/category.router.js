import express from 'express';
import verifyAdminOrModerator from '../../middlewares/verifyAdminOrModerator.js';
import createCategory from './createCategory.js';
import getCategories from './getCategories.js';
import { uploadSingle, handleMulterError } from '../../utils/multerConfig.js';

const categoryRouter = express.Router();

// Public routes
categoryRouter.get('/', getCategories);

// Protected routes (Admin/Moderator only)
categoryRouter.post(
  '/',
  verifyAdminOrModerator,
  uploadSingle('image'), // Handle single image upload with field name 'image'
  handleMulterError, // Handle multer-specific errors
  createCategory,
);

export default categoryRouter;
