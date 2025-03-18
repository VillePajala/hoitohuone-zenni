import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';
import { ErrorType, createError, createErrorResponse, logError } from '@/lib/errorHandling';

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
        logError('Empty Bearer token provided', 'bookings-api');
        return false;
      }
    }
    
    logError('No valid authentication found in request', 'bookings-api');
    return false;
  } catch (error) {
    logError(error, 'bookings-api auth check');
    return false;
  }
}

// GET /api/admin/bookings
export async function GET(req: NextRequest) {
  console.log('🔍 Bookings API called:', new Date().toISOString());
  console.log('Request headers:', JSON.stringify({
    authorization: req.headers.get('authorization') ? 'Present (contents hidden)' : 'Missing',
    cookie: req.headers.get('cookie') ? 'Present (contents hidden)' : 'Missing'
  }));
  
  try {
    console.log('Fetching bookings...');
    
    // Check authentication
    if (!checkAuth(req)) {
      logError('Authentication failed - returning 401', 'bookings-api');
      throw createError(ErrorType.AUTHENTICATION, 'Please sign in to access this resource');
    }
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      logError(dbError, 'bookings-api database connection');
      throw createError(
        ErrorType.DATABASE, 
        'Failed to connect to database', 
        dbError
      );
    }

    // Count bookings to check if database has any
    const bookingCount = await prisma.booking.count();
    console.log(`Total bookings in database: ${bookingCount}`);

    if (bookingCount === 0) {
      console.log('No bookings found in database');
      return createErrorResponse(
        createError(
          ErrorType.NOT_FOUND, 
          'No bookings found'
        )
      );
    }

    try {
      // Directly get all bookings
      const bookings = await prisma.booking.findMany({
        include: {
          service: {
            select: {
              id: true,
              name: true,
              nameFi: true,
              nameEn: true
            }
          }
        }
      });
      
      console.log(`Found ${bookings.length} bookings. First booking:`, JSON.stringify(bookings[0], null, 2));
      
      // Format bookings for the frontend
      const formattedBookings = bookings.map(booking => {
        console.log(`Processing booking ${booking.id} with status: "${booking.status}"`);
        
        try {
          return {
            id: booking.id,
            customerName: booking.customerName,
            customerEmail: booking.customerEmail,
            service: {
              id: booking.service.id,
              name: booking.service.name,
              nameFi: booking.service.nameFi,
              nameEn: booking.service.nameEn
            },
            date: booking.date.toISOString(),
            startTime: booking.startTime.toISOString(),
            endTime: booking.endTime.toISOString(),
            status: booking.status, // Keep the exact status as stored in database
            language: booking.language
          };
        } catch (bookingError) {
          logError(bookingError, `Error formatting booking ${booking.id}`);
          return null;
        }
      }).filter(booking => booking !== null);

      console.log(`Successfully formatted ${formattedBookings.length} bookings`);
      // Return in an object with bookings property to match the expected structure
      return createSuccessResponse({ bookings: formattedBookings });
    } catch (queryError) {
      logError(queryError, 'Error querying bookings');
      throw createError(
        ErrorType.DATABASE, 
        'Failed to query bookings', 
        queryError
      );
    }
  } catch (error) {
    return createErrorResponse(error);
  } finally {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (disconnectError) {
      logError(disconnectError, 'Error disconnecting from database');
    }
  }
}

// Helper function to create success responses
function createSuccessResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}