import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// GET /api/admin/services - Get all services
export async function GET(req: NextRequest) {
  try {
    // Get the session from the request
    const { userId } = getAuth(req);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
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
        name: 'asc'
      }
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services. Please try again later.' },
      { status: 500 }
    );
  }
}

// POST /api/admin/services - Create a new service
export async function POST(req: NextRequest) {
  try {
    // Check if the user is authenticated
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // Get request body
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'nameEn', 'nameFi', 'description', 'descriptionEn', 'descriptionFi', 'duration', 'price'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create service
    const service = await prisma.service.create({
      data
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