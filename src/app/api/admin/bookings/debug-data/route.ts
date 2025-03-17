import { NextResponse } from 'next/server';

// This endpoint returns hard-coded booking data to bypass any database issues
export async function GET() {
  try {
    console.log('Debugging bookings with static data...');
    
    // Create static test bookings that don't rely on database
    const staticBookings = [
      {
        id: 'static-1',
        customerName: 'Test Customer 1',
        customerEmail: 'test1@example.com',
        service: {
          id: 'static-service-1',
          name: 'Test Service',
          nameFi: 'Testipalvelu',
          nameEn: 'Test Service'
        },
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'confirmed',
        language: 'en'
      },
      {
        id: 'static-2',
        customerName: 'Test Customer 2',
        customerEmail: 'test2@example.com',
        service: {
          id: 'static-service-1',
          name: 'Test Service',
          nameFi: 'Testipalvelu',
          nameEn: 'Test Service'
        },
        date: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        status: 'cancelled',
        language: 'fi'
      }
    ];
    
    console.log('Returning static booking data:', staticBookings);
    
    return NextResponse.json(staticBookings);
  } catch (error) {
    console.error('Error in debug bookings endpoint:', error);
    return NextResponse.json(
      { error: 'Debug endpoint error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 