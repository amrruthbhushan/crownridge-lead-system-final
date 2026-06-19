import { z } from 'zod';

/**
 * Custom operational API Error class
 */
export class APIError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express centralized error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  // 1. Zod Validation Errors
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // 2. Prisma Database Constraint/Operational Errors
  if (err.code && err.code.startsWith('P')) {
    console.error('Database Error:', err.code, err.message);
    
    // Unique constraint violation (e.g. email exists)
    if (err.code === 'P2002') {
      const targetFields = err.meta?.target || [];
      return res.status(400).json({
        error: `A record with this ${targetFields.join(', ')} already exists.`
      });
    }

    // Record not found
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'The requested database record was not found.'
      });
    }
  }

  // 3. Custom Operational APIErrors
  if (err instanceof APIError) {
    return res.status(err.status).json({
      error: err.message
    });
  }

  // 4. Default: Unhandled Global Server Errors
  console.error('Unhandled Global Server Error Stack:', err.stack || err);
  return res.status(err.status || 500).json({
    error: err.message || 'An internal server error occurred on the API.'
  });
};
