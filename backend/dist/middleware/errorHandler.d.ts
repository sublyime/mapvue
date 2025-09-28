import { Request, Response, NextFunction } from 'express';
export interface APIError extends Error {
    statusCode: number;
    code: string;
    details?: any;
}
export declare class ValidationError extends Error implements APIError {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare class NotFoundError extends Error implements APIError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class UnauthorizedError extends Error implements APIError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class ForbiddenError extends Error implements APIError {
    statusCode: number;
    code: string;
    constructor(message?: string);
}
export declare class ConflictError extends Error implements APIError {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare class DatabaseError extends Error implements APIError {
    details?: any | undefined;
    statusCode: number;
    code: string;
    constructor(message: string, details?: any | undefined);
}
export declare const errorHandler: (error: APIError | Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const asyncHandler: <T extends Request = Request>(fn: (req: T, res: Response, next: NextFunction) => Promise<any>) => (req: T, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map