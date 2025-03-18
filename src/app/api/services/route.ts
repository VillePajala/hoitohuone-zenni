import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force the route to be dynamic and bypass middleware caching
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// GET /api/services - Get all active services
export async function GET() {
  console.log('Services API called:', new Date().toISOString());
  console.log('Current route: /api/services');
  
  try {
    console.log('Fetching services from database...');
    
    // Connect to database
    await prisma.$connect();
    console.log('Database connected for services fetch');
    
    const services = await prisma.service.findMany({
      where: {
        active: true
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' }
      ]
    });
    
    console.log(`Found ${services.length} active services`);
    
    if (services.length === 0) {
      console.warn('No active services found in database');
    }
    
    return NextResponse.json(services, {
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
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
      console.log('Database disconnected after services fetch');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 