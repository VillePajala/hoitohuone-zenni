import { NextResponse } from 'next/server';
import { add, format, parse, isWeekend } from 'date-fns';

// Mock function to get available dates
// In production, this would query the database for actual availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const serviceId = searchParams.get('serviceId');

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year are required' },
        { status: 400 }
      );
    }

    // For demo purposes, generate some available dates for the specified month
    // In a real application, this would come from your database
    const startDate = parse(`${year}-${month}-01`, 'yyyy-MM-dd', new Date());
    const endDate = add(startDate, { months: 1 });
    
    // Generate dates for the month
    const availableDates = [];
    let currentDate = startDate;
    
    while (currentDate < endDate) {
      // Skip weekends for this mock example
      if (!isWeekend(currentDate)) {
        // Add some randomness to availability (70% chance a weekday is available)
        if (Math.random() > 0.3) {
          availableDates.push(format(currentDate, 'yyyy-MM-dd'));
        }
      }
      currentDate = add(currentDate, { days: 1 });
    }

    return NextResponse.json({ availableDates }, { status: 200 });
  } catch (error) {
    console.error('Error getting available dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available dates' },
      { status: 500 }
    );
  }
} 