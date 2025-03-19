import { 
  createGetHandler,
  success,
  validationError,
  notFound,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { format, parse, add } from 'date-fns';

// Query parameters validation schema
interface TimeSlotQueryParams {
  date: string;
  serviceId?: string;
}

const querySchema = createObjectValidator<TimeSlotQueryParams>({
  date: string({ required: true }),
  serviceId: string()
});

// GET /api/time-slots?date=YYYY-MM-DD&serviceId=xxx
export const GET = createGetHandler(
  async ({ query, requestId }) => {
    const { date, serviceId } = query as TimeSlotQueryParams;
    
    log.info('Fetching time slots', { requestId, date, serviceId });
    
    // Validate date format
    try {
      parse(date, 'yyyy-MM-dd', new Date());
    } catch (error) {
      log.warn('Invalid date format', { requestId, date });
      return validationError('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Check if the date is blocked
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
        }
      }
    });
    
    if (blockedDate) {
      log.info('Date is blocked', { requestId, date, blockedDateId: blockedDate.id });
      return success({ timeSlots: [] });
    }
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = new Date(date).getDay();
    
    // Get availability settings for the day of the week
    const availabilitySettings = await prisma.availability.findMany({
      where: { dayOfWeek, isAvailable: true }
    });
    
    if (availabilitySettings.length === 0) {
      log.info('No availability set for this day', { requestId, date, dayOfWeek });
      return success({ timeSlots: [] });
    }
    
    // Get service duration if serviceId is provided
    let serviceDuration = 60; // Default 60 minutes
    
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, active: true }
      });
      
      if (!service) {
        log.info('Service not found or inactive', { requestId, serviceId });
        return notFound('Service not found or inactive');
      }
      
      serviceDuration = service.duration;
    }
    
    // Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: {
          gte: new Date(date + 'T00:00:00'),
          lt: new Date(date + 'T23:59:59')
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
      date, 
      bookingCount: existingBookings.length 
    });
    
    // Generate time slots based on availability settings
    const timeSlots = [];
    
    for (const setting of availabilitySettings) {
      const [startHour, startMinute] = setting.startTime.split(':').map(Number);
      const [endHour, endMinute] = setting.endTime.split(':').map(Number);
      
      const startTimeMinutes = startHour * 60 + startMinute;
      const endTimeMinutes = endHour * 60 + endMinute;
      
      // Generate time slots based on service duration or default increment
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
    
    log.info('Generated time slots', { 
      requestId, 
      date, 
      serviceDuration,
      timeSlotCount: timeSlots.length 
    });
    
    return success({ 
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