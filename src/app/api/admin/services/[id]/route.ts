import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to check authentication
function checkAuth(req: NextRequest) {
  // Check if user is authenticated via Clerk
  const { userId } = getAuth(req);
  if (userId) return true;
  
  // Check for Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }
  
  return false;
}

// Helper function to handle unwrapping params
async function getParamId(params: { id: string | Promise<string> }): Promise<string> {
  // If id is a Promise, await it
  if (params.id instanceof Promise) {
    return await params.id;
  }
  // Otherwise, just return it
  return params.id;
}

// GET /api/admin/services/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = await getParamId(params);
    
    const service = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/services/[id] - Complete update
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }

    const id = await getParamId(params);
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.duration || typeof data.active !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: data.name,
        nameEn: data.nameEn || data.name,
        nameFi: data.nameFi || data.name,
        description: data.description,
        descriptionEn: data.descriptionEn || data.description,
        descriptionFi: data.descriptionFi || data.description,
        duration: data.duration,
        price: data.price,
        currency: data.currency || 'EUR',
        active: data.active
      }
    });
    
    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/services/[id] - Partial update
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = await getParamId(params);
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Parse request body
    const data = await req.json();
    
    // Update service with only provided fields
    const updatedService = await prisma.service.update({
      where: { id },
      data
    });
    
    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/services/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string | Promise<string> } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = await getParamId(params);
    
    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });
    
    if (!existingService) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Check if the service has bookings
    const bookingsCount = await prisma.booking.count({
      where: { serviceId: id }
    });
    
    if (bookingsCount > 0) {
      // Instead of deleting, just mark as inactive
      const updatedService = await prisma.service.update({
        where: { id },
        data: { active: false }
      });
      
      return NextResponse.json({
        ...updatedService,
        message: 'Service has existing bookings. It has been deactivated instead of deleted.'
      });
    }
    
    // Delete service if no bookings
    await prisma.service.delete({
      where: { id }
    });
    
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
} 