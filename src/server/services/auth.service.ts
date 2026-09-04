import {
  createUser,
  findUserByEmail,
} from "@/server/repositories/user.repository";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { createSession, destroySession } from "@/server/auth/session";

export class AuthError extends Error {}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AuthError("Email này đã được đăng ký.");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return user;
}

export async function loginWithPassword(input: {
  email: string;
  password: string;
}) {
  const user = await findUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    throw new AuthError("Email hoặc mật khẩu không đúng.");
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Email hoặc mật khẩu không đúng.");
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return user;
}

export async function logout() {
  await destroySession();
}
