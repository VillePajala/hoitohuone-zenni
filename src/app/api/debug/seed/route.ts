import { prisma } from '@/lib/prisma';
import { createAuthenticatedHandler, withRequestLogging, withErrorHandling } from '@/lib/api/authHandler';
import { NextRequest } from 'next/server';

// Force the route to be dynamic and bypass middleware
export const dynamic = 'force-dynamic';

// GET /api/debug/seed - Seed the database with test data
export const GET = createAuthenticatedHandler(
  async (request: NextRequest, context) => {
    const { requestId } = context;
    
    try {
      // Connect to database
      await prisma.$connect();

      // Create a test service if none exists
      let service = await prisma.service.findFirst();
      
      if (!service) {
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
      }

      // Count existing bookings
      const bookingCount = await prisma.booking.count();

      // Create test bookings regardless of whether they exist already
        
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
      } catch (bookingError) {
        return Response.json(
          {
            error: 'Failed to create bookings',
            details: bookingError instanceof Error ? bookingError.message : 'Unknown error'
          },
          { status: 400 }
        );
      }

      // Get final counts
      const finalServiceCount = await prisma.service.count();
      const finalBookingCount = await prisma.booking.count();

      return Response.json({
        message: 'Database seeded successfully',
        serviceCount: finalServiceCount,
        bookingCount: finalBookingCount
      });
    } catch (error) {
      return Response.json(
        {
          error: 'Failed to seed database',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 400 }
      );
    } finally {
      await prisma.$disconnect();
    }
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