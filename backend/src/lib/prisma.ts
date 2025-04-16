import { PrismaClient } from '../generated/prisma';

// Instantiate Prisma Client once
const prisma = new PrismaClient({
  // Optional: Add logging for development
  // log: ['query', 'info', 'warn', 'error'],
});

export default prisma; 