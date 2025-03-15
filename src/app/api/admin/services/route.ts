import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/services - Get all services
export async function GET(req: NextRequest) {
  try {
    // In a production environment, you would check if the user is authorized as an admin
    // const session = await getServerSession(authOptions);
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    // Build where clause based on query parameters
    const where: any = {};
    
    if (activeOnly) {
      where.active = true;
    }
    
    // Fetch services from the database
    const services = await prisma.service.findMany({
      where,
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/admin/services - Create a new service
export async function POST(req: NextRequest) {
  try {
    // In a production environment, you would check if the user is authorized as an admin
    
    const body = await req.json();
    
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
    
    // Create the service
    const service = await prisma.service.create({
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
        active: body.active !== undefined ? body.active : true
      }
    });
    
    return NextResponse.json(service, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
} 