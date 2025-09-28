"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userValidationSchema = exports.featureValidationSchema = exports.layerValidationSchema = exports.validate = void 0;
const errorHandler_1 = require("./errorHandler");
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const data = req[source];
        const errors = [];
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push(`${field} is required`);
                continue;
            }
            if (value === undefined || value === null)
                continue;
            if (rules.type) {
                const actualType = Array.isArray(value) ? 'array' : typeof value;
                if (actualType !== rules.type) {
                    errors.push(`${field} must be of type ${rules.type}`);
                    continue;
                }
            }
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
            if (rules.enum && !rules.enum.includes(value)) {
                errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
            }
            if (rules.custom) {
                const result = rules.custom(value);
                if (result !== true) {
                    errors.push(typeof result === 'string' ? result : `${field} is invalid`);
                }
            }
        }
        if (errors.length > 0) {
            throw new errorHandler_1.ValidationError('Validation failed', errors);
        }
        next();
    };
};
exports.validate = validate;
exports.layerValidationSchema = {
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
        custom: (value) => value >= 0 && value <= 1 || 'Opacity must be between 0 and 1',
    },
};
exports.featureValidationSchema = {
    geometry: {
        required: true,
        type: 'object',
        custom: (value) => {
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
exports.userValidationSchema = {
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
        custom: (value) => {
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
                return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
            }
            return true;
        },
    },
};
//# sourceMappingURL=validation.js.map