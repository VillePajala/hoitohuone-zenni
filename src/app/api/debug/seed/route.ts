import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force the route to be dynamic and bypass middleware
export const dynamic = 'force-dynamic';

// This is a debug/development endpoint to seed the database with test data
export async function GET() {
  try {
    console.log('Debug seed endpoint called');
    
    // Connect to database
    await prisma.$connect();
    console.log('Database connected for seeding');

    // Create a test service if none exists
    let service = await prisma.service.findFirst();
    
    if (!service) {
      console.log('No services found, creating test service');
      service = await prisma.service.create({
        data: {
          name: 'Energy Healing',
          nameEn: 'Energy Healing',
          nameFi: 'Energiahoito',
          description: 'Energy healing session for relaxation and balance',
          descriptionEn: 'Energy healing session for relaxation and balance',
          descriptionFi: 'Energiahoitosessio rentoutumiseen ja tasapainoon',
          duration: 60,
          price: 80,
          currency: 'EUR',
          active: true,
        }
      });
      console.log('Created test service:', service.id);
    } else {
      console.log('Found existing service:', service.id);
    }

    // Count existing bookings
    const bookingCount = await prisma.booking.count();
    console.log(`Found ${bookingCount} existing bookings`);

    // Create test bookings regardless of whether they exist already
    console.log('Creating test bookings...');
      
    // Create test bookings with proper date handling
    const baseDate = new Date();
    
    // Create a date object for today at midnight
    const today = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate()
    );
    
    // Create a date object for tomorrow at midnight
    const tomorrow = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate() + 1
    );
    
    // Helper function to create time objects
    const createTimeObject = (baseDate: Date, hours: number, minutes: number) => {
      return new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hours,
        minutes,
        0,
        0
      );
    };
    
    console.log('Today:', today);
    console.log('Tomorrow:', tomorrow);
    
    try {
      // Booking 1 - Confirmed, today
      const booking1 = await prisma.booking.create({
        data: {
          serviceId: service.id,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          customerPhone: '+358401234567',
          date: today,
          startTime: createTimeObject(today, 10, 0),
          endTime: createTimeObject(today, 11, 0),
          status: 'confirmed',
          language: 'en',
          cancellationId: `test-cancel-${Date.now()}-1`,
          notes: 'Test booking for today'
        }
      });
      console.log('Created booking 1:', booking1.id);
      
      // Booking 2 - Confirmed, tomorrow
      const booking2 = await prisma.booking.create({
        data: {
          serviceId: service.id,
          customerName: 'Jane Smith',
          customerEmail: 'jane@example.com',
          customerPhone: '+358407654321',
          date: tomorrow,
          startTime: createTimeObject(tomorrow, 14, 0),
          endTime: createTimeObject(tomorrow, 15, 0),
          status: 'confirmed',
          language: 'fi',
          cancellationId: `test-cancel-${Date.now()}-2`,
          notes: 'Test booking for tomorrow'
        }
      });
      console.log('Created booking 2:', booking2.id);
      
      // Booking 3 - Cancelled
      const booking3 = await prisma.booking.create({
        data: {
          serviceId: service.id,
          customerName: 'Bob Johnson',
          customerEmail: 'bob@example.com',
          customerPhone: '+358409876543',
          date: tomorrow,
          startTime: createTimeObject(tomorrow, 16, 0),
          endTime: createTimeObject(tomorrow, 17, 0),
          status: 'cancelled',
          language: 'en',
          cancellationId: `test-cancel-${Date.now()}-3`,
          notes: 'Cancelled test booking'
        }
      });
      console.log('Created booking 3:', booking3.id);
      
      console.log('Successfully created 3 test bookings');
    } catch (bookingError) {
      console.error('Error creating bookings:', bookingError);
      return NextResponse.json(
        { 
          error: 'Failed to create bookings', 
          details: bookingError instanceof Error ? bookingError.message : 'Unknown error' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      serviceCount: await prisma.service.count(),
      bookingCount: await prisma.booking.count()
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed database', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected after seeding');
  }
} 