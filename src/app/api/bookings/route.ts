import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { parseISO, addMinutes, isValid } from 'date-fns';
import crypto from 'crypto'; // For generating cancellation ID
import { checkSlotAvailability } from '@/lib/availability'; // Import the reusable check
// TODO: Import availability checking logic (or refactor it into a reusable lib function)

// Zod schema for validating the incoming booking request body
const CreateBookingSchema = z.object({
  serviceId: z.string().uuid(),
  startTime: z.string().refine((time) => isValid(parseISO(time)), { 
    message: "Invalid ISO 8601 startTime string",
  }), // Validate as ISO 8601 string
  customerName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(), // Assuming optional based on schema examples
  language: z.enum(['en', 'fi']).default('fi'),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateBookingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid request body',
            details: validation.error.format(), // Use .format() for detailed errors
          },
        },
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
      notes
    } = validation.data;

    const startTime = parseISO(startTimeStr); // Convert validated string to Date

    // --- Use the reusable Slot Availability Check --- 
    const availabilityResult = await checkSlotAvailability(startTime, serviceId);

    if (!availabilityResult.available || !availabilityResult.endTime) {
      return NextResponse.json(
          { error: { code: 'CONFLICT', message: availabilityResult.error || 'Requested time slot is not available' } }, 
          { status: 409 }
      );
    }

    const endTime = availabilityResult.endTime; // Get the validated endTime

    // --- Create Booking --- 
    const cancellationId = crypto.randomUUID();

    const newBooking = await prisma.booking.create({
      data: {
        serviceId,
        startTime,
        endTime, // Use the endTime calculated by checkSlotAvailability
        customerName,
        customerEmail,
        customerPhone,
        language,
        notes,
        status: 'confirmed', // Default to confirmed for now
        cancellationId,
      },
      select: { // Select fields as per API specification
        id: true,
        serviceId: true,
        startTime: true,
        endTime: true,
        status: true,
        cancellationId: true,
      }
    });

    // TODO: Send confirmation email

    return NextResponse.json({ booking: newBooking }, { status: 201 }); // 201 Created

  } catch (error) {
    console.error("Failed to create booking:", error);
    // Handle potential Prisma errors (e.g., unique constraint violation if somehow double-booked)
    if (error instanceof Error && 'code' in error && error.code === 'P2002') { // Prisma unique constraint error
        return NextResponse.json(
            { error: { code: 'CONFLICT', message: 'Time slot conflict occurred during creation.' } }, 
            { status: 409 }
        );
    }
    
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create booking',
        },
      },
      { status: 500 }
    );
  }
} 