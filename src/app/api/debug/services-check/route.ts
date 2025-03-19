import { prisma } from '@/lib/prisma';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';
import { NextRequest } from 'next/server';

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

// GET /api/debug/services-check - Check services status in database and API
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    
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
      diagnostics.database.message = 'Testing database connection';
      
      await prisma.$connect();
      diagnostics.database.connected = true;
      diagnostics.database.message = 'Database connected successfully';
      
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
      diagnostics.database.status = 'error';
      diagnostics.database.message = 'Database connection error';
      diagnostics.database.error = error instanceof Error ? error.message : 'Unknown database error';
    } finally {
      try {
        await prisma.$disconnect();
      } catch (error) {
        // Ignore disconnection errors
      }
    }
    
    // 2. Check services API
    try {
      diagnostics.api.message = 'Testing services API';
      
      // Make a request to the services API
      const apiUrl = new URL('/api/services', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        diagnostics.api.status = 'error';
        diagnostics.api.message = `API returned status ${response.status}`;
        diagnostics.api.error = `Failed to fetch from API: ${response.statusText}`;
      } else {
        const data = await response.json();
        
        if (data && data.data && Array.isArray(data.data)) {
          // New API format with { data: [...] }
          diagnostics.api.servicesFound = data.data.length;
          diagnostics.api.status = 'success';
          diagnostics.api.message = `API returned ${data.data.length} services`;
        } else if (Array.isArray(data)) {
          // Old API format with direct array
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
      diagnostics.api.status = 'error';
      diagnostics.api.message = 'API request error';
      diagnostics.api.error = error instanceof Error ? error.message : 'Unknown API error';
    }
    
    return Response.json(diagnostics);
  },
  {
    allowedMethods: ['GET'],
    authOptions: {
      requiredRoles: ['admin'],
      allowPublicAccess: false
    },
    middleware: [withRequestLogging(), withErrorHandling()]
  }
); 