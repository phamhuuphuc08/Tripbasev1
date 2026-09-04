import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7 moved the CLI's connection URL out of schema.prisma and into this
// config file. Runtime PrismaClient still needs a driver adapter — see
// src/server/db/client.ts.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
