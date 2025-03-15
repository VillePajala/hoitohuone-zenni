import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/availability/:date - Get available time slots for a specific date
export async function GET(
  request: Request,
  { params }: { params: { date: string } }
) {
  try {
    const dateParam = params.date;
    const date = new Date(dateParam);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = date.getDay();
    
    // Get regular availability for this day of week
    const availabilitySettings = await prisma.availability.findMany({
      where: {
        dayOfWeek,
        isAvailable: true
      }
    });

    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });

    if (blockedDate) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'This date is not available for booking.',
          timeSlots: []
        },
        { status: 200 }
      );
    }

    // If no availability settings for this day, return empty
    if (availabilitySettings.length === 0) {
      return NextResponse.json(
        { 
          available: false, 
          message: 'No available time slots for this date.',
          timeSlots: []
        }, 
        { status: 200 }
      );
    }

    // Get bookings for this date to block already booked slots
    const bookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999))
        },
        status: {
          not: 'cancelled'
        }
      },
      select: {
        startTime: true,
        endTime: true
      }
    });

    // Generate time slots based on availability settings
    const timeSlots = [];

    for (const setting of availabilitySettings) {
      const [startHour, startMinute] = setting.startTime.split(':').map(Number);
      const [endHour, endMinute] = setting.endTime.split(':').map(Number);
      
      // Create slots at 30-minute intervals
      const slotDate = new Date(date);
      slotDate.setHours(startHour, startMinute, 0, 0);
      
      const endTime = new Date(date);
      endTime.setHours(endHour, endMinute, 0, 0);
      
      while (slotDate < endTime) {
        const slotStartTime = new Date(slotDate);
        const slotEndTime = new Date(slotDate);
        slotEndTime.setMinutes(slotEndTime.getMinutes() + 30);

        // Check if this slot overlaps with any booking
        const isBooked = bookings.some((booking: { startTime: Date, endTime: Date }) => {
          const bookingStart = new Date(booking.startTime);
          const bookingEnd = new Date(booking.endTime);
          
          return (
            (slotStartTime >= bookingStart && slotStartTime < bookingEnd) ||
            (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
            (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
          );
        });

        if (!isBooked) {
          timeSlots.push({
            startTime: slotStartTime.toISOString(),
            endTime: slotEndTime.toISOString()
          });
        }

        // Move to next slot
        slotDate.setMinutes(slotDate.getMinutes() + 30);
      }
    }

    return NextResponse.json(
      { 
        available: timeSlots.length > 0,
        timeSlots,
        date: dateParam
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
} 