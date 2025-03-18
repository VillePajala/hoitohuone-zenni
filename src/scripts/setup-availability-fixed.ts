import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables from .env.local if it exists, otherwise from .env
const localEnvPath = path.resolve(process.cwd(), '.env.local');
const envPath = path.resolve(process.cwd(), '.env');

let envFile = fs.existsSync(localEnvPath) ? localEnvPath : envPath;
console.log(`Using environment file: ${envFile}`);
dotenv.config({ path: envFile });

// Initialize Prisma client
const prisma = new PrismaClient();

async function setupDefaultAvailability() {
  console.log('Setting up default availability...');
  console.log(`Using database URL: ${process.env.DATABASE_URL}`);

  try {
    // First, clear any existing availability
    const deleted = await prisma.availability.deleteMany({});
    console.log(`Cleared ${deleted.count} existing availability settings`);

    // Default availability settings
    // Monday to Friday, 9:00 - 17:00
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

    // Create all availability slots
    const createdAvailability = await prisma.availability.createMany({
      data: defaultAvailability,
    });

    console.log(`Created ${createdAvailability.count} availability slots`);
    
    // Verify the slots were created
    const availabilityCheck = await prisma.availability.findMany({
      orderBy: { dayOfWeek: 'asc' }
    });
    
    console.log(`Verification: Found ${availabilityCheck.length} slots in database`);
    console.log('Default availability setup complete!');
  } catch (error) {
    console.error('Error setting up default availability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup function
setupDefaultAvailability()
  .catch((e) => {
    console.error('Error in setup script:', e);
    process.exit(1);
  }); 