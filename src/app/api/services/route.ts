import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/services - Get all active services
export async function GET() {
  try {
    console.log('Fetching services from database...');
    const services = await prisma.service.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('Found services:', services);
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
} 