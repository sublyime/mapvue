import { Request, Response, NextFunction } from 'express';

export interface APIError extends Error {
  statusCode: number;
  code: string;
  details?: any;
}

export class ValidationError extends Error implements APIError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error implements APIError {
  statusCode = 404;
  code = 'NOT_FOUND';
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error implements APIError {
  statusCode = 401;
  code = 'UNAUTHORIZED';
  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error implements APIError {
  statusCode = 403;
  code = 'FORBIDDEN';
  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error implements APIError {
  statusCode = 409;
  code = 'CONFLICT';
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends Error implements APIError {
  statusCode = 500;
  code = 'DATABASE_ERROR';
  constructor(message: string, public details?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Error handling middleware
export const errorHandler = (
  error: APIError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, error);

  if ('statusCode' in error && 'code' in error) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      },
    });
  }

  // Handle specific database errors
  if (error.message.includes('duplicate key')) {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'A record with this information already exists',
      },
    });
  }

  if (error.message.includes('foreign key')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REFERENCE',
        message: 'Referenced record does not exist',
      },
    });
  }

  // Default error response
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    },
  });
};

// Async handler wrapper with proper error typing
export const asyncHandler = <T extends Request = Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<any>
) => (req: T, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};