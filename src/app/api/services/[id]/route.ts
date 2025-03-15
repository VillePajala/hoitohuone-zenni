import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/services/:id - Get a specific service by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: serviceId } = params;

    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(service, { status: 200 });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
} 