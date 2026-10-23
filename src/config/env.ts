import { z } from "zod";

/**
 * Validates process.env once at startup so a missing/malformed variable
 * fails fast with a clear message instead of surfacing as an obscure error
 * deep inside a service call.
 *
 * Add new required variables here as features start needing them (DB, auth
 * provider, map provider key, file storage, etc. — see
 * docs/PRODUCT_SPEC.md mục 15).
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().url().optional(),
  // Signs session JWTs — see src/server/auth/session.ts.
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),

  APP_URL: z
    .string()
    .url()
    .default("http://localhost:3000"),

  EMAIL_USER: z.string().email().optional(),
  EMAIL_CLIENT_ID: z.string().min(1).optional(),
  EMAIL_CLIENT_SECRET: z.string().min(1).optional(),
  EMAIL_REFRESH_TOKEN: z.string().min(1).optional(),
});

export const env = envSchema.parse(process.env);