import { z } from 'zod';
import Product from './Product.model.js';
import Category from '../category/Category.model.js';
import formatZodError from '../../utils/formatZodError.js';

// Validation schema for product creation
const createProductSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Product name is required')
      .max(200, 'Product name must not exceed 200 characters')
      .trim(),
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
          filename: z.string().optional(), // Optional filename from upload
        }),
      )
      .max(5, 'Maximum 5 images allowed')
      .optional()
      .default([]),
    price: z
      .number()
      .positive('Price must be a positive number')
      .min(0.01, 'Price must be at least 0.01'),
    discountPrice: z
      .number()
      .positive('Discount price must be a positive number')
      .optional(),
    stock: z
      .number()
      .int('Stock must be an integer')
      .min(0, 'Stock cannot be negative')
      .default(0),
    category: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
      .optional(),
    tags: z.array(z.string().trim()).optional().default([]),

    // Enhanced variants validation
    variants: z
      .array(
        z.object({
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
                url: z.string().url('Invalid variant image URL'),
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
      .optional()
      .default([]),

    // Product configuration fields
    hasVariants: z.boolean().optional().default(false),
    variationType: z
      .enum(['none', 'color', 'size', 'color_size', 'custom'])
      .optional()
      .default('none'),
    isFeatured: z.boolean().optional().default(false),
    isActive: z.boolean().optional().default(true),

    // SEO fields
    metaTitle: z.string().max(60, 'Meta title too long').optional(),
    metaDescription: z
      .string()
      .max(160, 'Meta description too long')
      .optional(),

    // Inventory fields
    lowStockThreshold: z.number().int().min(0).optional().default(5),
    trackInventory: z.boolean().optional().default(true),
  })
  .refine(
    data => {
      // Validate discount price is less than regular price
      if (data.discountPrice && data.discountPrice >= data.price) {
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
          const variantPrice = variant.price || data.price;
          if (variant.discountPrice && variant.discountPrice >= variantPrice) {
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

const createProduct = async (req, res, next) => {
  try {
    // Validate request body
    const validatedData = createProductSchema.parse(req.body);
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

    // Check if product with the same name already exists
    const existingProduct = await Product.findOne({ name });
    if (existingProduct) {
      return res.status(400).json({
        message: 'A product with this name already exists',
      });
    }

    // Additional validation for variants
    if (variants && variants.length > 0) {
      // Check for duplicate combinations
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
    }

    // Create new product with all validated data
    const productData = {
      name,
      description,
      images,
      price,
      discountPrice,
      stock,
      category: category || undefined, // Don't pass null, use undefined
      tags,
      variants,
      hasVariants: hasVariants || (variants && variants.length > 0),
      variationType,
      isFeatured,
      isActive,
      metaTitle,
      metaDescription,
      lowStockThreshold,
      trackInventory,
    };

    // Remove undefined values to prevent issues
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    console.log(
      'Creating product with data:',
      JSON.stringify(productData, null, 2),
    );

    const newProduct = new Product(productData);

    // Validate before saving
    const validationError = newProduct.validateSync();
    if (validationError) {
      console.error('Mongoose validation error:', validationError);
      return res.status(400).json({
        message: 'Product validation failed',
        error: validationError.message,
        details: Object.keys(validationError.errors).map(key => ({
          field: key,
          message: validationError.errors[key].message,
        })),
      });
    }

    await newProduct.save();

    // Populate category information before returning
    await newProduct.populate('category', 'name slug');

    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (error) {
    console.error('Product creation error:', error);

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

    // Handle MongoDB insertion errors
    if (error.name === 'MongoServerError' || error.name === 'MongoError') {
      return res.status(400).json({
        message: 'Database error',
        error: error.message,
        code: error.code,
      });
    }

    // Handle other MongoDB driver errors
    if (error.message && error.message.includes('BSONError')) {
      return res.status(400).json({
        message: 'Invalid data format',
        error: 'One or more fields contain invalid data format',
        details: error.message,
      });
    }

    // Pass other errors to the error handling middleware
    next(error);
  }
};

export default createProduct;
