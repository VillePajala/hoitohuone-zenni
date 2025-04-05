import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import {
  parse, 
  format, 
  addMinutes, 
  isBefore, 
  isEqual, 
  startOfDay, 
  endOfDay, 
  eachMinuteOfInterval, 
  areIntervalsOverlapping 
} from 'date-fns';

// Input validation schema
const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  serviceId: z.string().uuid(),
});

// Helper (same as in /dates route)
function parseTimeString(timeString: string, baseDate: Date): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const validation = QuerySchema.safeParse({
    date: searchParams.get('date'),
    serviceId: searchParams.get('serviceId'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters', details: validation.error.errors } }, 
      { status: 400 }
    );
  }

  const { date: dateStr, serviceId } = validation.data;
  // Ensure targetDate is parsed correctly in the server's local time zone
  const targetDate = parse(dateStr, 'yyyy-MM-dd', new Date()); 
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, ..., 6 = Saturday

  try {
    // --- 1. Check if date is in the past or blocked --- 
    const today = startOfDay(new Date());
    if (isBefore(targetDate, today)) {
      return NextResponse.json({ availableSlots: [] }); // No slots for past dates
    }

    const blocked = await prisma.blockedDate.findUnique({
      where: { date: dateStr },
    });
    if (blocked) {
      return NextResponse.json({ availableSlots: [] }); // Date is explicitly blocked
    }

    // --- 2. Fetch required data --- 
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true },
      select: { duration: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Active service not found' } }, 
        { status: 404 }
      );
    }
    const serviceDuration = service.duration;

    // Determine effective availability for the target date
    const specialDay = await prisma.specialDate.findUnique({ where: { date: dateStr } });
    const regularDayHours = await prisma.regularHours.findUnique({ where: { dayOfWeek } });

    let effectiveStartTime: string | null = null;
    let effectiveEndTime: string | null = null;
    let effectiveIsAvailable: boolean = false;

    if (specialDay) { // Special date takes precedence
        effectiveStartTime = specialDay.startTime;
        effectiveEndTime = specialDay.endTime;
        effectiveIsAvailable = specialDay.isAvailable;
    } else if (regularDayHours) { // Fallback to regular hours
        effectiveStartTime = regularDayHours.startTime;
        effectiveEndTime = regularDayHours.endTime;
        effectiveIsAvailable = regularDayHours.isAvailable;
    }

    // If day is unavailable (no rule or explicitly marked unavailable)
    if (!effectiveIsAvailable || !effectiveStartTime || !effectiveEndTime) {
      return NextResponse.json({ availableSlots: [] });
    }

    // Fetch bookings for the target date
    const dateStart = startOfDay(targetDate);
    const dateEnd = endOfDay(targetDate);
    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: dateStart,
          lte: dateEnd,
        },
        status: 'confirmed', // Only consider confirmed bookings
      },
      select: { startTime: true, endTime: true },
    });
    const todaysBookings = bookings.map(b => ({ start: b.startTime, end: b.endTime }));

    // --- 3. Calculate available slots --- 
    const availableSlots: Array<{ startTime: string; endTime: string }> = [];
    // Use the determined effective start/end times
    const dayStartTime = parseTimeString(effectiveStartTime, targetDate);
    const dayEndTime = parseTimeString(effectiveEndTime, targetDate);

    // Use a step based on typical booking intervals (e.g., 15 minutes)
    const stepMinutes = 15; 

    let currentPotentialStartTime = dayStartTime;
    while (isBefore(currentPotentialStartTime, dayEndTime)) {
      const potentialEndTime = addMinutes(currentPotentialStartTime, serviceDuration);

      // Check if the slot ends after the allowed end time
      if (isBefore(dayEndTime, potentialEndTime)) {
        break; // Stop if the slot goes beyond the end time
      }

      // Check for overlap with existing bookings
      let overlap = false;
      for (const booking of todaysBookings) {
        if (areIntervalsOverlapping(
            { start: currentPotentialStartTime, end: potentialEndTime },
            { start: booking.start, end: booking.end },
            { inclusive: false } // Don't count touching intervals as overlapping
        )) {
          overlap = true;
          break;
        }
      }

      if (!overlap) {
        availableSlots.push({
          startTime: currentPotentialStartTime.toISOString(),
          endTime: potentialEndTime.toISOString(),
        });
      }

      // Move to the next potential start time based on the step
      currentPotentialStartTime = addMinutes(currentPotentialStartTime, stepMinutes);
    }

    return NextResponse.json({ availableSlots });

  } catch (error) {
    console.error("Failed to fetch available slots:", error);
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch available slots',
        },
      },
      { status: 500 }
    );
  }
} 