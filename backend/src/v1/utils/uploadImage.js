import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

/**
 * Image upload configuration
 */
const UPLOAD_CONFIG = {
  // Local storage configuration
  local: {
    baseDir: 'public/uploads',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
  },
  // Future: Cloudinary configuration
  cloudinary: {
    // Will be implemented later
  },
  // Future: Google Cloud Storage configuration
  gcs: {
    // Will be implemented later
  },
};

/**
 * Generate unique filename
 * @param {string} originalName - Original filename
 * @param {string} prefix - Prefix for the filename (e.g., 'category', 'product')
 * @returns {string} Unique filename
 */
const generateUniqueFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = path.extname(originalName).toLowerCase();
  const baseName = prefix ? `${prefix}_` : '';
  return `${baseName}${timestamp}_${random}${extension}`;
};

/**
 * Validate file type and size
 * @param {Object} file - File object with buffer, mimetype, originalname
 * @param {Object} config - Upload configuration
 * @returns {Object} Validation result
 */
const validateFile = (file, config = UPLOAD_CONFIG.local) => {
  const errors = [];

  // Check file size
  if (file.buffer && file.buffer.length > config.maxSize) {
    errors.push(`File size exceeds ${config.maxSize / (1024 * 1024)}MB limit`);
  }

  // Check MIME type
  if (!config.allowedTypes.includes(file.mimetype)) {
    errors.push(
      `File type ${file.mimetype} is not allowed. Allowed types: ${config.allowedTypes.join(', ')}`,
    );
  }

  // Check file extension
  const extension = path.extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(extension)) {
    errors.push(
      `File extension ${extension} is not allowed. Allowed extensions: ${config.allowedExtensions.join(', ')}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Upload image to local storage
 * @param {Object} file - File object with buffer, mimetype, originalname
 * @param {string} folder - Subfolder name (e.g., 'categories', 'products')
 * @param {string} prefix - Filename prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadToLocal = async (file, folder = 'general', prefix = '') => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
      };
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(
      process.cwd(),
      UPLOAD_CONFIG.local.baseDir,
      folder,
    );
    await mkdir(uploadDir, { recursive: true });

    // Generate unique filename
    const filename = generateUniqueFilename(file.originalname, prefix);
    const filePath = path.join(uploadDir, filename);

    // Write file to disk
    await writeFile(filePath, file.buffer);

    // Return relative URL path
    const relativePath = path
      .join('uploads', folder, filename)
      .replace(/\\/g, '/');

    return {
      success: true,
      filename,
      path: filePath,
      url: `/${relativePath}`,
      size: file.buffer.length,
      mimetype: file.mimetype,
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message],
    };
  }
};

/**
 * Upload image to Cloudinary (Future implementation)
 * @param {Object} file - File object
 * @param {string} folder - Folder name
 * @param {string} prefix - Filename prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadToCloudinary = async (file, folder = 'general', prefix = '') => {
  // TODO: Implement Cloudinary upload
  throw new Error('Cloudinary upload not implemented yet');
};

/**
 * Upload image to Google Cloud Storage (Future implementation)
 * @param {Object} file - File object
 * @param {string} folder - Folder name
 * @param {string} prefix - Filename prefix
 * @returns {Promise<Object>} Upload result
 */
const uploadToGCS = async (file, folder = 'general', prefix = '') => {
  // TODO: Implement GCS upload
  throw new Error('Google Cloud Storage upload not implemented yet');
};

/**
 * Main upload function - routes to appropriate storage method
 * @param {Object} file - File object with buffer, mimetype, originalname
 * @param {Object} options - Upload options
 * @param {string} options.folder - Subfolder name
 * @param {string} options.prefix - Filename prefix
 * @param {string} options.storage - Storage method ('local', 'cloudinary', 'gcs')
 * @returns {Promise<Object>} Upload result
 */
const uploadImage = async (file, options = {}) => {
  const {
    folder = 'general',
    prefix = '',
    storage = 'local', // Default to local storage
  } = options;

  switch (storage) {
    case 'local':
      return uploadToLocal(file, folder, prefix);
    case 'cloudinary':
      return uploadToCloudinary(file, folder, prefix);
    case 'gcs':
      return uploadToGCS(file, folder, prefix);
    default:
      return {
        success: false,
        errors: [`Unsupported storage method: ${storage}`],
      };
  }
};

/**
 * Delete uploaded file (for cleanup)
 * @param {string} filePath - Full path to the file
 * @returns {Promise<boolean>} Success status
 */
const deleteUploadedFile = async filePath => {
  try {
    await promisify(fs.unlink)(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

export {
  uploadImage,
  deleteUploadedFile,
  validateFile,
  generateUniqueFilename,
  UPLOAD_CONFIG,
};
