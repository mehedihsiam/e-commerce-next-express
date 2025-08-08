import { z } from 'zod';
import Category from './Category.model.js';
import formatZodError from '../../utils/formatZodError.js';
import { uploadImage } from '../../utils/uploadImage.js';

// Validation schema for category creation
const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .trim()
    .optional(),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID format')
    .optional()
    .nullable(),
});

const createCategory = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = createCategorySchema.parse(req.body);
    const { name, description, parent } = validatedData;

    // Check if parent category exists (if provided)
    if (parent) {
      const parentCategory = await Category.findById(parent);
      if (!parentCategory) {
        return res.status(400).json({
          message:
            'Invalid parent category ID. Parent category does not exist.',
        });
      }
    }

    // Check if category with the same name already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        message: 'A category with this name already exists',
      });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .trim()
      .replace(/\s+/g, '-'); // Replace spaces with hyphens

    // Check if slug already exists
    const existingSlug = await Category.findOne({ slug });
    if (existingSlug) {
      return res.status(400).json({
        message: 'A category with this slug already exists',
      });
    }

    // Handle image upload if file is provided
    let imageData = null;
    if (req.file) {
      const uploadResult = await uploadImage(req.file, {
        folder: 'categories',
        prefix: 'category',
        storage: 'local', // Can be changed to 'cloudinary' or 'gcs' in the future
      });

      if (!uploadResult.success) {
        return res.status(400).json({
          message: 'Image upload failed',
          errors: uploadResult.errors,
        });
      }

      imageData = {
        url: uploadResult.url,
        filename: uploadResult.filename,
        alt: `${name} category image`,
      };
    }

    // Create new category
    const categoryData = {
      name,
      slug,
      parent: parent || null,
    };

    // Add optional fields if provided
    if (description) {
      categoryData.description = description;
    }

    if (imageData) {
      categoryData.image = imageData;
    }

    const newCategory = new Category(categoryData);
    await newCategory.save();

    // Populate parent information before returning
    await newCategory.populate('parent', 'name slug');

    res.status(201).json({
      message: 'Category created successfully',
      category: newCategory,
    });
  } catch (error) {
    // Handle Zod validation errors
    const zodErrors = formatZodError(error);
    if (zodErrors) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: zodErrors,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        message: `A category with this ${field} already exists`,
      });
    }

    // Pass other errors to the error handling middleware
    next(error);
  }
};

export default createCategory;
