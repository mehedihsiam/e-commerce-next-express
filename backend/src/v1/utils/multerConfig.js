import multer from 'multer';
import { UPLOAD_CONFIG } from './uploadImage.js';

/**
 * Create multer configuration for memory storage
 * This stores files in memory as Buffer objects, which we can then
 * process with our uploadImage utility
 */
const createMulterConfig = (options = {}) => {
  const {
    maxSize = UPLOAD_CONFIG.local.maxSize,
    allowedTypes = UPLOAD_CONFIG.local.allowedTypes,
  } = options;

  // Memory storage - files will be available as req.file.buffer
  const storage = multer.memoryStorage();

  // File filter function
  const fileFilter = (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        ),
        false,
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxSize,
    },
  });
};

/**
 * Single image upload middleware
 * Usage: uploadSingle('image')
 */
const uploadSingle = (fieldName = 'image', options = {}) => {
  const upload = createMulterConfig(options);
  return upload.single(fieldName);
};

/**
 * Multiple images upload middleware
 * Usage: uploadMultiple('images', 5)
 */
const uploadMultiple = (fieldName = 'images', maxCount = 5, options = {}) => {
  const upload = createMulterConfig(options);
  return upload.array(fieldName, maxCount);
};

/**
 * Mixed fields upload middleware
 * Usage: uploadFields([{ name: 'image', maxCount: 1 }, { name: 'gallery', maxCount: 5 }])
 */
const uploadFields = (fields, options = {}) => {
  const upload = createMulterConfig(options);
  return upload.fields(fields);
};

/**
 * Error handler for multer errors
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large',
        error: `Maximum file size is ${UPLOAD_CONFIG.local.maxSize / (1024 * 1024)}MB`,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files',
        error: error.message,
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        message: 'Unexpected file field',
        error: error.message,
      });
    }
  }

  if (
    error.message.includes('File type') &&
    error.message.includes('is not allowed')
  ) {
    return res.status(400).json({
      message: 'Invalid file type',
      error: error.message,
    });
  }

  next(error);
};

export {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleMulterError,
  createMulterConfig,
};
