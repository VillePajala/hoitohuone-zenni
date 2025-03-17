import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuth } from '@clerk/nextjs/server';

// Helper function to check authentication
function checkAuth(req: NextRequest) {
  // Check if user is authenticated via Clerk
  const { userId } = getAuth(req);
  if (userId) return true;
  
  // Check for Bearer token
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return true;
  }
  
  return false;
}

// GET /api/admin/availability/weekly
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching weekly availability...');
    console.log('Using database URL:', process.env.DATABASE_URL);
    
    // Check authentication and return clear error for client
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful for availability fetch');
      
      // Log database connection details
      const connectionInfo = await prisma.$queryRaw`PRAGMA database_list`;
      console.log('Database connection details:', connectionInfo);
    } catch (dbError) {
      console.error('Database connection failed for availability:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    // Fetch all weekly availability settings
    const availability = await prisma.availability.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    
    // Log query info (removed toSQL calls that are not available)
    console.log('Running availability query with orderBy dayOfWeek ascending');
    
    console.log(`Found ${availability.length} availability slots`);
    
    if (availability.length === 0) {
      // Try a raw query to see if it returns data
      const rawAvailability = await prisma.$queryRaw`SELECT * FROM "Availability"`;
      console.log(`Raw query found: ${Array.isArray(rawAvailability) ? rawAvailability.length : 0} records`);
      console.log('Raw availability data:', rawAvailability);
    }
    
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/availability/weekly
export async function POST(req: NextRequest) {
  try {
    console.log('Updating weekly availability...');
    
    // Check authentication and return clear error for client
    if (!checkAuth(req)) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in to access this resource' },
        { status: 401 }
      );
    }
    
    // Test database connection
    try {
      await prisma.$connect();
      console.log('Database connection successful for availability update');
    } catch (dbError) {
      console.error('Database connection failed for availability update:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    const { days } = await req.json();
    
    if (!days) {
      return NextResponse.json(
        { error: 'Missing days data' },
        { status: 400 }
      );
    }
    
    // Process each day's settings
    const operations = [];
    
    // For each day, delete existing settings and create new ones
    for (const [dayName, settings] of Object.entries(days)) {
      const dayOfWeek = getDayOfWeek(dayName);
      const { enabled, timeSlots } = settings as { enabled: boolean; timeSlots: any[] };
      
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
    
    // Execute all operations in a transaction
    await prisma.$transaction(operations);
    
    console.log('Weekly availability updated successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Weekly availability updated successfully'
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability settings' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to convert day name to number (0-6)
function getDayOfWeek(dayName: string): number {
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
} 