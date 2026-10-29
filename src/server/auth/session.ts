import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { env } from "@/config/env";
import { prisma } from "@/server/db/client";

const COOKIE_NAME = "tripbase_session";
const SESSION_TTL = "30d";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  sessionVersion: number;
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
      typeof payload.name !== "string" ||
      typeof payload.sessionVersion !== "number"
    ) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        sessionVersion: true,
        suspendedUntil: true,
        deletedAt: true,
      },
    });

    if (!user) return null;
    if (user.deletedAt) return null;

    if (user.suspendedUntil && user.suspendedUntil > new Date()) {
      return null;
    }

    if (user.sessionVersion !== payload.sessionVersion) {
      return null;
    }

    return {
      userId: user.id,
      email: user.email,
      name: user.name,
      sessionVersion: user.sessionVersion,
    };
  } catch {
    return null;
  }
}