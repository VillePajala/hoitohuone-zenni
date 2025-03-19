import { 
  createGetHandler,
  createPutHandler,
  createPatchHandler,
  createDeleteHandler,
  success,
  notFound,
  badRequest,
  unauthorized,
  log,
  string,
  number,
  boolean,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Request body validation schema for PUT/PATCH
interface UpdateServiceRequestBody {
  name?: string;
  nameEn?: string;
  nameFi?: string;
  description?: string;
  descriptionEn?: string;
  descriptionFi?: string;
  duration?: number;
  price?: number;
  currency?: string;
  active?: boolean;
}

// Full update requires more fields
const putServiceSchema = createObjectValidator<UpdateServiceRequestBody>({
  name: string({ required: true }),
  nameEn: string(),
  nameFi: string(),
  description: string(),
  descriptionEn: string(),
  descriptionFi: string(),
  duration: number({ required: true }),
  price: number(),
  currency: string(),
  active: boolean({ required: true })
});

// Partial update allows all fields to be optional
const patchServiceSchema = createObjectValidator<UpdateServiceRequestBody>({
  name: string(),
  nameEn: string(),
  nameFi: string(),
  description: string(),
  descriptionEn: string(),
  descriptionFi: string(),
  duration: number(),
  price: number(),
  currency: string(),
  active: boolean()
});

// Validator functions
function validatePutService(body: any): UpdateServiceRequestBody {
  const validationResult = putServiceSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid service data');
  }
  return validationResult.data;
}

function validatePatchService(body: any): UpdateServiceRequestBody {
  const validationResult = patchServiceSchema(body);
  if (!validationResult.success || !validationResult.data) {
    throw new Error(validationResult.errors?.[0]?.message || 'Invalid service data');
  }
  return validationResult.data;
}

// GET /api/admin/services/[id] - Get a specific service
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId, params } = context;
    const serviceId = params?.id;
    
    log.info('Getting service by ID', { requestId, serviceId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Validate ID exists
    if (!serviceId) {
      log.warn('Missing service ID parameter', { requestId });
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Get the service
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) {
      log.warn('Service not found', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    log.info('Service retrieved successfully', { 
      requestId, 
      serviceId: service.id 
    });
    
    return Response.json({ success: true, data: service });
  },
  {
    allowedMethods: ['GET'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to view service details'
    }
  }
);

// PUT /api/admin/services/[id] - Complete update of a service
export const PUT = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId, params } = context;
    const serviceId = params?.id;
    
    log.info('Updating service (PUT)', { requestId, serviceId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Get validated body data
    const body = context.validatedData as UpdateServiceRequestBody;
    
    // Validate ID exists
    if (!serviceId) {
      log.warn('Missing service ID parameter', { requestId });
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!existingService) {
      log.warn('Service not found for update', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
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
    
    log.info('Updating service details', { 
      requestId, 
      serviceId,
      name,
      duration,
      active 
    });
    
    // Update service
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
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
        active
      }
    });
    
    log.info('Service updated successfully (PUT)', { 
      requestId, 
      serviceId: updatedService.id 
    });
    
    return Response.json({ success: true, data: updatedService });
  },
  {
    allowedMethods: ['PUT'],
    validator: validatePutService,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to update services'
    }
  }
);

// PATCH /api/admin/services/[id] - Partial update of a service
export const PATCH = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId, params } = context;
    const serviceId = params?.id;
    
    log.info('Partially updating service (PATCH)', { requestId, serviceId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Get validated body data
    const body = context.validatedData as UpdateServiceRequestBody;
    
    // Validate ID exists
    if (!serviceId) {
      log.warn('Missing service ID parameter', { requestId });
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!existingService) {
      log.warn('Service not found for partial update', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    log.info('Applying partial updates to service', { 
      requestId, 
      serviceId,
      updateFields: Object.keys(body).join(', ')
    });
    
    // Update service with only provided fields
    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: body
    });
    
    log.info('Service updated successfully (PATCH)', { 
      requestId, 
      serviceId: updatedService.id 
    });
    
    return Response.json({ success: true, data: updatedService });
  },
  {
    allowedMethods: ['PATCH'],
    validator: validatePatchService,
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to update services'
    }
  }
);

// DELETE /api/admin/services/[id] - Delete a service
export const DELETE = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId, params } = context;
    const serviceId = params?.id;
    
    log.info('Deleting service', { requestId, serviceId });
    
    log.info('User authenticated', { 
      requestId, 
      userId: context.auth.userId 
    });
    
    // Validate ID exists
    if (!serviceId) {
      log.warn('Missing service ID parameter', { requestId });
      return Response.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!existingService) {
      log.warn('Service not found for deletion', { requestId, serviceId });
      return Response.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Check if the service has bookings
    const bookingsCount = await prisma.booking.count({
      where: { serviceId }
    });
    
    if (bookingsCount > 0) {
      log.info('Service has bookings, deactivating instead of deleting', { 
        requestId, 
        serviceId,
        bookingsCount
      });
      
      // Instead of deleting, just mark as inactive
      const updatedService = await prisma.service.update({
        where: { id: serviceId },
        data: { active: false }
      });
      
      return Response.json({
        success: true,
        data: {
          ...updatedService,
          message: 'Service has existing bookings. It has been deactivated instead of deleted.'
        }
      });
    }
    
    log.info('Deleting service completely', { requestId, serviceId });
    
    // Delete service if no bookings
    await prisma.service.delete({
      where: { id: serviceId }
    });
    
    log.info('Service deleted successfully', { requestId, serviceId });
    
    return Response.json({ 
      success: true, 
      data: { message: 'Service deleted successfully' }
    });
  },
  {
    allowedMethods: ['DELETE'],
    middleware: [withRequestLogging(), withErrorHandling()],
    authOptions: {
      requiredRoles: ['admin'],
      unauthorizedMessage: 'Admin access required to delete services'
    }
  }
); 