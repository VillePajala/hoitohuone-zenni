import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Debug: Database connection successful');
    } catch (dbError) {
      console.error('Debug: Database connection failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed', details: dbError },
        { status: 500 }
      );
    }

    // Get all bookings with minimal processing
    const bookings = await prisma.booking.findMany({
      include: {
        service: true
      }
    });
    
    console.log(`Debug: Found ${bookings.length} bookings`);
    
    // Return raw bookings with stringified dates
    const debugBookings = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      serviceId: booking.serviceId,
      serviceName: booking.service.name,
      serviceNameFi: booking.service.nameFi,
      rawDate: booking.date,
      dateString: booking.date.toISOString(),
      dateConstructor: booking.date.constructor.name,
      rawStartTime: booking.startTime,
      startTimeString: booking.startTime.toISOString(),
      rawEndTime: booking.endTime,
      endTimeString: booking.endTime.toISOString(),
      status: booking.status
    }));

    return NextResponse.json({
      count: bookings.length,
      bookings: debugBookings
    });
    
  } catch (error) {
    console.error('Debug: Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 