import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

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
        console.error('Empty Bearer token provided');
        return false;
      }
    }
    
    console.error('No valid authentication found in request');
    return false;
  } catch (error) {
    console.error('Error in auth check:', error);
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
      console.error('Authentication failed - returning 401');
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: JSON.stringify(dbError) },
        { status: 500 }
      );
    }

    // Count bookings to check if database has any
    const bookingCount = await prisma.booking.count();
    console.log(`Total bookings in database: ${bookingCount}`);

    if (bookingCount === 0) {
      console.log('No bookings found in database');
      return NextResponse.json({ bookings: [] }, { status: 200 });
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
          console.error(`Error formatting booking ${booking.id}:`, bookingError);
          return null;
        }
      }).filter(booking => booking !== null);

      console.log(`Successfully formatted ${formattedBookings.length} bookings`);
      // Return in an object with bookings property to match the expected structure
      return NextResponse.json({ bookings: formattedBookings });
    } catch (queryError) {
      console.error('Error querying bookings:', queryError);
      return NextResponse.json(
        { error: 'Failed to query bookings', details: JSON.stringify(queryError) },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log('Database disconnected successfully');
    } catch (disconnectError) {
      console.error('Error disconnecting from database:', disconnectError);
    }
  }
} 