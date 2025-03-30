import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma Client instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client, reusing the instance in development to avoid exhausting connections
export const prisma = global.prisma || new PrismaClient();

// In development, store the instance on the global object
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
} 