import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parseISO, startOfDay, endOfDay, isValid, addMinutes } from 'date-fns';
import { checkSlotAvailability } from '@/lib/availability';

// Validation schema for optional query parameters
const QuerySchema = z.object({
  from: z.string().refine((d) => !d || isValid(parseISO(d)), { message: 'Invalid from date format' }).optional(),
  to: z.string().refine((d) => !d || isValid(parseISO(d)), { message: 'Invalid to date format' }).optional(),
  status: z.string().optional(),
  // TODO: Add pagination parameters (e.g., page, pageSize)
});

export async function GET(request: Request) {
  // TODO: Add authentication and authorization check here or rely on middleware
  // const { userId } = auth(); -> Requires Clerk setup
  // if (!userId || !(await hasPermission(userId, 'manage_bookings'))) { ... }

  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const validation = QuerySchema.safeParse({
    from: searchParams.get('from'),
    to: searchParams.get('to'),
    status: searchParams.get('status'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters', details: validation.error.format() } },
      { status: 400 }
    );
  }

  const { from, to, status } = validation.data;

  // Build Prisma query conditions
  const where: any = {}; // Using 'any' for dynamic where clause, consider alternatives

  if (status) {
    where.status = status;
  }

  if (from || to) {
    where.startTime = {};
    if (from) {
      // Ensure we get the start of the 'from' day
      where.startTime.gte = startOfDay(parseISO(from)); 
    }
    if (to) {
      // Ensure we include the entire 'to' day
      where.startTime.lte = endOfDay(parseISO(to)); 
    }
  }

  // TODO: Implement pagination logic (using take, skip)
  const page = 1; // Placeholder
  const pageSize = 10; // Placeholder
  const skip = (page - 1) * pageSize;

  try {
    const [bookings, totalBookings] = await prisma.$transaction([
      prisma.booking.findMany({
        where,
        include: { 
          service: { // Include related service data
            select: { 
              title: true, // Select appropriate title based on language later?
              titleEn: true,
              titleFi: true,
            }
          }
        },
        orderBy: {
          startTime: 'asc', // Default order
        },
        // take: pageSize, // TODO: Uncomment when pagination params are implemented
        // skip: skip,     // TODO: Uncomment when pagination params are implemented
      }),
      prisma.booking.count({ where }), // Get total count for pagination
    ]);

    // Format the response to match the API specification
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      serviceId: booking.serviceId,
      // Select appropriate title based on booking language or default
      serviceName: booking.service[booking.language === 'en' ? 'titleEn' : 'titleFi'] || booking.service.title,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      language: booking.language,
      notes: booking.notes,
      status: booking.status,
      createdAt: booking.createdAt.toISOString(),
      // cancellationId is not included in the admin list view per spec
      // updatedAt is not included in the admin list view per spec
    }));

    // TODO: Calculate pagination details correctly
    const totalPages = Math.ceil(totalBookings / pageSize);
    const pagination = {
      total: totalBookings,
      page: page,
      pageSize: pageSize,
      pages: totalPages,
    };

    return NextResponse.json({ bookings: formattedBookings, pagination });

  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch bookings' } },
      { status: 500 }
    );
  }
}

// --- POST Handler --- 

// Zod schema for Admin Create Booking
const AdminCreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().refine((time) => isValid(parseISO(time)), {
    message: "Invalid ISO 8601 startTime string",
  }),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  language: z.enum(['en', 'fi']).default('fi'),
  notes: z.string().max(500).optional(),
  sendConfirmation: z.boolean().default(true).optional(),
  // Admin might set status directly, but default to confirmed for simplicity now
  // status: z.string().optional(), 
});

export async function POST(request: Request) {
    // TODO: Add authentication and authorization check
    // const { userId } = auth(); 
    // if (!userId || !(await hasPermission(userId, 'manage_bookings'))) { ... }

    try {
        const body = await request.json();
        const validation = AdminCreateBookingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: { code: 'BAD_REQUEST', message: 'Invalid request body', details: validation.error.format() } },
                { status: 400 }
            );
        }

        const {
            serviceId,
            startTime: startTimeStr,
            customerName,
            customerEmail,
            customerPhone,
            language,
            notes,
            sendConfirmation
        } = validation.data;

        const startTime = parseISO(startTimeStr);

        // --- Validate Slot Availability --- 
        const availabilityResult = await checkSlotAvailability(startTime, serviceId);
        if (!availabilityResult.available || !availabilityResult.endTime) {
            return NextResponse.json(
                { error: { code: 'CONFLICT', message: availabilityResult.error || 'Requested time slot is not available' } },
                { status: 409 }
            );
        }
        const endTime = availabilityResult.endTime;

        // --- Create Booking --- 
        // Admin creation doesn't necessarily need a public cancellation ID
        const newBooking = await prisma.booking.create({
            data: {
                serviceId,
                startTime,
                endTime,
                customerName,
                customerEmail,
                customerPhone,
                language,
                notes,
                status: 'confirmed', // Default status
                // No cancellationId needed for admin bookings? Or generate anyway?
            },
            // Select fields based on Admin POST response spec (section 6.3)
            select: {
                id: true,
                serviceId: true,
                startTime: true,
                endTime: true,
                status: true,
            }
        });

        // TODO: If sendConfirmation is true, send email
        if (sendConfirmation) {
            console.log(`TODO: Send confirmation email for booking ${newBooking.id} to ${customerEmail}`);
        }

        return NextResponse.json({ booking: newBooking }, { status: 201 });

    } catch (error) {
        console.error("Failed to create admin booking:", error);
        if (error instanceof Error && 'code' in error && error.code === 'P2002') {
            return NextResponse.json(
                { error: { code: 'CONFLICT', message: 'Time slot conflict occurred during creation.' } },
                { status: 409 }
            );
        }
        return NextResponse.json(
            { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create booking' } },
            { status: 500 }
        );
    }
} 