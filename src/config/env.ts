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
});

export const env = envSchema.parse(process.env);
