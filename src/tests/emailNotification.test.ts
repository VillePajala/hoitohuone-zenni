import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '@/lib/emailService';

describe('Email Notification System', () => {
  // Mock booking and service data for testing
  const mockBooking = {
    id: 'booking-123',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '+358501234567',
    date: new Date('2025-04-01'),
    startTime: new Date('2025-04-01T14:00:00'),
    endTime: new Date('2025-04-01T15:00:00'),
    notes: 'Test booking notes',
    language: 'en',
    cancellationId: 'cancel-123',
  };

  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    nameEn: 'Test Service En',
    nameFi: 'Test Service Fi',
    description: 'Test description',
    descriptionEn: 'Test description in English',
    descriptionFi: 'Test description in Finnish',
    duration: 60,
    price: 80,
    currency: 'EUR',
  };

  // Mock Finnish booking
  const mockFinnishBooking = {
    ...mockBooking,
    language: 'fi',
  };

  beforeEach(() => {
    // Spy on console.log to see email URLs in tests
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should send customer confirmation email (English)', async () => {
    try {
      const result = await sendBookingConfirmationEmail(mockBooking, mockService);
      expect(result).toBeDefined();
      
      // In a real test, you would check more specific properties
      // but with Ethereal test emails we just verify it doesn't throw
      console.log('Email sent successfully');
    } catch (error) {
      // This will fail the test if an error occurs
      console.error('Error in test:', error);
      throw error;
    }
  });

  test('should send customer confirmation email (Finnish)', async () => {
    try {
      const result = await sendBookingConfirmationEmail(mockFinnishBooking, mockService);
      expect(result).toBeDefined();
      console.log('Finnish email sent successfully');
    } catch (error) {
      console.error('Error in test:', error);
      throw error;
    }
  });

  test('should send admin notification email', async () => {
    try {
      const result = await sendAdminNotificationEmail(mockBooking, mockService);
      expect(result).toBeDefined();
      console.log('Admin email sent successfully');
    } catch (error) {
      console.error('Error in test:', error);
      throw error;
    }
  });
}); 