import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

async function checkAvailability() {
  console.log('Checking availability in database...');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('Database connection successful');

    // Get all availability records
    const availability = await prisma.availability.findMany({
      orderBy: {
        dayOfWeek: 'asc'
      }
    });

    console.log(`Found ${availability.length} availability records in the database:`);
    
    if (availability.length > 0) {
      // Group by day of week for better readability
      const dayMap = {
        0: 'Sunday',
        1: 'Monday',
        2: 'Tuesday',
        3: 'Wednesday',
        4: 'Thursday',
        5: 'Friday',
        6: 'Saturday'
      };

      // Group by day
      const byDay = availability.reduce((acc, slot) => {
        const day = dayMap[slot.dayOfWeek as keyof typeof dayMap] || `Unknown (${slot.dayOfWeek})`;
        if (!acc[day]) acc[day] = [];
        acc[day].push(slot);
        return acc;
      }, {} as Record<string, any[]>);

      // Display by day
      Object.entries(byDay).forEach(([day, slots]) => {
        console.log(`\n${day}:`);
        slots.forEach(slot => {
          console.log(`  - ${slot.startTime} to ${slot.endTime} (ID: ${slot.id})`);
        });
      });
    } else {
      console.log('No availability records found.');
    }

    // Check Prisma schema vs database
    console.log('\nChecking database schema...');
    const tableInfo = await prisma.$queryRaw`SELECT sql FROM sqlite_master WHERE type='table' AND name='Availability'`;
    console.log('Availability table definition:', tableInfo);

  } catch (error) {
    console.error('Error checking availability:', error);
  } finally {
    await prisma.$disconnect();
    console.log('Database disconnected');
  }
}

// Run the check function
checkAvailability()
  .catch((e) => {
    console.error('Error in check script:', e);
    process.exit(1);
  }); 