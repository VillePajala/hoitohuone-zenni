import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/services - Get all services
export async function GET(req: NextRequest) {
  try {
    console.log('Getting services...');
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful for services fetch');
    } catch (dbError) {
      console.error('Database connection failed for services:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Build where clause based on query parameters
    const where: any = {};
    
    if (activeOnly) {
      where.active = true;
    }
    
    // Get services
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        order: 'asc'
      }
    });
    
    console.log(`Found ${services.length} services`);
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services. Please try again later.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/services - Create a new service
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.name || !data.duration) {
      return NextResponse.json(
        { error: 'Name and duration are required fields' },
        { status: 400 }
      );
    }
    
    // Find the highest order value and add 1
    const maxOrderService = await prisma.service.findFirst({
      orderBy: {
        order: 'desc'
      },
      select: {
        order: true
      }
    });
    
    const nextOrder = maxOrderService ? maxOrderService.order + 1 : 0;
    
    // Create new service with the next order value
    const service = await prisma.service.create({
      data: {
        name: data.name,
        nameEn: data.nameEn || data.name,
        nameFi: data.nameFi || data.name,
        description: data.description || '',
        descriptionEn: data.descriptionEn || data.description || '',
        descriptionFi: data.descriptionFi || data.description || '',
        duration: data.duration,
        price: data.price || 0,
        currency: data.currency || 'EUR',
        active: data.active !== undefined ? data.active : true,
        order: nextOrder
      }
    });
    
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service. Please try again later.' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/services/reorder - Update service order
export async function PATCH(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.services || !Array.isArray(data.services)) {
      return NextResponse.json(
        { error: 'Services array is required' },
        { status: 400 }
      );
    }
    
    // Update orders in a transaction
    const updates = data.services.map((service: { id: string, order: number }) => 
      prisma.service.update({
        where: { id: service.id },
        data: { order: service.order }
      })
    );
    
    await prisma.$transaction(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering services:', error);
    return NextResponse.json(
      { error: 'Failed to update service order. Please try again later.' },
      { status: 500 }
    );
  }
} 