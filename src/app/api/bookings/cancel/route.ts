import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendBookingCancellationEmail } from '@/lib/emailService';

// POST /api/bookings/cancel - Cancel a booking using cancellationId
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cancellationId } = body;

    if (!cancellationId) {
      return NextResponse.json(
        { error: 'Cancellation ID is required' },
        { status: 400 }
      );
    }

    // Find booking by cancellationId
    const booking = await prisma.booking.findUnique({
      where: {
        cancellationId
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found with the provided cancellation ID' },
        { status: 404 }
      );
    }

    // Check if booking is already cancelled
    if (booking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }

    // Check if booking date is in the past
    const now = new Date();
    if (booking.startTime < now) {
      return NextResponse.json(
        { error: 'Cannot cancel past bookings' },
        { status: 400 }
      );
    }

    // Get the service details for the email
    const service = await prisma.service.findUnique({
      where: {
        id: booking.serviceId
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 500 }
      );
    }

    // Update booking status to cancelled
    const updatedBooking = await prisma.booking.update({
      where: {
        id: booking.id
      },
      data: {
        status: 'cancelled'
      }
    });

    // Send cancellation confirmation email
    try {
      await sendBookingCancellationEmail(updatedBooking, service);
      console.log('Cancellation email sent successfully');
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Continue with cancellation even if email fails
    }

    return NextResponse.json(
      { 
        booking: updatedBooking,
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

// GET /api/bookings/cancel?id={cancellationId} - Get booking info for cancellation page
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cancellationId = searchParams.get('id');

    if (!cancellationId) {
      return NextResponse.json(
        { error: 'Cancellation ID is required' },
        { status: 400 }
      );
    }

    // Find booking by cancellationId
    const booking = await prisma.booking.findUnique({
      where: {
        cancellationId
      },
      include: {
        service: true
      }
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found with the provided cancellation ID' },
        { status: 404 }
      );
    }

    // Remove sensitive or unnecessary data before sending to the client
    const bookingInfo = {
      id: booking.id,
      customerName: booking.customerName,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      service: {
        id: booking.service.id,
        name: booking.service.name,
        nameEn: booking.service.nameEn,
        nameFi: booking.service.nameFi,
        duration: booking.service.duration
      }
    };

    return NextResponse.json({ booking: bookingInfo }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving booking info:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve booking information' },
      { status: 500 }
    );
  }
} 