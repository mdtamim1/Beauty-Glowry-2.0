import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

let prisma: PrismaClient;

const connectionString = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production';

// Safe connection pool configuration for Supabase nano-tier limits
const poolConfig = {
  connectionString,
  max: isProduction ? 2 : 4,         // Max 2 connections per production instance, 4 in dev
  idleTimeoutMillis: 15000,          // Close idle connections after 15 seconds
  connectionTimeoutMillis: 5000,      // Connection attempt timeout after 5 seconds
};

if (isProduction) {
  const pool = new pg.Pool(poolConfig);
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  // Prevent multiple instances of Prisma Client in development due to hot reloading
  const globalWithPrisma = global as typeof globalThis & {
    prisma?: PrismaClient;
  };
  if (!globalWithPrisma.prisma) {
    const pool = new pg.Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    globalWithPrisma.prisma = new PrismaClient({ adapter });
  }
  prisma = globalWithPrisma.prisma;
}

export default prisma;
export { prisma };
