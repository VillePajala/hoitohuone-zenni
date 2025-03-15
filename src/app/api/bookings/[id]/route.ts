import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/bookings/:id - Get booking details by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      },
      include: {
        service: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(booking, { status: 200 });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH /api/bookings/:id - Update booking status
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body = await request.json();
    const { status } = body;

    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, cancelled, completed' },
        { status: 400 }
      );
    }

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const updatedBooking = await prisma.booking.update({
      where: {
        id: bookingId
      },
      data: {
        status
      }
    });

    return NextResponse.json(
      { 
        booking: updatedBooking,
        message: `Booking status updated to ${status}`
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// DELETE /api/bookings/:id - Cancel a booking
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;

    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // We don't actually delete the booking, just mark it as cancelled
    const cancelledBooking = await prisma.booking.update({
      where: {
        id: bookingId
      },
      data: {
        status: 'cancelled'
      }
    });

    return NextResponse.json(
      { 
        booking: cancelledBooking,
        message: 'Booking cancelled successfully'
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
} 