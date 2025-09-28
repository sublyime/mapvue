import { Request, Response, NextFunction } from 'express';
export interface ValidationSchema {
    [key: string]: {
        required?: boolean;
        type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
        minLength?: number;
        maxLength?: number;
        pattern?: RegExp;
        enum?: any[];
        custom?: (value: any) => boolean | string;
    };
}
export declare const validate: (schema: ValidationSchema, source?: "body" | "params" | "query") => (req: Request, res: Response, next: NextFunction) => void;
export declare const layerValidationSchema: ValidationSchema;
export declare const featureValidationSchema: ValidationSchema;
export declare const userValidationSchema: ValidationSchema;
//# sourceMappingURL=validation.d.ts.map