import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler';

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

export const validate = (schema: ValidationSchema, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req[source];
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Check required fields
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }

      // Skip validation if field is not provided and not required
      if (value === undefined || value === null) continue;

      // Type validation
      if (rules.type) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (actualType !== rules.type) {
          errors.push(`${field} must be of type ${rules.type}`);
          continue;
        }
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must not exceed ${rules.maxLength} characters`);
        }
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
      }

      // Custom validation
      if (rules.custom) {
        const result = rules.custom(value);
        if (result !== true) {
          errors.push(typeof result === 'string' ? result : `${field} is invalid`);
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Validation failed', errors);
    }

    next();
  };
};

// Common validation schemas
export const layerValidationSchema: ValidationSchema = {
  name: {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 255,
  },
  description: {
    type: 'string',
    maxLength: 1000,
  },
  type: {
    required: true,
    type: 'string',
    enum: ['vector', 'raster', 'tile', 'wms', 'wmts'],
  },
  visible: {
    type: 'boolean',
  },
  opacity: {
    type: 'number',
    custom: (value: number) => value >= 0 && value <= 1 || 'Opacity must be between 0 and 1',
  },
};

export const featureValidationSchema: ValidationSchema = {
  geometry: {
    required: true,
    type: 'object',
    custom: (value: any) => {
      if (!value.type || !value.coordinates) {
        return 'Geometry must have type and coordinates';
      }
      return true;
    },
  },
  properties: {
    type: 'object',
  },
};

export const userValidationSchema: ValidationSchema = {
  username: {
    required: true,
    type: 'string',
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
  email: {
    required: true,
    type: 'string',
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    custom: (value: string) => {
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
        return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      }
      return true;
    },
  },
};