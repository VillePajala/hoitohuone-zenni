import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force the route to be dynamic and bypass middleware caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /en/api/services - Forward to the main API endpoint for services
export async function GET() {
  console.log('English services API called:', new Date().toISOString());
  console.log('Current route: /en/api/services (redirecting to main API)');
  
  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connected for English services fetch');
    
    const services = await prisma.service.findMany({
      where: {
        active: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log(`Found ${services.length} active services in English route`);
    
    return NextResponse.json(services, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching services in English route:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services', details: error instanceof Error ? error.message : 'Unknown error' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected after English services fetch');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 