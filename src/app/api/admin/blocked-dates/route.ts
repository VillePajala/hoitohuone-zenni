import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/blocked-dates
export async function GET(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    // Fetch all blocked dates
    const blockedDates = await prisma.blockedDate.findMany({
      orderBy: {
        date: 'asc'
      }
    });
    
    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/blocked-dates
export async function POST(req: NextRequest) {
  try {
    // In production, you would check if the user is authorized as an admin
    
    const { date, reason } = await req.json();
    
    // Parse the date string to a Date object
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Check if date is already blocked
    const existingBlockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(dateObj.setHours(0, 0, 0, 0)),
          lt: new Date(dateObj.setHours(23, 59, 59, 999))
        }
      }
    });
    
    if (existingBlockedDate) {
      return NextResponse.json(
        { error: 'This date is already blocked' },
        { status: 400 }
      );
    }
    
    // Create a new blocked date
    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: dateObj,
        reason: reason || 'Unavailable'
      }
    });
    
    return NextResponse.json(blockedDate);
  } catch (error) {
    console.error('Error creating blocked date:', error);
    return NextResponse.json(
      { error: 'Failed to create blocked date' },
      { status: 500 }
    );
  }
} 