import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Zod schema for validating the query parameters
const QuerySchema = z.object({
  id: z.string().uuid('Invalid booking ID format'),
  cancellationId: z.string().uuid('Invalid cancellation ID format'),
});

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const validation = QuerySchema.safeParse({
    id: searchParams.get('id'),
    cancellationId: searchParams.get('cancellationId'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters', details: validation.error.format() } }, 
      { status: 400 }
    );
  }

  const { id, cancellationId } = validation.data;

  try {
    // Find the booking matching both ID and cancellation ID
    const booking = await prisma.booking.findUnique({
      where: {
        id: id,
        cancellationId: cancellationId,
      },
      select: { 
        id: true, 
        status: true 
        // Optionally: startTime to check cancellation window
      },
    });

    // If no booking found or cancellation ID doesn't match
    if (!booking) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Booking not found or cancellation ID is invalid.' } }, 
        { status: 404 }
      );
    }

    // Check if already cancelled
    if (booking.status === 'cancelled') {
        return NextResponse.json(
            { success: true, message: 'Booking was already cancelled.' }, 
            { status: 200 }
        );
    }

    // TODO: Add logic here to check if cancellation is allowed 
    // (e.g., must be > 24 hours before startTime). If not allowed, return 403 Forbidden.

    // Update the booking status to cancelled
    await prisma.booking.update({
      where: {
        id: id,
        // Double check cancellationId again in where clause for safety (optional but good practice)
        cancellationId: cancellationId, 
      },
      data: {
        status: 'cancelled',
        // Optionally clear cancellationId after use?
        // cancellationId: null, 
      },
    });

    // TODO: Send cancellation confirmation email

    return NextResponse.json(
      { success: true, message: 'Booking has been successfully canceled' }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to cancel booking' } }, 
      { status: 500 }
    );
  }
} 