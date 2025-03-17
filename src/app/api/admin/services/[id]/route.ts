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

// GET /api/admin/services/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
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

// PUT /api/admin/services/[id] - Update service (complete update)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await req.json();
    
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
    
    // Validate required fields
    const requiredFields = ['name', 'nameEn', 'nameFi', 'description', 
                           'descriptionEn', 'descriptionFi', 'duration', 'price'];
    
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Update the service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: body.name,
        nameEn: body.nameEn,
        nameFi: body.nameFi,
        description: body.description,
        descriptionEn: body.descriptionEn,
        descriptionFi: body.descriptionFi,
        duration: body.duration,
        price: body.price,
        currency: body.currency || 'EUR',
        active: body.active !== undefined ? body.active : existingService.active
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

// PATCH /api/admin/services/[id] - Update service (partial update)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    const body = await req.json();
    
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
    
    // Update the service with only the provided fields
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.nameEn !== undefined && { nameEn: body.nameEn }),
        ...(body.nameFi !== undefined && { nameFi: body.nameFi }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.descriptionEn !== undefined && { descriptionEn: body.descriptionEn }),
        ...(body.descriptionFi !== undefined && { descriptionFi: body.descriptionFi }),
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.currency !== undefined && { currency: body.currency }),
        ...(body.active !== undefined && { active: body.active })
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

// DELETE /api/admin/services/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
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

    // Check if service has any bookings
    const bookingsCount = await prisma.booking.count({
      where: { serviceId: id }
    });

    if (bookingsCount > 0) {
      // If there are bookings, we should not delete the service but just mark it as inactive
      await prisma.service.update({
        where: { id },
        data: { active: false }
      });

      return NextResponse.json({
        message: 'Service has existing bookings. It has been marked as inactive instead of being deleted.'
      });
    }
    
    // If no bookings, delete the service
    await prisma.service.delete({
      where: { id }
    });
    
    return NextResponse.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
} 