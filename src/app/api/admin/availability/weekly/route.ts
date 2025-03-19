import { 
  createGetHandler,
  createPutHandler,
  success,
  unauthorized,
  badRequest,
  log,
  string,
  boolean,
  array,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Force dynamic rendering and bypass middleware caching
export const dynamic = 'force-dynamic';

// Interface for time slot data
interface TimeSlot {
  startTime: string;
  endTime: string;
}

// Interface for a single day's settings
interface DaySettings {
  enabled: boolean;
  timeSlots: TimeSlot[];
}

// Interface for the weekly availability update request body
interface WeeklyAvailabilityRequestBody {
  days: {
    [dayName: string]: DaySettings;
  };
}

// Validation schema for time slots
const timeSlotSchema = createObjectValidator<TimeSlot>({
  startTime: string({ required: true }),
  endTime: string({ required: true })
});

// Validation schema for day settings
const daySettingsSchema = createObjectValidator<DaySettings>({
  enabled: boolean({ required: true }),
  timeSlots: array(timeSlotSchema)
});

// Validation schema for weekly availability update request
const weeklyAvailabilitySchema = createObjectValidator<WeeklyAvailabilityRequestBody>({
  days: createObjectValidator({
    Sunday: daySettingsSchema,
    Monday: daySettingsSchema,
    Tuesday: daySettingsSchema,
    Wednesday: daySettingsSchema,
    Thursday: daySettingsSchema,
    Friday: daySettingsSchema,
    Saturday: daySettingsSchema
  })
});

// GET /api/admin/availability/weekly - Get weekly availability settings
export const GET = createGetHandler(
  async ({ requestId, request }) => {
    log.info('Fetching weekly availability', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for weekly availability GET request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    // Fetch all weekly availability settings
    const availabilityRecords = await prisma.availability.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    
    log.info('Raw availability records retrieved', { 
      requestId, 
      count: availabilityRecords.length 
    });
    
    // Transform into a more user-friendly format grouped by day
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday'
    ];
    
    // Initialize weekly availability with all days disabled by default
    const weeklyAvailability: Record<string, DaySettings> = {};
    
    days.forEach(day => {
      weeklyAvailability[day] = {
        enabled: false,
        timeSlots: []
      };
    });
    
    // Process the records into day-by-day structure
    availabilityRecords.forEach(record => {
      const dayName = days[record.dayOfWeek];
      
      // If this is the first record for this day, mark it as enabled
      if (weeklyAvailability[dayName].timeSlots.length === 0) {
        weeklyAvailability[dayName].enabled = true;
      }
      
      // Add the time slot
      weeklyAvailability[dayName].timeSlots.push({
        startTime: record.startTime,
        endTime: record.endTime
      });
    });
    
    log.info('Weekly availability formatted successfully', { requestId });
    
    return success({ 
      weeklyAvailability,
      rawRecords: availabilityRecords 
    }, { requestId });
  }
);

// PUT /api/admin/availability/weekly - Update weekly availability settings
export const PUT = createPutHandler(
  async ({ body, requestId, request }) => {
    log.info('Updating weekly availability', { requestId });
    
    // Authenticate request
    const authResult = await verifyAuth(request);
    if (!authResult.authenticated) {
      log.warn('Authentication failed for weekly availability PUT request', { 
        requestId, 
        reason: authResult.reason 
      });
      return unauthorized(authResult.reason || 'Unauthorized - Please sign in to access this resource');
    }
    
    log.info('User authenticated', { 
      requestId, 
      userId: authResult.userId 
    });
    
    const { days } = body;
    
    if (!days) {
      log.warn('Missing days data in request body', { requestId });
      return badRequest('Missing days data');
    }
    
    // Helper function to convert day name to number (0-6)
    const getDayOfWeek = (dayName: string): number => {
      const daysMap: Record<string, number> = {
        'Sunday': 0,
        'Monday': 1,
        'Tuesday': 2,
        'Wednesday': 3,
        'Thursday': 4,
        'Friday': 5,
        'Saturday': 6
      };
      
      return daysMap[dayName] || 0;
    };
    
    // Process each day's settings
    const operations = [];
    
    // For each day, delete existing settings and create new ones
    for (const [dayName, settings] of Object.entries(days)) {
      const dayOfWeek = getDayOfWeek(dayName);
      const { enabled, timeSlots } = settings as DaySettings;
      
      log.info('Processing day settings', { 
        requestId, 
        day: dayName, 
        enabled, 
        timeSlotCount: timeSlots.length 
      });
      
      // Delete existing settings for this day
      operations.push(
        prisma.availability.deleteMany({
          where: { dayOfWeek }
        })
      );
      
      // If day is enabled and has time slots, create new settings
      if (enabled && timeSlots.length > 0) {
        for (const slot of timeSlots) {
          // Validate time slot
          if (!slot.startTime || !slot.endTime) {
            log.warn('Skipping invalid time slot', { 
              requestId, 
              day: dayName, 
              slot 
            });
            continue; // Skip invalid time slots
          }
          
          operations.push(
            prisma.availability.create({
              data: {
                dayOfWeek,
                startTime: slot.startTime,
                endTime: slot.endTime,
                isAvailable: true
              }
            })
          );
        }
      }
    }
    
    log.info('Executing availability update transaction', { 
      requestId, 
      operationCount: operations.length 
    });
    
    // Execute all operations in a transaction
    await prisma.$transaction(operations);
    
    log.info('Weekly availability updated successfully', { requestId });
    
    return success({
      message: 'Weekly availability updated successfully',
      operationCount: operations.length
    }, { requestId });
  },
  {
    bodyValidator: weeklyAvailabilitySchema
  }
); 