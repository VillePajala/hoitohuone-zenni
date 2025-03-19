import { 
  createGetHandler,
  success,
  validationError,
  log,
  string,
  createObjectValidator
} from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { format, isSameDay } from 'date-fns';

// Query parameters validation schema
interface AvailableDatesQueryParams {
  month: string;
  year: string;
  serviceId?: string;
}

const querySchema = createObjectValidator<AvailableDatesQueryParams>({
  month: string({ required: true }),
  year: string({ required: true }),
  serviceId: string()
});

// GET /api/available-dates?month=MM&year=YYYY&serviceId=xxx
export const GET = createGetHandler(
  async ({ query, requestId }) => {
    const { month, year, serviceId } = query as AvailableDatesQueryParams;
    
    log.info('Fetching available dates', { requestId, month, year, serviceId });
    
    // Validate and parse date
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (
      isNaN(monthNum) || 
      isNaN(yearNum) || 
      monthNum < 1 || 
      monthNum > 12 || 
      yearNum < 2000 || 
      yearNum > 2100
    ) {
      return validationError('Invalid month or year format');
    }
    
    // Start and end dates for the month
    const startDate = new Date(yearNum, monthNum - 1, 1); // Month is 0-indexed in JS Date
    const endDate = new Date(yearNum, monthNum, 0); // Last day of the month
    
    // Get all dates in the month
    const allDates = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      allDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    });
    
    // Get weekly availability
    const weeklyAvailability = await prisma.availability.findMany({
      where: {
        isAvailable: true
      }
    });
    
    // If serviceId is provided, check if the service exists
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId, active: true }
      });
      
      if (!service) {
        log.info('Service not found or inactive', { requestId, serviceId });
        return success({ availableDates: [] });
      }
    }
    
    // Calculate available dates
    const availableDates = allDates.filter(date => {
      // Check if date is blocked
      const isBlocked = blockedDates.some(blockedDate => 
        isSameDay(new Date(blockedDate.date), date)
      );
      
      if (isBlocked) return false;
      
      // Check if day has weekly availability
      const dayOfWeek = date.getDay();
      const hasAvailability = weeklyAvailability.some(
        avail => avail.dayOfWeek === dayOfWeek
      );
      
      return hasAvailability;
    });
    
    // Format dates to YYYY-MM-DD
    const formattedDates = availableDates.map(date => 
      format(date, 'yyyy-MM-dd')
    );
    
    log.info('Available dates calculated', { 
      requestId, 
      month, 
      year, 
      count: formattedDates.length 
    });
    
    return success({ 
      availableDates: formattedDates 
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