import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/bookings/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const id = params.id;
    
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        service: true,
        date: true,
        startTime: true,
        endTime: true,
        notes: true,
        status: true,
        createdAt: true
      }
    });
    
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/bookings/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const id = params.id;
    const body = await req.json();
    
    // Validate request body
    const { notes, status } = body;
    
    // Check if booking exists
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        notes: notes !== undefined ? notes : undefined,
        status: status !== undefined ? status : undefined,
        // If status is changed to cancelled, update cancelledAt
        ...(status === 'cancelled' && existingBooking.status !== 'cancelled'
          ? { cancelledAt: new Date() }
          : {})
      },
      select: {
        id: true,
        status: true,
        notes: true,
        updatedAt: true
      }
    });
    
    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

// POST /api/admin/bookings/[id]/cancel
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const id = params.id;
    
    // Check if booking exists and is not already cancelled
    const existingBooking = await prisma.booking.findUnique({
      where: { id }
    });
    
    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }
    
    if (existingBooking.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      );
    }
    
    // Cancel booking
    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledAt: new Date()
      }
    });
    
    // In a production app, you would send cancellation email here
    // await sendBookingCancellationEmailByAdmin(cancelledBooking);
    
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
} 