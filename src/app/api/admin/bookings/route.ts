import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/bookings
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching bookings...');
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Count bookings to check if database has any
    const bookingCount = await prisma.booking.count();
    console.log(`Total bookings in database: ${bookingCount}`);

    if (bookingCount === 0) {
      console.log('No bookings found in database');
      return NextResponse.json([], { status: 200 });
    }

    // Directly get all bookings
    const bookings = await prisma.booking.findMany({
      include: {
        service: true
      }
    });
    
    console.log(`Found ${bookings.length} bookings`);
    
    // Format bookings for the frontend
    const formattedBookings = bookings.map(booking => {
      console.log(`Booking ${booking.id} status: "${booking.status}"`);
      
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
    });

    return NextResponse.json(formattedBookings);
    
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 