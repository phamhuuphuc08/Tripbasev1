import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Singleton Prisma client.
 *
 * Prisma 7 dropped the bundled Rust query engine — PrismaClient now always
 * needs an explicit driver adapter (see prisma.config.ts for the CLI-side
 * connection config, kept in sync via DATABASE_URL).
 *
 * We also cache the instance on `globalThis` in non-production environments
 * so Next.js's dev-mode hot reload doesn't open a new connection pool on
 * every edit.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
