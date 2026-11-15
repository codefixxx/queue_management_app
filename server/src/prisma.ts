import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const basePrisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = basePrisma;

/**
 * Robust database client with automatic retry for transient Neon serverless wake-up errors.
 * Handles Neon cold start pauses (P1001), connection pool timeouts (P2024), and network hiccups.
 */
export const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        let attempts = 0;
        const maxAttempts = 3;
        let delay = 500;

        while (attempts < maxAttempts) {
          try {
            return await query(args);
          } catch (error: any) {
            attempts++;
            const errorCode = error?.code;
            const errorMsg = String(error?.message || '');
            const isTransient =
              errorCode === 'P1001' || // Can't reach database server (Neon wake up / cold start)
              errorCode === 'P2024' || // Timed out waiting for connection from pool
              errorCode === 'P1008' || // Operations timed out
              errorMsg.includes("Can't reach database server") ||
              errorMsg.includes('Connection closed') ||
              errorMsg.includes('connection terminated') ||
              errorMsg.includes('ECONNRESET') ||
              errorMsg.includes('ETIMEDOUT');

            if (isTransient && attempts < maxAttempts) {
              console.warn(
                `[PRISMA_RETRY] Transient database connection error (${errorCode || 'P1001'}) on ${model}.${operation}. Retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})...`
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              delay = Math.min(delay * 2, 2000);
              continue;
            }

            throw error;
          }
        }
      }
    }
  }
}) as unknown as PrismaClient;


