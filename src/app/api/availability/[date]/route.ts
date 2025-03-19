import { prisma } from '@/lib/prisma';
import { 
  createGetHandler,
  success,
  notFound,
  validationError,
  log,
  string,
  createObjectValidator
} from '@/lib/api';

// Define interface for typed query parameters
interface AvailabilityQueryParams {
  serviceId: string;
}

// Query parameters validation schema
const querySchema = createObjectValidator<AvailabilityQueryParams>({
  serviceId: string({ required: true })
});

// GET /api/availability/[date]?serviceId=xxx
export const GET = createGetHandler(
  async ({ params, query, requestId }) => {
    const dateParam = params?.date as string;
    const serviceId = query?.serviceId as string;
    
    // Validate date format
    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return validationError('Invalid date format');
    }
    
    log.info('Checking availability for date and service', { requestId, date: dateParam, serviceId });
    
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
      log.info('Date is blocked', { requestId, date: dateParam, blockedDateId: blockedDate.id });
      return success({
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
      log.info('Service not found', { requestId, serviceId });
      return notFound('Service not found');
    }
    
    // Get the day of the week (0-6, where 0 is Sunday)
    const dayOfWeek = date.getDay();
    
    // Get availability settings for the day of the week
    const availabilitySettings = await prisma.availability.findMany({
      where: { dayOfWeek, isAvailable: true }
    });
    
    if (availabilitySettings.length === 0) {
      log.info('No availability set for this day', { requestId, date: dateParam, dayOfWeek });
      return success({
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
    
    log.info('Retrieved existing bookings', { 
      requestId, 
      date: dateParam, 
      bookingCount: existingBookings.length 
    });
    
    // Calculate available time slots
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
    
    log.info('Calculated available time slots', { 
      requestId, 
      date: dateParam, 
      serviceId, 
      timeSlotCount: timeSlots.length 
    });
    
    return success({
      available: timeSlots.length > 0,
      message: timeSlots.length > 0 ? 'Available time slots found' : 'No available time slots for this date',
      timeSlots
    }, {
      requestId,
      headers: {
        'Cache-Control': 'no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  },
  {
    queryValidator: querySchema
  }
); 