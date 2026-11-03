import {
  createUser,
  findUserByEmail,
} from "@/server/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";
import { getAdminSettings } from "@/server/admin/settings.service";

export type AuthErrorCode =
  | "EMAIL_TAKEN"
  | "INVALID_CREDENTIALS"
  | "REGISTRATION_DISABLED"
  | "ACCOUNT_SUSPENDED"
  | "ACCOUNT_UNAVAILABLE";

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
  const settings = await getAdminSettings();

  if (!settings.registrationEnabled) {
    throw new AuthError("REGISTRATION_DISABLED");
  }

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

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });

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

  if (user.deletedAt) {
    throw new AuthError("ACCOUNT_UNAVAILABLE");
  }

  if (user.suspendedUntil && user.suspendedUntil > new Date()) {
    throw new AuthError("ACCOUNT_SUSPENDED");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);

  if (!valid) {
    throw new AuthError("INVALID_CREDENTIALS");
  }

  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    sessionVersion: user.sessionVersion,
  });

  return user;
}

export async function logout() {
  await destroySession();
}
