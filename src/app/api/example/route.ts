/**
 * Example API route to demonstrate the new API utilities
 */

import { 
  createGetHandler, 
  createPostHandler,
  success, 
  string, 
  number, 
  createObjectValidator 
} from '@/lib/api';

// Query params interface
interface ExampleQueryParams {
  name?: string;
  page?: number;
  sort?: string;
}

// GET handler with query validation
export const GET = createGetHandler<ExampleQueryParams>(
  async ({ query, requestId }) => {
    // Access validated query params
    const { name = 'Guest', page = 1 } = query || {};
    
    // Return a success response
    return success(
      {
        message: `Hello, ${name}!`,
        query: query,
        timestamp: new Date().toISOString()
      },
      { requestId }
    );
  },
  {
    queryValidator: createObjectValidator<ExampleQueryParams>({
      name: string({ minLength: 2, maxLength: 50 }),
      page: number({ min: 1 }),
      sort: string()
    })
  }
);

// Example data type
interface CreateUserRequest {
  name: string;
  email: string;
  age: number;
}

// POST handler with body validation
export const POST = createPostHandler<CreateUserRequest>(
  async ({ body, requestId }) => {
    // Access validated body
    const { name, email, age } = body;
    
    // Return a success response
    return success(
      {
        id: "user_" + Math.random().toString(36).substring(2, 9),
        name,
        email,
        age,
        createdAt: new Date().toISOString()
      },
      { 
        status: 201,
        requestId 
      }
    );
  },
  {
    bodyValidator: createObjectValidator<CreateUserRequest>({
      name: string({ required: true, minLength: 2, maxLength: 50 }),
      email: string({ required: true, email: true }),
      age: number({ required: true, min: 18 })
    })
  }
); 