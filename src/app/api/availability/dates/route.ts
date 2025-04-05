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
// TODO: Import date-fns or similar for robust date calculations

// Input validation schema
const QuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2038), // Reasonable year range
  month: z.coerce.number().int().min(1).max(12),
  serviceId: z.string().uuid(),
});

// Helper to parse time string (HH:MM:SS) into a Date object relative to a base date
function parseTimeString(timeString: string, baseDate: Date): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Validate query parameters
  const validation = QuerySchema.safeParse({
    year: searchParams.get('year'),
    month: searchParams.get('month'),
    serviceId: searchParams.get('serviceId'),
  });

  if (!validation.success) {
    return NextResponse.json(
      { error: { code: 'BAD_REQUEST', message: 'Invalid query parameters', details: validation.error.errors } }, 
      { status: 400 }
    );
  }

  const { year, month, serviceId } = validation.data;

  try {
    // --- 1. Fetch required data --- 

    // Get service duration (needed to check if any slots fit)
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

    // Get availability rules
    const regularHours = await prisma.regularHours.findMany();
    const blockedDatesData = await prisma.blockedDate.findMany();
    const specialDatesData = await prisma.specialDate.findMany();
    // TODO: Fetch existing bookings for the month

    // Fetch bookings for the month
    const monthStartDate = startOfDay(new Date(year, month - 1, 1));
    const monthEndDate = endOfDay(new Date(year, month, 0));

    const bookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: monthStartDate,
          lte: monthEndDate,
        },
        // TODO: Consider booking status? (e.g., only 'confirmed')
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // --- 2. Prepare data structures --- 
    
    // Map availability rules for easier lookup
    const regularHoursMap = new Map(regularHours.map(h => [h.dayOfWeek, h]));
    const blockedDatesSet = new Set(blockedDatesData.map(b => format(parse(b.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd'))); // YYYY-MM-DD
    const specialDatesMap = new Map(specialDatesData.map(s => [format(parse(s.date, 'yyyy-MM-dd', new Date()), 'yyyy-MM-dd'), s])); // YYYY-MM-DD
    // TODO: Prepare booking data for slot checking

    // Group bookings by date string for quick lookup
    const bookingsByDate: Record<string, Array<{ start: Date; end: Date }>> = {};
    bookings.forEach(booking => {
        const dateStr = format(booking.startTime, 'yyyy-MM-dd');
        if (!bookingsByDate[dateStr]) {
            bookingsByDate[dateStr] = [];
        }
        bookingsByDate[dateStr].push({ start: booking.startTime, end: booking.endTime });
    });

    // --- 3. Calculate availability for each day in the month --- 

    const availableDates: string[] = [];
    const blockedDatesResult: string[] = []; // Dates explicitly blocked or implicitly unavailable

    const daysInMonth = new Date(year, month, 0).getDate(); // Get days in the target month
    const today = startOfDay(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, ..., 6 = Saturday

      // Skip past dates
      if (isBefore(currentDate, today)) {
         blockedDatesResult.push(dateStr); // Treat past dates as blocked
         continue;
      }
      
      // Check if explicitly blocked
      if (blockedDatesSet.has(dateStr)) {
        blockedDatesResult.push(dateStr);
        continue;
      }

      // Determine base availability (Special > Regular)
      let dayAvailability = regularHoursMap.get(dayOfWeek);
      const specialDay = specialDatesMap.get(dateStr);
      if (specialDay) {
        dayAvailability = specialDay; // Special date overrides regular hours
      }

      // If no availability rule found or explicitly marked unavailable
      if (!dayAvailability || !dayAvailability.isAvailable) {
        blockedDatesResult.push(dateStr);
        continue;
      }

      // --- 4. Calculate potential slots & check against bookings --- 
      let isDayAvailable = false;
      const dayStartTime = parseTimeString(dayAvailability.startTime, currentDate);
      const dayEndTime = parseTimeString(dayAvailability.endTime, currentDate);
      const todaysBookings = bookingsByDate[dateStr] || [];

      // Iterate potential start times with service duration interval
      // Using eachMinuteOfInterval might be too granular for long ranges, 
      // consider a loop with manual increment if performance is an issue.
      const potentialSlots = eachMinuteOfInterval(
        { start: dayStartTime, end: dayEndTime }, 
        { step: 15 } // Check every 15 mins (adjust step as needed)
      );

      for (const potentialStartTime of potentialSlots) {
          const potentialEndTime = addMinutes(potentialStartTime, serviceDuration);

          // Slot must end before or exactly at the day's closing time
          if (isBefore(dayEndTime, potentialEndTime) || isEqual(dayEndTime, potentialStartTime)) {
              // If potential start time is exactly the end time, it's invalid
              // If potential end time goes past closing time, stop checking for this day
              break; 
          }

          // Check for overlap with existing bookings
          let overlap = false;
          for (const booking of todaysBookings) {
              if (areIntervalsOverlapping(
                  { start: potentialStartTime, end: potentialEndTime },
                  { start: booking.start, end: booking.end },
                  { inclusive: false } // Intervals don't overlap if they just touch
              )) {
                  overlap = true;
                  break;
              }
          }

          if (!overlap) {
              isDayAvailable = true; // Found at least one valid slot
              break; // No need to check further slots for this day
          }
      }

      if (isDayAvailable) {
        availableDates.push(dateStr);
      } else {
        blockedDatesResult.push(dateStr);
      }
    }

    return NextResponse.json({ availableDates, blockedDates: blockedDatesResult });

  } catch (error) {
    console.error("Failed to fetch available dates:", error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch available dates' } }, 
      { status: 500 }
    );
  }
} 