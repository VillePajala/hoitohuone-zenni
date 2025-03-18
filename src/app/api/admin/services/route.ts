import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Helper function to check authentication with improved logging
function checkAuth(req: NextRequest) {
  try {
    // Check if user is authenticated via Clerk
    const { userId } = getAuth(req);
    
    if (userId) {
      console.log('User authenticated via Clerk session:', userId);
      return true;
    }
    
    // Check for Bearer token
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      console.log('User authenticated via Bearer token');
      // Validate token format - should be non-empty after Bearer prefix
      const token = authHeader.substring(7).trim();
      if (token.length > 0) {
        return true;
      } else {
        console.error('Empty Bearer token provided');
        return false;
      }
    }
    
    console.error('No valid authentication found in request');
    return false;
  } catch (error) {
    console.error('Error in auth check:', error);
    return false;
  }
}

// GET /api/admin/services - Get all services
export async function GET(req: NextRequest) {
  try {
    console.log('Getting services...');
    console.log('Request headers:', JSON.stringify({
      authorization: req.headers.get('authorization') ? 'Present (contents hidden)' : 'Missing',
      cookie: req.headers.get('cookie') ? 'Present (contents hidden)' : 'Missing'
    }));
    
    // Check authentication
    if (!checkAuth(req)) {
      console.error('Authentication failed - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
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
      } as any
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
    console.log('Creating new service...');
    
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
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
      } as any,
      select: {
        order: true
      } as any
    });
    
    const nextOrder = maxOrderService && typeof maxOrderService.order === 'number' 
      ? maxOrderService.order + 1 
      : 0;
    
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
      } as any
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
    console.log('Reordering services...');
    
    // Check authentication
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
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
        data: { order: service.order } as any
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