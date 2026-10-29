import {
  createUser,
  findUserByEmail,
} from "@/server/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";

export type AuthErrorCode = "EMAIL_TAKEN" | "INVALID_CREDENTIALS";

/**
 * Carries a code rather than a display message — the message is only
 * decided at the Server Action boundary (src/features/auth/actions.ts),
 * which knows the current locale. Keeps this service locale-agnostic.
 */
export class AuthError extends Error {
  code: AuthErrorCode;

  constructor(code: AuthErrorCode) {
    super(code);
    this.code = code;
  }
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AuthError("EMAIL_TAKEN");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  await createSession({ userId: user.id, email: user.email, name: user.name, sessionVersion: user.sessionVersion });
  return user;
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}) {
  const user = await findUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  await createSession({ userId: user.id, email: user.email, name: user.name, sessionVersion: user.sessionVersion });
  return user;
}

export async function logout() {
  await destroySession();
}