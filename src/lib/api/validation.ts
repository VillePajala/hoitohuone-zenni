/**
 * API Request Validation Utilities
 * 
 * Provides utilities for validating API requests:
 * - Type checking
 * - Parameter validation
 * - Middleware integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiError, ErrorCode, createErrorResponse } from './errorHandling';

/**
 * Basic validation result interface
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

/**
 * Validation error interface
 */
export interface ValidationError {
  path: string[];
  message: string;
}

/**
 * Validator function type
 */
export type Validator<T> = (value: unknown) => ValidationResult<T>;

/**
 * Create a validator function for objects
 */
export function createObjectValidator<T>(schema: Record<string, Validator<any>>): Validator<T> {
  return (value: unknown): ValidationResult<T> => {
    if (!value || typeof value !== 'object') {
      return { 
        success: false, 
        errors: [{ path: [], message: 'Expected an object' }] 
      };
    }

    const obj = value as Record<string, unknown>;
    const result: Record<string, any> = {};
    const errors: ValidationError[] = [];

    // Validate each field according to its schema
    for (const [key, validator] of Object.entries(schema)) {
      const fieldValue = obj[key];
      const fieldResult = validator(fieldValue);

      if (fieldResult.success && fieldResult.data !== undefined) {
        result[key] = fieldResult.data;
      } else if (fieldResult.errors) {
        // Add field path prefix to error paths
        errors.push(
          ...fieldResult.errors.map(err => ({
            path: [key, ...err.path],
            message: err.message
          }))
        );
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result as T };
  };
}

/**
 * String validator
 */
export function string(options: { 
  required?: boolean; 
  minLength?: number; 
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
} = {}): Validator<string> {
  return (value: unknown): ValidationResult<string> => {
    if (value === undefined || value === null || value === '') {
      if (options.required) {
        return { 
          success: false, 
          errors: [{ path: [], message: 'Required' }] 
        };
      }
      return { success: true, data: '' };
    }

    if (typeof value !== 'string') {
      return { 
        success: false, 
        errors: [{ path: [], message: 'Must be a string' }] 
      };
    }

    const errors: ValidationError[] = [];

    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push({ 
        path: [], 
        message: `Must be at least ${options.minLength} characters` 
      });
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push({ 
        path: [], 
        message: `Must be at most ${options.maxLength} characters` 
      });
    }

    if (options.pattern && !options.pattern.test(value)) {
      errors.push({ 
        path: [], 
        message: 'Invalid format' 
      });
    }

    if (options.email && !isValidEmail(value)) {
      errors.push({ 
        path: [], 
        message: 'Invalid email address' 
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: value };
  };
}

/**
 * Number validator
 */
export function number(options: { 
  required?: boolean; 
  min?: number; 
  max?: number;
  integer?: boolean;
} = {}): Validator<number> {
  return (value: unknown): ValidationResult<number> => {
    if (value === undefined || value === null || value === '') {
      if (options.required) {
        return { 
          success: false, 
          errors: [{ path: [], message: 'Required' }] 
        };
      }
      return { success: true, data: 0 };
    }

    let numberValue: number;
    
    if (typeof value === 'string') {
      numberValue = Number(value);
      if (isNaN(numberValue)) {
        return { 
          success: false, 
          errors: [{ path: [], message: 'Must be a number' }] 
        };
      }
    } else if (typeof value !== 'number') {
      return { 
        success: false, 
        errors: [{ path: [], message: 'Must be a number' }] 
      };
    } else {
      numberValue = value;
    }

    const errors: ValidationError[] = [];

    if (options.integer && !Number.isInteger(numberValue)) {
      errors.push({ 
        path: [], 
        message: 'Must be an integer' 
      });
    }

    if (options.min !== undefined && numberValue < options.min) {
      errors.push({ 
        path: [], 
        message: `Must be at least ${options.min}` 
      });
    }

    if (options.max !== undefined && numberValue > options.max) {
      errors.push({ 
        path: [], 
        message: `Must be at most ${options.max}` 
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: numberValue };
  };
}

/**
 * Boolean validator
 */
export function boolean(options: {
  required?: boolean;
} = {}): Validator<boolean> {
  return (value: unknown): ValidationResult<boolean> => {
    if (value === undefined || value === null || value === '') {
      if (options.required) {
        return { 
          success: false, 
          errors: [{ path: [], message: 'Required' }] 
        };
      }
      return { success: true, data: false };
    }

    if (typeof value === 'boolean') {
      return { success: true, data: value };
    }

    if (value === 'true' || value === '1' || value === 1) {
      return { success: true, data: true };
    }

    if (value === 'false' || value === '0' || value === 0) {
      return { success: true, data: false };
    }

    return { 
      success: false, 
      errors: [{ path: [], message: 'Must be a boolean' }] 
    };
  };
}

/**
 * Array validator
 */
export function array<T>(itemValidator: Validator<T>, options: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
} = {}): Validator<T[]> {
  return (value: unknown): ValidationResult<T[]> => {
    if (value === undefined || value === null || value === '') {
      if (options.required) {
        return { 
          success: false, 
          errors: [{ path: [], message: 'Required' }] 
        };
      }
      return { success: true, data: [] };
    }

    if (!Array.isArray(value)) {
      return { 
        success: false, 
        errors: [{ path: [], message: 'Must be an array' }] 
      };
    }

    const errors: ValidationError[] = [];
    const result: T[] = [];

    if (options.minLength !== undefined && value.length < options.minLength) {
      errors.push({ 
        path: [], 
        message: `Must contain at least ${options.minLength} items` 
      });
    }

    if (options.maxLength !== undefined && value.length > options.maxLength) {
      errors.push({ 
        path: [], 
        message: `Must contain at most ${options.maxLength} items` 
      });
    }

    // Validate each item in the array
    value.forEach((item, index) => {
      const itemResult = itemValidator(item);
      
      if (itemResult.success && itemResult.data !== undefined) {
        result.push(itemResult.data);
      } else if (itemResult.errors) {
        errors.push(
          ...itemResult.errors.map(err => ({
            path: [index.toString(), ...err.path],
            message: err.message
          }))
        );
      }
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: result };
  };
}

/**
 * Validate request JSON body
 */
export async function validateJsonBody<T>(
  request: NextRequest,
  validator: Validator<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validator(body);
  } catch (error) {
    return {
      success: false,
      errors: [{ path: [], message: 'Invalid JSON' }]
    };
  }
}

/**
 * Validate request query parameters
 */
export function validateQueryParams<T>(
  searchParams: URLSearchParams,
  validator: Validator<T>
): ValidationResult<T> {
  const params: Record<string, string | string[]> = {};
  
  // Convert URLSearchParams to a regular object
  searchParams.forEach((value, key) => {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        (params[key] as string[]).push(value);
      } else {
        params[key] = [params[key] as string, value];
      }
    } else {
      params[key] = value;
    }
  });
  
  return validator(params);
}

/**
 * Helper middleware to validate request JSON body
 */
export function withBodyValidation<T>(
  validator: Validator<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const result = await validateJsonBody(request, validator);
    
    if (!result.success || !result.data) {
      return createErrorResponse({
        errors: result.errors || [{ path: [], message: 'Validation failed' }]
      });
    }
    
    return handler(request, result.data);
  };
}

/**
 * Helper middleware to validate request query parameters
 */
export function withQueryValidation<T>(
  validator: Validator<T>,
  handler: (request: NextRequest, data: T) => Promise<NextResponse> | NextResponse
) {
  return (request: NextRequest): Promise<NextResponse> | NextResponse => {
    const { searchParams } = new URL(request.url);
    const result = validateQueryParams(searchParams, validator);
    
    if (!result.success || !result.data) {
      return createErrorResponse({
        errors: result.errors || [{ path: [], message: 'Validation failed' }]
      });
    }
    
    return handler(request, result.data);
  };
}

/**
 * Helper function to validate email addresses
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
} 