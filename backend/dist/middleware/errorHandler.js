"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.errorHandler = exports.DatabaseError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = void 0;
class ValidationError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 400;
        this.code = 'VALIDATION_ERROR';
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.statusCode = 404;
        this.code = 'NOT_FOUND';
        this.name = 'NotFoundError';
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends Error {
    constructor(message = 'Unauthorized') {
        super(message);
        this.statusCode = 401;
        this.code = 'UNAUTHORIZED';
        this.name = 'UnauthorizedError';
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends Error {
    constructor(message = 'Forbidden') {
        super(message);
        this.statusCode = 403;
        this.code = 'FORBIDDEN';
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 409;
        this.code = 'CONFLICT';
        this.name = 'ConflictError';
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends Error {
    constructor(message, details) {
        super(message);
        this.details = details;
        this.statusCode = 500;
        this.code = 'DATABASE_ERROR';
        this.name = 'DatabaseError';
    }
}
exports.DatabaseError = DatabaseError;
const errorHandler = (error, req, res, next) => {
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
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
    });
};
exports.errorHandler = errorHandler;
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
exports.asyncHandler = asyncHandler;
//# sourceMappingURL=errorHandler.js.map