import { z } from 'zod';
import Product from './Product.model.js';
import Category from '../category/Category.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for product update (all fields optional except where needed)
const updateProductSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(200, 'Product name must not exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional(),
    // Handle pre-uploaded images with URLs and alt texts
    images: z
      .array(
        z.object({
          url: z.string(),
          alt: z.string().min(1, 'Alt text is required').trim(),
          filename: z.string().optional(),
        }),
      )
      .max(5, 'Maximum 5 images allowed')
      .optional(),
    price: z
      .number()
      .positive('Price must be a positive number')
      .min(0.01, 'Price must be at least 0.01')
      .optional(),
    discountPrice: z
      .number()
      .positive('Discount price must be a positive number')
      .optional(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .optional(),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
      .optional(),
    tags: z.array(z.string().trim()).optional(),

    // Enhanced variants validation
    variants: z
      .array(
        z.object({
          _id: z.string().optional(), // For updating existing variants
          color: z.string().trim().toLowerCase().optional(),
          size: z.string().trim().toUpperCase().optional(),
          stock: z
            .number()
            .int('Variant stock must be an integer')
            .min(0, 'Variant stock cannot be negative')
            .default(0),
          price: z
            .number()
            .positive('Variant price must be a positive number')
            .optional(),
          discountPrice: z
            .number()
            .positive('Variant discount price must be a positive number')
            .optional(),
          images: z
            .array(
              z.object({
                url: z.string(),
                alt: z.string().trim(),
                filename: z.string().optional(),
              }),
            )
            .optional()
            .default([]),
          weight: z.number().positive().optional(),
          dimensions: z
            .object({
              length: z.number().positive().optional(),
              width: z.number().positive().optional(),
              height: z.number().positive().optional(),
            })
            .optional(),
          isActive: z.boolean().optional().default(true),
          sku: z.string().trim().optional(),
        }),
      )
      .optional(),

    // Product configuration fields
    hasVariants: z.boolean().optional(),
    variationType: z
      .enum(['none', 'color', 'size', 'color_size', 'custom'])
      .optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),

    // SEO fields
    metaTitle: z.string().max(60, 'Meta title too long').optional(),
    metaDescription: z
      .string()
      .max(160, 'Meta description too long')
      .optional(),

    // Inventory fields
    lowStockThreshold: z.number().int().min(0).optional(),
    trackInventory: z.boolean().optional(),
  })
  .refine(
    data => {
      // Validate discount price is less than regular price (if both provided)
      if (
        data.discountPrice &&
        data.price &&
        data.discountPrice >= data.price
      ) {
        return false;
      }
      return true;
    },
    {
      message: 'Discount price must be less than regular price',
      path: ['discountPrice'],
    },
  )
  .refine(
    data => {
      // Validate variant discount prices
      if (data.variants && data.variants.length > 0) {
        for (const variant of data.variants) {
          if (
            variant.discountPrice &&
            variant.price &&
            variant.discountPrice >= variant.price
          ) {
            return false;
          }
        }
      }
      return true;
    },
    {
      message: 'Variant discount price must be less than variant price',
      path: ['variants'],
    },
  );

const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: 'Invalid product ID format',
      });
    }

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return res.status(404).json({
        message: 'Product not found',
      });
    }

    // Validate request body
    const validatedData = updateProductSchema.parse(req.body);
    const {
      name,
      description,
      images,
      price,
      discountPrice,
      stock,
      category,
      tags,
      variants,
      hasVariants,
      variationType,
      isFeatured,
      isActive,
      metaTitle,
      metaDescription,
      lowStockThreshold,
      trackInventory,
    } = validatedData;

    // Check if category exists (if provided)
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          message: 'Invalid category ID. Category does not exist.',
        });
      }
    }

    // Check if name already exists (excluding current product)
    if (name) {
      const duplicateName = await Product.findOne({
        name,
        _id: { $ne: id },
      });
      if (duplicateName) {
        return res.status(400).json({
          message: 'A product with this name already exists',
        });
      }
    }

    // Handle variants update logic
    if (variants !== undefined) {
      // Check for duplicate combinations in the new variants
      const combinations = new Set();
      for (const variant of variants) {
        const combination = `${variant.color || 'none'}-${variant.size || 'none'}`;
        if (combinations.has(combination)) {
          return res.status(400).json({
            message: 'Duplicate variant combination found',
            error: `Combination ${combination} appears multiple times`,
          });
        }
        combinations.add(combination);
      }

      // Validate variant images
      for (const variant of variants) {
        if (variant.images && variant.images.length > 0) {
          for (const image of variant.images) {
            if (!image.url.startsWith('/uploads/products/')) {
              return res.status(400).json({
                message: 'Invalid variant image URL',
                error: `Variant image URL must be from the products upload directory: ${image.url}`,
              });
            }
          }
        }
      }
    }

    // Validate main product images
    if (images && images.length > 0) {
      for (const image of images) {
        if (!image.url.startsWith('/uploads/products/')) {
          return res.status(400).json({
            message: 'Invalid image URL',
            error: `Image URL must be from the products upload directory: ${image.url}`,
          });
        }
      }
    }

    // Prepare update data (only include provided fields)
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (price !== undefined) updateData.price = price;
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice;
    if (stock !== undefined) updateData.stock = stock;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (variants !== undefined) updateData.variants = variants;
    if (hasVariants !== undefined) updateData.hasVariants = hasVariants;
    if (variationType !== undefined) updateData.variationType = variationType;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined)
      updateData.metaDescription = metaDescription;
    if (lowStockThreshold !== undefined)
      updateData.lowStockThreshold = lowStockThreshold;
    if (trackInventory !== undefined)
      updateData.trackInventory = trackInventory;

    // Auto-set hasVariants if variants are provided
    if (variants !== undefined) {
      updateData.hasVariants = variants.length > 0;
    }

    console.log(
      'Updating product with data:',
      JSON.stringify(updateData, null, 2),
    );

    // Update the product
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run mongoose validators
    });

    // Populate category information before returning
    await updatedProduct.populate('category', 'name slug');

    res.status(200).json({
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    console.error('Product update error:', error);

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
        message: `A product with this ${field} already exists`,
        field,
        value: error.keyValue[field],
      });
    }

    // Handle mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Product validation failed',
        error: error.message,
        details: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message,
          value: error.errors[key].value,
        })),
      });
    }

    // Handle MongoDB errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error',
        error: error.message,
        code: error.code,
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

export default updateProduct;
