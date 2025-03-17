const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.booking.count();
    console.log('Total bookings in database:', count);
    
    if (count > 0) {
      const bookings = await prisma.booking.findMany();
      console.log('First booking:', JSON.stringify(bookings[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check(); 