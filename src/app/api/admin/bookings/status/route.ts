import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// This endpoint checks various components of the booking system
export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    tests: {},
    counts: {},
    sampleData: {}
  };

  try {
    // Test 1: Database connection
    try {
      console.log('Testing database connection...');
      diagnostics.tests.databaseConnection = { status: 'pending' };
      
      await prisma.$connect();
      diagnostics.tests.databaseConnection = { 
        status: 'success',
        message: 'Connected to database successfully'
      };
    } catch (dbError) {
      console.error('Database connection test failed:', dbError);
      diagnostics.tests.databaseConnection = { 
        status: 'failed',
        error: dbError instanceof Error ? dbError.message : 'Unknown database connection error'
      };
      
      // Early return if can't connect to database
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Test 2: Count tables
    try {
      console.log('Counting records in tables...');
      diagnostics.tests.recordCounts = { status: 'pending' };
      
      const bookingCount = await prisma.booking.count();
      const serviceCount = await prisma.service.count();
      
      diagnostics.counts = {
        bookings: bookingCount,
        services: serviceCount
      };
      
      diagnostics.tests.recordCounts = { 
        status: 'success',
        message: `Found ${bookingCount} bookings and ${serviceCount} services`
      };
    } catch (countError) {
      console.error('Record count test failed:', countError);
      diagnostics.tests.recordCounts = { 
        status: 'failed',
        error: countError instanceof Error ? countError.message : 'Unknown count error'
      };
    }

    // Test 3: Fetch sample data
    try {
      console.log('Fetching sample data...');
      diagnostics.tests.sampleData = { status: 'pending' };
      
      // Get a sample service
      const sampleService = await prisma.service.findFirst();
      diagnostics.sampleData.service = sampleService;
      
      // Get a sample booking
      const sampleBooking = await prisma.booking.findFirst({
        include: {
          service: true
        }
      });
      
      // Format dates to iso strings if they exist
      const formattedBooking = sampleBooking ? {
        ...sampleBooking,
        date: sampleBooking.date?.toISOString(),
        startTime: sampleBooking.startTime?.toISOString(),
        endTime: sampleBooking.endTime?.toISOString(),
        createdAt: sampleBooking.createdAt?.toISOString(),
        updatedAt: sampleBooking.updatedAt?.toISOString()
      } : null;
      
      diagnostics.sampleData.booking = formattedBooking;
      
      diagnostics.tests.sampleData = { 
        status: 'success',
        message: `Sample data fetched successfully`
      };
    } catch (sampleError) {
      console.error('Sample data test failed:', sampleError);
      diagnostics.tests.sampleData = { 
        status: 'failed',
        error: sampleError instanceof Error ? sampleError.message : 'Unknown sample data error'
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Diagnostics failed:', error);
    return NextResponse.json(
      { 
        error: 'Diagnostics failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        partialDiagnostics: diagnostics
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected after diagnostics');
  }
} 