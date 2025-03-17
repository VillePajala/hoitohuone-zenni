import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomUUID } from 'crypto';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';
import { cookies } from 'next/headers';

// POST /api/bookings - Create a new booking
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      serviceId, 
      customerName, 
      customerEmail, 
      customerPhone, 
      date, 
      startTime, 
      endTime, 
      notes,
      language = 'fi' 
    } = body;

    // Validate required fields
    if (!serviceId || !customerName || !customerEmail || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Parse dates
    const bookingDate = new Date(date);
    const bookingStartTime = new Date(startTime);
    const bookingEndTime = new Date(endTime);

    // Validate dates
    if (isNaN(bookingDate.getTime()) || isNaN(bookingStartTime.getTime()) || isNaN(bookingEndTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Check if the slot is available
    const existingBooking = await prisma.booking.findFirst({
      where: {
        date: {
          equals: bookingDate
        },
        OR: [
          {
            startTime: {
              lt: bookingEndTime
            },
            endTime: {
              gt: bookingStartTime
            }
          }
        ],
        status: {
          not: 'cancelled'
        }
      }
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'The selected time slot is no longer available' },
        { status: 409 }
      );
    }

    // Check for blocked dates
    const blockedDate = await prisma.blockedDate.findFirst({
      where: {
        date: {
          gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
          lt: new Date(bookingDate.setHours(23, 59, 59, 999))
        }
      }
    });

    if (blockedDate) {
      return NextResponse.json(
        { error: 'The selected date is not available for booking' },
        { status: 409 }
      );
    }

    // Generate a unique ID for cancellation
    const cancellationId = randomUUID();

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        serviceId,
        customerName,
        customerEmail,
        customerPhone,
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        notes,
        language,
        status: 'confirmed',
        cancellationId
      }
    });

    // Get cookies from request headers directly
    let testCustomerEmail;
    let testAdminEmail;
    
    try {
      // Try to extract cookie values manually if the Next.js API is having issues
      const cookieHeader = request.headers.get('cookie') || '';
      const cookiePairs = cookieHeader.split(';').map(pair => pair.trim());
      
      for (const pair of cookiePairs) {
        const [name, value] = pair.split('=');
        if (name === 'test_customer_email') {
          testCustomerEmail = decodeURIComponent(value);
        } else if (name === 'test_admin_email') {
          testAdminEmail = decodeURIComponent(value);
        }
      }
    } catch (cookieError) {
      console.error('Error parsing cookies:', cookieError);
    }
    
    // Add email overrides if cookies exist
    const bookingWithOverrides = {
      ...booking,
      _testEmailOverride: testCustomerEmail,
      _testAdminEmailOverride: testAdminEmail
    };

    // Send confirmation emails
    try {
      // Send confirmation email to customer
      await sendBookingConfirmationEmail(bookingWithOverrides, service);
      
      // Send notification email to admin
      await sendAdminNotificationEmail(bookingWithOverrides, service);
      
      console.log('Emails sent successfully');
      if (testCustomerEmail) {
        console.log(`Used test customer email: ${testCustomerEmail}`);
      }
      if (testAdminEmail) {
        console.log(`Used test admin email: ${testAdminEmail}`);
      }
    } catch (emailError) {
      // Log the error but don't fail the booking creation
      console.error('Error sending confirmation emails:', emailError);
    }

    return NextResponse.json(
      { 
        booking,
        message: 'Booking confirmed successfully',
        emailTestMode: !!(testCustomerEmail || testAdminEmail)
      }, 
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
} 