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
        name: 'asc'
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
  } finally {
    await prisma.$disconnect();
  }
} 