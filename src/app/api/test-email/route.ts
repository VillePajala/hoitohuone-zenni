import { createGetHandler, success, badRequest, log } from '@/lib/api';
import nodemailer from 'nodemailer';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/test-email - Send test emails for debugging purposes
export const GET = createGetHandler(
  async ({ requestId }) => {
    log.info('Test email endpoint called', { requestId });
    
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

      log.info('Sending test customer confirmation email', { 
        requestId,
        customerEmail: booking.customerEmail,
        bookingId: booking.id
      });
      
      // Send test customer email
      const customerEmailResult = await sendBookingConfirmationEmail(booking, service);
      
      log.info('Customer email sent successfully', { 
        requestId, 
        messageId: customerEmailResult.messageId 
      });

      log.info('Sending test admin notification email', { requestId });
      
      // Send test admin email
      const adminEmailResult = await sendAdminNotificationEmail(booking, service);
      
      log.info('Admin email sent successfully', { 
        requestId, 
        messageId: adminEmailResult.messageId 
      });

      // Generate preview URLs for development environment
      const customerPreviewUrl = process.env.NODE_ENV !== 'production' ? 
        nodemailer.getTestMessageUrl(customerEmailResult) : undefined;
      
      const adminPreviewUrl = process.env.NODE_ENV !== 'production' ? 
        nodemailer.getTestMessageUrl(adminEmailResult) : undefined;
      
      if (customerPreviewUrl) {
        log.info('Customer email preview available', { 
          requestId, 
          previewUrl: customerPreviewUrl 
        });
      }
      
      if (adminPreviewUrl) {
        log.info('Admin email preview available', { 
          requestId, 
          previewUrl: adminPreviewUrl 
        });
      }

      return success({
        message: 'Test emails sent successfully',
        results: {
          customerEmail: {
            messageId: customerEmailResult.messageId,
            previewUrl: customerPreviewUrl
          },
          adminEmail: {
            messageId: adminEmailResult.messageId,
            previewUrl: adminPreviewUrl
          }
        }
      }, { requestId });
    } catch (error) {
      log.error('Error sending test emails', { 
        requestId, 
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return badRequest('Failed to send test emails', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
); 