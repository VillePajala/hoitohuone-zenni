const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBookingStatuses() {
  try {
    console.log('Fixing booking statuses...');
    
    // Get all bookings
    const bookings = await prisma.booking.findMany();
    console.log(`Found ${bookings.length} bookings`);
    
    if (bookings.length === 0) {
      console.log('No bookings to fix');
      return;
    }
    
    // Log current statuses
    bookings.forEach(booking => {
      console.log(`Booking ${booking.id}: status = "${booking.status}"`);
    });
    
    // Update all "confirmed" bookings to ensure they have the exact correct status
    const results = await Promise.all(
      bookings.map(booking => 
        prisma.booking.update({
          where: { id: booking.id },
          data: { 
            // Set status to confirmed if it's currently confirmed (case insensitive)
            status: booking.status.toLowerCase().includes('confirm') ? 'confirmed' : booking.status 
          }
        })
      )
    );
    
    console.log('Updated bookings:');
    results.forEach(booking => {
      console.log(`Booking ${booking.id}: status = "${booking.status}"`);
    });
    
    console.log('Finished fixing booking statuses');
  } catch (error) {
    console.error('Error fixing booking statuses:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixBookingStatuses(); 