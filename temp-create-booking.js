const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBooking() {
  try {
    // First, get a service
    const service = await prisma.service.findFirst();
    
    if (!service) {
      console.log('No service found, creating one...');
      const newService = await prisma.service.create({
        data: {
          name: 'Energy Healing',
          nameEn: 'Energy Healing',
          nameFi: 'Energiahoito',
          description: 'A holistic treatment',
          descriptionEn: 'A holistic treatment',
          descriptionFi: 'Kokonaisvaltainen hoito',
          duration: 60,
          price: 75.0,
          currency: 'EUR',
          active: true,
        }
      });
      console.log('Service created:', newService.id);
      
      // Create a test booking
      const today = new Date();
      const booking = await prisma.booking.create({
        data: {
          serviceId: newService.id,
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '+358401234567',
          date: today,
          startTime: today,
          endTime: new Date(today.getTime() + 60 * 60 * 1000),
          status: 'confirmed',
          language: 'fi',
          notes: 'Test booking'
        }
      });
      
      console.log('Booking created:', booking.id);
    } else {
      console.log('Service found:', service.id);
      
      // Create a test booking
      const today = new Date();
      const booking = await prisma.booking.create({
        data: {
          serviceId: service.id,
          customerName: 'Test Customer',
          customerEmail: 'test@example.com',
          customerPhone: '+358401234567',
          date: today,
          startTime: today,
          endTime: new Date(today.getTime() + 60 * 60 * 1000),
          status: 'confirmed',
          language: 'fi',
          notes: 'Test booking'
        }
      });
      
      console.log('Booking created:', booking.id);
    }
    
    // Check if booking exists
    const count = await prisma.booking.count();
    console.log('Total bookings:', count);
    
  } catch (error) {
    console.error('Error creating booking:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBooking(); 