import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';

// WARNING: This is a test endpoint and should be removed or secured in production
export async function GET(request: Request) {
  try {
    // Create a test booking
    const booking = {
      id: 'test-booking-id',
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '+358501234567',
      date: new Date(),
      startTime: new Date(new Date().setHours(10, 0, 0)),
      endTime: new Date(new Date().setHours(11, 0, 0)),
      notes: 'This is a test booking from the test-email endpoint',
      language: 'en',
      cancellationId: 'test-cancellation-id'
    };

    // Create a test service
    const service = {
      id: 'test-service-id',
      name: 'Test Service',
      nameEn: 'Test Service (English)',
      nameFi: 'Testipalvelu (Suomeksi)',
      description: 'Test service description',
      descriptionEn: 'Test service description in English',
      descriptionFi: 'Testipalvelun kuvaus suomeksi',
      duration: 60,
      price: 80,
      currency: 'EUR'
    };

    // Send test emails
    const customerEmailResult = await sendBookingConfirmationEmail(booking, service);
    const adminEmailResult = await sendAdminNotificationEmail(booking, service);

    return NextResponse.json({
      success: true,
      message: 'Test emails sent successfully',
      results: {
        customerEmail: {
          messageId: customerEmailResult.messageId,
          previewUrl: process.env.NODE_ENV !== 'production' ? 
            nodemailer.getTestMessageUrl(customerEmailResult) : undefined
        },
        adminEmail: {
          messageId: adminEmailResult.messageId,
          previewUrl: process.env.NODE_ENV !== 'production' ? 
            nodemailer.getTestMessageUrl(adminEmailResult) : undefined
        }
      }
    });
  } catch (error) {
    console.error('Error sending test emails:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 