import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Initialize separate Prisma clients for each database
const prismaDev = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db'
    }
  }
});

const prismaRoot = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db'
    }
  }
});

async function syncAvailability() {
  console.log('Syncing availability across databases...');

  try {
    // Default availability settings
    const defaultAvailability = [
      // Monday
      { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { dayOfWeek: 1, startTime: '13:00', endTime: '17:00', isAvailable: true },
      // Tuesday
      { dayOfWeek: 2, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { dayOfWeek: 2, startTime: '13:00', endTime: '17:00', isAvailable: true },
      // Wednesday
      { dayOfWeek: 3, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { dayOfWeek: 3, startTime: '13:00', endTime: '17:00', isAvailable: true },
      // Thursday
      { dayOfWeek: 4, startTime: '09:00', endTime: '12:00', isAvailable: true },
      { dayOfWeek: 4, startTime: '13:00', endTime: '17:00', isAvailable: true },
      // Friday
      { dayOfWeek: 5, startTime: '09:00', endTime: '16:00', isAvailable: true },
    ];

    // Update prisma/dev.db database
    try {
      console.log('Updating prisma/dev.db...');
      await prismaDev.availability.deleteMany({});
      const createdDev = await prismaDev.availability.createMany({
        data: defaultAvailability,
      });
      console.log(`Created ${createdDev.count} availability slots in prisma/dev.db`);
      
      // Verify
      const checkDev = await prismaDev.availability.findMany();
      console.log(`Verification: Found ${checkDev.length} slots in prisma/dev.db`);
    } catch (error) {
      console.error('Error updating prisma/dev.db:', error);
    }

    // Update root dev.db database
    try {
      console.log('\nUpdating ./dev.db...');
      
      // Check if root db file exists
      const rootDbPath = path.resolve(process.cwd(), 'dev.db');
      if (!fs.existsSync(rootDbPath)) {
        console.log('./dev.db does not exist. Skipping...');
      } else {
        await prismaRoot.availability.deleteMany({});
        const createdRoot = await prismaRoot.availability.createMany({
          data: defaultAvailability,
        });
        console.log(`Created ${createdRoot.count} availability slots in ./dev.db`);
        
        // Verify
        const checkRoot = await prismaRoot.availability.findMany();
        console.log(`Verification: Found ${checkRoot.length} slots in ./dev.db`);
      }
    } catch (error) {
      console.error('Error updating ./dev.db:', error);
    }

    console.log('\nAvailability sync complete!');
  } catch (error) {
    console.error('Error syncing availability:', error);
  } finally {
    await Promise.all([
      prismaDev.$disconnect(),
      prismaRoot.$disconnect()
    ]);
  }
}

// Run the sync function
syncAvailability()
  .catch((e) => {
    console.error('Error in sync script:', e);
    process.exit(1);
  }); 