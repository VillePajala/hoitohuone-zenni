import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Define service type
type Service = {
  id: string;
  name: string;
  nameEn: string;
  nameFi: string;
  description: string;
  descriptionEn: string;
  descriptionFi: string;
  duration: number;
  price: number;
  currency: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Define diagnostics type
type Diagnostics = {
  timestamp: string;
  database: {
    status: 'pending' | 'success' | 'warning' | 'error';
    message: string;
    connected: boolean;
    serviceCount: number;
    error: string | null;
  };
  api: {
    status: 'pending' | 'success' | 'warning' | 'error';
    message: string;
    servicesFound: number;
    error: string | null;
  };
  services: Service[];
};

export async function GET() {
  console.log('Debug services check called');
  
  const diagnostics: Diagnostics = {
    timestamp: new Date().toISOString(),
    database: {
      status: 'pending',
      message: '',
      connected: false,
      serviceCount: 0,
      error: null
    },
    api: {
      status: 'pending',
      message: '',
      servicesFound: 0,
      error: null
    },
    services: []
  };
  
  // 1. Check database connection and services
  try {
    console.log('Checking database connection...');
    diagnostics.database.message = 'Testing database connection';
    
    await prisma.$connect();
    diagnostics.database.connected = true;
    diagnostics.database.message = 'Database connected successfully';
    
    console.log('Fetching services count...');
    const serviceCount = await prisma.service.count();
    diagnostics.database.serviceCount = serviceCount;
    
    if (serviceCount === 0) {
      diagnostics.database.message = 'No services found in database';
      diagnostics.database.status = 'warning';
    } else {
      diagnostics.database.message = `Found ${serviceCount} services in database`;
      diagnostics.database.status = 'success';
      
      // Fetch actual services
      const services = await prisma.service.findMany({
        where: {
          active: true
        },
        orderBy: {
          name: 'asc'
        }
      });
      
      diagnostics.services = services as Service[];
    }
  } catch (error) {
    console.error('Database check error:', error);
    diagnostics.database.status = 'error';
    diagnostics.database.message = 'Database connection error';
    diagnostics.database.error = error instanceof Error ? error.message : 'Unknown database error';
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error disconnecting from database:', error);
    }
  }
  
  // 2. Check services API
  try {
    console.log('Checking services API...');
    diagnostics.api.message = 'Testing services API';
    
    // Make a request to the services API
    const response = await fetch(new URL('/api/services', 'http://localhost:3000'));
    
    if (!response.ok) {
      diagnostics.api.status = 'error';
      diagnostics.api.message = `API returned status ${response.status}`;
      diagnostics.api.error = `Failed to fetch from API: ${response.statusText}`;
    } else {
      const data = await response.json();
      
      if (Array.isArray(data)) {
        diagnostics.api.servicesFound = data.length;
        diagnostics.api.status = 'success';
        diagnostics.api.message = `API returned ${data.length} services`;
      } else {
        diagnostics.api.status = 'warning';
        diagnostics.api.message = 'API did not return an array';
        diagnostics.api.error = 'Invalid response format';
      }
    }
  } catch (error) {
    console.error('API check error:', error);
    diagnostics.api.status = 'error';
    diagnostics.api.message = 'API request error';
    diagnostics.api.error = error instanceof Error ? error.message : 'Unknown API error';
  }
  
  return NextResponse.json(diagnostics);
} 