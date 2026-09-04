import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Minimal cookie-session auth for this stage: a signed JWT in an httpOnly
 * cookie, Credentials-only (email + password). No OAuth provider has been
 * picked yet (docs/PRODUCT_SPEC.md mục 15 suggests Clerk/Supabase/Auth.js) —
 * swap this out rather than growing it once that decision is made.
 */

const COOKIE_NAME = "tripbase_session";
const SESSION_TTL = "30d";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

function secretKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(secretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
    };
  } catch {
    // Expired or tampered token — treat as logged out rather than throwing.
    return null;
  }
}
