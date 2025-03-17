import { NextResponse } from 'next/server';
import { add, format, parse } from 'date-fns';

// Mock function to get available time slots
// In production, this would query the database for actual availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const serviceId = searchParams.get('serviceId');

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // For demo purposes, generate time slots between 9 AM and 5 PM
    // In a real application, these would be fetched from your database
    const selectedDate = parse(date, 'yyyy-MM-dd', new Date());
    const startTime = new Date(selectedDate);
    startTime.setHours(9, 0, 0, 0); // 9:00 AM
    
    const endTime = new Date(selectedDate);
    endTime.setHours(17, 0, 0, 0); // 5:00 PM
    
    // Generate time slots in 60-minute increments
    const timeSlots = [];
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const slotStart = format(currentTime, 'HH:mm');
      
      // Add duration (using 60 minutes as default)
      const slotEnd = format(add(currentTime, { minutes: 60 }), 'HH:mm');
      
      // Add some randomness to availability (80% chance a slot is available)
      if (Math.random() > 0.2) {
        timeSlots.push({
          startTime: slotStart,
          endTime: slotEnd
        });
      }
      
      // Move to next slot
      currentTime = add(currentTime, { minutes: 60 });
    }

    return NextResponse.json({ timeSlots }, { status: 200 });
  } catch (error) {
    console.error('Error getting time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
} 