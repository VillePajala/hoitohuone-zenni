import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/availability/weekly
export async function GET(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    // Fetch all weekly availability settings
    const availability = await prisma.availability.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });
    
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability settings' },
      { status: 500 }
    );
  }
}

// POST /api/admin/availability/weekly
export async function POST(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const { days } = await req.json();
    
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
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating availability:', error);
    return NextResponse.json(
      { error: 'Failed to update availability settings' },
      { status: 500 }
    );
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