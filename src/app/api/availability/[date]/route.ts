import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/availability/[date]?serviceId=xxx
export async function GET(
  req: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const serviceId = searchParams.get('serviceId');
    
    if (!serviceId) {
      return NextResponse.json(
        { error: 'Service ID is required' },
        { status: 400 }
      );
    }
    
    // Parse the date string to a Date object
    const date = new Date(params.date);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Get the day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = date.getDay();
    
    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        }
      }
    });
    
    if (blockedDate) {
      return NextResponse.json({
        available: false,
        message: 'This date is not available for booking',
        timeSlots: []
      });
    }
    
    // Get the service details to determine duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });
    
    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }
    
    // Get availability settings for the day of the week
    const availabilitySettings = await prisma.availability.findMany({
      where: { dayOfWeek, isAvailable: true }
    });
    
    if (availabilitySettings.length === 0) {
      return NextResponse.json({
        available: false,
        message: 'No availability set for this day',
        timeSlots: []
      });
    }
    
    // Create a new date object for comparison (without changing the original date)
    const compareDate = new Date(date);
    
    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(compareDate.setHours(0, 0, 0, 0)),
          lt: new Date(compareDate.setHours(23, 59, 59, 999))
        },
        status: 'confirmed'
      },
      select: {
        startTime: true,
        endTime: true
      }
    });
    
    // Calculate available time slots based on:
    // 1. Availability settings
    // 2. Existing bookings
    // 3. Service duration
    
    const serviceDuration = service.duration; // Duration in minutes
    const timeSlots = [];
    
    for (const setting of availabilitySettings) {
      const [startHour, startMinute] = setting.startTime.split(':').map(Number);
      const [endHour, endMinute] = setting.endTime.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Generate potential 30-minute time slots
      for (let time = startTimeMinutes; time + serviceDuration <= endTimeMinutes; time += 30) {
        const slotStartHour = Math.floor(time / 60);
        const slotStartMinute = time % 60;
        
        const slotEndHour = Math.floor((time + serviceDuration) / 60);
        const slotEndMinute = (time + serviceDuration) % 60;
        
        const slotStartTime = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
        const slotEndTime = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;
        
        // Check if this slot overlaps with any existing booking
        const isBooked = existingBookings.some(booking => {
          // Get hours and minutes from DateTime objects
          const startDateTime = new Date(booking.startTime);
          const endDateTime = new Date(booking.endTime);
          
          const bookingStartHour = startDateTime.getHours();
          const bookingStartMinute = startDateTime.getMinutes();
          const bookingEndHour = endDateTime.getHours();
          const bookingEndMinute = endDateTime.getMinutes();
          
          const bookingStartMinutes = bookingStartHour * 60 + bookingStartMinute;
          const bookingEndMinutes = bookingEndHour * 60 + bookingEndMinute;
          
          // Check for overlap
          return (
            (time < bookingEndMinutes && time + serviceDuration > bookingStartMinutes) ||
            (bookingStartMinutes < time + serviceDuration && bookingEndMinutes > time)
          );
        });
        
        if (!isBooked) {
          timeSlots.push({
            startTime: slotStartTime,
            endTime: slotEndTime
          });
        }
      }
    }
    
    return NextResponse.json({
      available: timeSlots.length > 0,
      message: timeSlots.length > 0 ? 'Available time slots found' : 'No available time slots for this date',
      timeSlots
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
} 