import { prisma } from '@/lib/prisma';
import {
  parse, 
  format, 
  addMinutes, 
  isBefore, 
  isEqual, 
  startOfDay, 
  endOfDay, 
  areIntervalsOverlapping 
} from 'date-fns';

/**
 * Checks if a specific time slot is available for booking.
 * 
 * @param startTime The proposed start time for the booking.
 * @param serviceId The ID of the service being booked.
 * @returns Promise resolving to an object: 
 *          { available: true, endTime: Date } if the slot is available,
 *          { available: false, error: string } if the slot is not available (with reason).
 */
export async function checkSlotAvailability(
  startTime: Date,
  serviceId: string
): Promise<{ available: boolean; endTime?: Date; error?: string }> {
  try {
    const dateStr = format(startTime, 'yyyy-MM-dd');
    const dayOfWeek = startTime.getDay();

    // --- 1. Basic Checks (Past date, Blocked) --- 
    const today = startOfDay(new Date());
    if (isBefore(startTime, today)) {
      return { available: false, error: "Cannot book in the past" };
    }
    const blocked = await prisma.blockedDate.findUnique({ where: { date: dateStr } });
    if (blocked) {
      return { available: false, error: "Date is blocked" };
    }

    // --- 2. Fetch Service and Availability Rules --- 
    const service = await prisma.service.findUnique({
      where: { id: serviceId, active: true },
      select: { duration: true },
    });
    if (!service) {
      return { available: false, error: "Service not found or inactive" };
    }
    const serviceDuration = service.duration;
    const endTime = addMinutes(startTime, serviceDuration);

    const specialDay = await prisma.specialDate.findUnique({ where: { date: dateStr } });
    const regularDayHours = await prisma.regularHours.findUnique({ where: { dayOfWeek } });

    let effectiveStartTimeStr: string | null = null;
    let effectiveEndTimeStr: string | null = null;
    let effectiveIsAvailable: boolean = false;

    if (specialDay) {
        effectiveStartTimeStr = specialDay.startTime;
        effectiveEndTimeStr = specialDay.endTime;
        effectiveIsAvailable = specialDay.isAvailable;
    } else if (regularDayHours) {
        effectiveStartTimeStr = regularDayHours.startTime;
        effectiveEndTimeStr = regularDayHours.endTime;
        effectiveIsAvailable = regularDayHours.isAvailable;
    }

    if (!effectiveIsAvailable || !effectiveStartTimeStr || !effectiveEndTimeStr) {
      return { available: false, error: "Outside of available hours" };
    }

    // --- 3. Check Time Boundaries --- 
    const dayStartBoundary = parseTimeString(effectiveStartTimeStr, startTime);
    const dayEndBoundary = parseTimeString(effectiveEndTimeStr, startTime);

    // Check if proposed startTime is before opening or exactly at/after closing
    if (isBefore(startTime, dayStartBoundary) || !isBefore(startTime, dayEndBoundary)) {
        return { available: false, error: "Time slot starts outside opening hours" };
    }
    // Check if calculated endTime is after closing time
    if (isBefore(dayEndBoundary, endTime)) {
        return { available: false, error: "Time slot ends after closing hours" };
    }

    // --- 4. Check Overlap with Existing Bookings --- 
    const dateStart = startOfDay(startTime);
    const dateEnd = endOfDay(startTime);
    const bookings = await prisma.booking.findMany({
      where: {
        startTime: { gte: dateStart, lte: dateEnd },
        status: 'confirmed', // Only check against confirmed
      },
      select: { startTime: true, endTime: true },
    });

    for (const booking of bookings) {
      if (areIntervalsOverlapping(
          { start: startTime, end: endTime },
          { start: booking.startTime, end: booking.endTime },
          { inclusive: false }
      )) {
        return { available: false, error: "Time slot conflicts with an existing booking" };
      }
    }

    // --- Slot is Available --- 
    return { available: true, endTime };

  } catch (error) {
    console.error("Error checking slot availability:", error);
    return { available: false, error: "Internal server error during availability check" };
  }
}

// Helper function
function parseTimeString(timeString: string, baseDate: Date): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date(baseDate);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}
 