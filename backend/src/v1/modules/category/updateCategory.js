import { z } from 'zod';
import Category from './Category.model.js';
import formatZodError from '../../utils/formatZodError.js';
import { uploadImage } from '../../utils/uploadImage.js';

// Validation schema for updating category (all fields optional)
const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(100, 'Category name must not exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .trim()
    .optional(),
  imageAlt: z
    .string()
    .min(1, 'Image alt text is required when image is provided')
    .trim()
    .optional(),
  parent: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent category ID format')
    .optional()
    .nullable(),
  isActive: z.boolean().optional(),
});

const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid category ID format',
      });
    }

    // Check if category exists and is not deleted
    const existingCategory = await Category.findOne({
      _id: id,
      isDeleted: { $ne: true },
    });

    if (!existingCategory) {
      return res.status(404).json({
        message: 'Category not found',
      });
    }

    // Validate request body
    const validatedData = updateCategorySchema.parse(req.body);
    const { name, description, imageAlt, parent, isActive } = validatedData;

    // Check if name already exists (excluding current category)
    if (name && name !== existingCategory.name) {
      const duplicateName = await Category.findOne({
        name,
        _id: { $ne: id },
        isDeleted: { $ne: true },
      });

      if (duplicateName) {
        return res.status(400).json({
          message: 'A category with this name already exists',
        });
      }
    }

    // Validate parent category if provided
    if (parent !== undefined) {
      if (parent === null) {
        // Setting parent to null (root category) is allowed
      } else if (parent === id) {
        return res.status(400).json({
          message: 'A category cannot be its own parent',
        });
      } else {
        // Check if parent category exists
        const parentCategory = await Category.findOne({
          _id: parent,
          isDeleted: { $ne: true },
        });

        if (!parentCategory) {
          return res.status(400).json({
            message: 'Parent category not found',
          });
        }

        // Check for circular reference (prevent category hierarchy loops)
        const checkCircularReference = async (parentId, targetId) => {
          if (parentId === targetId) return true;

          const parentCat = await Category.findById(parentId);
          if (parentCat && parentCat.parent) {
            return await checkCircularReference(
              parentCat.parent.toString(),
              targetId,
            );
          }
          return false;
        };

        const isCircular = await checkCircularReference(parent, id);
        if (isCircular) {
          return res.status(400).json({
            message:
              'Invalid parent category: This would create a circular reference',
          });
        }
      }
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parent !== undefined) updateData.parent = parent;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Handle image upload if a new image is provided
    if (req.file) {
      try {
        if (!imageAlt) {
          return res.status(400).json({
            message: 'Image alt text is required when uploading an image',
          });
        }

        const imageResult = await uploadImage(req.file, {
          alt: imageAlt,
          directory: 'categories',
        });

        updateData.image = {
          url: imageResult.url,
          filename: imageResult.filename,
          alt: imageAlt,
        };

        console.log('Image uploaded for category update:', imageResult);
      } catch (imageError) {
        console.error('Image upload error:', imageError);
        return res.status(400).json({
          message: 'Image upload failed',
          error: imageError.message,
        });
      }
    } else if (imageAlt && existingCategory.image) {
      // Update alt text only if no new image but alt text is provided
      updateData.image = {
        ...existingCategory.image,
        alt: imageAlt,
      };
    }

    console.log(
      'Updating category with data:',
      JSON.stringify(updateData, null, 2),
    );

    // Update the category
    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run mongoose validators
    }).populate('parent', 'name slug');

    res.status(200).json({
      message: 'Category updated successfully',
      category: updatedCategory,
    });
  } catch (error) {
    console.error('Category update error:', error);

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
        field,
        value: error.keyValue[field],
      });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Category validation failed',
        error: error.message,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value,
        })),
      });
    }

    // Handle cast errors (invalid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid data format',
        error: `Invalid ${error.path}: ${error.value}`,
      });
    }

    // Pass other errors to the error handling middleware
    next(error);
  }
};

export default updateCategory;
