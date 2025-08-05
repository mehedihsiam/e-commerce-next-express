import { z } from 'zod';

/**
 * Formats Zod validation errors into a standardized format
 * @param {Error} error - The error object to format
 * @returns {Array|null} Array of formatted error objects or null if not a ZodError
 */
const formatZodError = error => {
  if (error instanceof z.ZodError) {
    return error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
  }
  return null;
};

export default formatZodError;
