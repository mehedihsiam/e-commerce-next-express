import { uploadImage } from '../../utils/uploadImage.js';

/**
 * Upload multiple images and return URLs
 * This endpoint handles pre-upload of images before product creation
 */
const uploadImages = async (req, res, next) => {
  try {
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No images provided',
        error: 'At least one image is required',
      });
    }

    // Check if more than 5 files were uploaded
    if (req.files.length > 5) {
      return res.status(400).json({
        message: 'Too many images',
        error: 'Maximum 5 images allowed',
      });
    }

    const uploadedImages = [];
    const uploadErrors = [];

    // Process each uploaded file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];

      try {
        const uploadResult = await uploadImage(file, {
          folder: 'products',
          prefix: 'product',
          storage: 'local', // Can be changed to 'cloudinary' or 'gcs' in the future
        });

        if (uploadResult.success) {
          uploadedImages.push({
            url: uploadResult.url,
            filename: uploadResult.filename,
            originalName: file.originalname,
            size: uploadResult.size,
            mimetype: uploadResult.mimetype,
          });
        } else {
          uploadErrors.push({
            file: file.originalname,
            errors: uploadResult.errors,
          });
        }
      } catch (error) {
        uploadErrors.push({
          file: file.originalname,
          errors: [error.message],
        });
      }
    }

    // If all uploads failed
    if (uploadedImages.length === 0) {
      return res.status(400).json({
        message: 'All image uploads failed',
        errors: uploadErrors,
      });
    }

    // Return results (partial success is allowed)
    const response = {
      message: `${uploadedImages.length} image(s) uploaded successfully`,
      images: uploadedImages,
    };

    // Include errors if some uploads failed
    if (uploadErrors.length > 0) {
      response.partialFailures = uploadErrors;
      response.message += `, ${uploadErrors.length} failed`;
    }

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

export default uploadImages;
