import { 
  createGetHandler,
  createPostHandler,
  createPatchHandler,
  success,
  validationError,
  unauthorized,
  log,
  string,
  number,
  boolean,
  array,
  createObjectValidator,
  validateQueryParams
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Query parameters validation schema for GET
interface GetServicesQueryParams {
  activeOnly?: string;
}

const getServicesSchema = createObjectValidator<GetServicesQueryParams>({
  activeOnly: string()
});

// Request body validation schema for POST
interface CreateServiceRequestBody {
  name: string;
  nameEn?: string;
  nameFi?: string;
  description?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  duration: number;
  price?: number;
  currency?: string;
  active?: boolean;
}

const createServiceSchema = createObjectValidator<CreateServiceRequestBody>({
  name: string({ required: true }),
  nameEn: string(),
  nameFi: string(),
  description: string(),
  descriptionEn: string(),
  descriptionFi: string(),
  duration: number({ required: true }),
  price: number(),
  currency: string(),
  active: boolean()
});

// Request body validation schema for PATCH
interface ReorderServicesRequestBody {
  services: Array<{
    id: string;
    order: number;
  }>;
}

const reorderServicesSchema = createObjectValidator<ReorderServicesRequestBody>({
  services: array(
    createObjectValidator({
      id: string({ required: true }),
      order: number({ required: true })
    }),
    { required: true }
  )
});

// Validator functions
function validateCreateService(body: any): CreateServiceRequestBody {
  const validationResult = createServiceSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid service data');
  }
  return validationResult.data;
}

function validateReorderServices(body: any): ReorderServicesRequestBody {
  const validationResult = reorderServicesSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid reordering data');
  }
  return validationResult.data;
}

// GET /api/admin/services - Get all services
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    log.info('Getting services', { requestId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Parse query parameters
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('activeOnly') === 'true';
    
    // Build where clause based on query parameters
    const where: any = {};
    
    if (activeOnly) {
      where.active = true;
    }
    
    log.info('Fetching services', { 
      requestId, 
      filter: activeOnly ? 'active only' : 'all' 
    });
    
    // Get services
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });
    
    log.info('Services retrieved successfully', { 
      requestId, 
      count: services.length 
    });
    
    return Response.json({ success: true, data: services });
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to view services'
    }
  }
);

// POST /api/admin/services - Create a new service
export const POST = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    log.info('Creating new service', { requestId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Get validated body data
    const body = context.validatedData as CreateServiceRequestBody;
    
    const {
      name,
      nameEn,
      nameFi,
      description,
      descriptionEn,
      descriptionFi,
      duration,
      price,
      currency,
      active
    } = body;
    
    log.info('Finding highest service order', { requestId });
    
    // Find the highest order value and add 1
    const maxOrderService = await prisma.service.findFirst({
      orderBy: {
        order: 'desc'
      },
      select: {
        order: true
      }
    });
    
    const nextOrder = maxOrderService && typeof maxOrderService.order === 'number' 
      ? maxOrderService.order + 1 
      : 0;
    
    log.info('Creating service', { 
      requestId, 
      serviceName: name, 
      nextOrder 
    });
    
    // Create new service with the next order value
    const service = await prisma.service.create({
      data: {
        name,
        nameEn: nameEn || name,
        nameFi: nameFi || name,
        description: description || '',
        descriptionEn: descriptionEn || description || '',
        descriptionFi: descriptionFi || description || '',
        duration,
        price: price || 0,
        currency: currency || 'EUR',
        active: active !== undefined ? active : true,
        order: nextOrder
      }
    });
    
    log.info('Service created successfully', { 
      requestId, 
      serviceId: service.id 
    });
    
    return Response.json(
      { success: true, data: service },
      { status: 201 }
    );
  },
  {
    allowedMethods: ['POST'],
    validator: validateCreateService,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to create services'
    }
  }
);

// PATCH /api/admin/services - Update service order
export const PATCH = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    log.info('Reordering services', { requestId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Get validated body data
    const body = context.validatedData as ReorderServicesRequestBody;
    const { services } = body;
    
    log.info('Processing service reordering', { 
      requestId, 
      serviceCount: services.length 
    });
    
    // Update orders in a transaction
    const updates = services.map(service => 
      prisma.service.update({
        where: { id: service.id },
        data: { order: service.order }
      })
    );
    
    try {
      await prisma.$transaction(updates);
      log.info('Services reordered successfully', { requestId });
      
      return Response.json({ success: true });
    } catch (error) {
      log.error('Error during service reordering transaction', { 
        requestId, 
        error 
      });
      throw error; // Let the handler middleware catch and format this error
    }
  },
  {
    allowedMethods: ['PATCH'],
    validator: validateReorderServices,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to reorder services'
    }
  }
); 