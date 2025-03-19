/**
 * API Utilities
 * 
 * Central export file for all API utilities to make imports cleaner.
 */

// Error handling
export * from './errorHandling';

// Response formatting
export * from './responseFormatting';

// Validation
// Rename ValidationError to avoid naming conflict with errorHandling
import { 
  ValidationError as RequestValidationError, 
  Validator, 
  validateJsonBody, 
  validateQueryParams, 
  withBodyValidation, 
  withQueryValidation, 
  string, 
  number, 
  boolean, 
  array, 
  createObjectValidator 
} from './validation';

// Re-export types with type keyword
export type { RequestValidationError, Validator };

// Re-export functions
export {
  validateJsonBody,
  validateQueryParams,
  withBodyValidation,
  withQueryValidation,
  string,
  number,
  boolean,
  array,
  createObjectValidator
};

// Middleware
export * from './middleware';

// Base handler
export * from './baseHandler';

// Cookie service
export * from './cookieService';

// Logging (re-export only what's needed)
export { log } from './logging'; 