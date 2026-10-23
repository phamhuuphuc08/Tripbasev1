import { createHash, randomBytes } from "crypto";

import { env } from "@/config/env";
import { hashPassword } from "@/server/auth/password";
import {
  findUserByEmail,
  updateUserPassword,
} from "@/server/repositories/user.repository";
import {
  createPasswordResetToken,
  deletePasswordResetToken,
  deletePasswordResetTokensByUserId,
  findPasswordResetToken,
} from "@/server/repositories/password-reset.repository";
import { sendPasswordResetEmail } from "@/server/services/email.service";

const RESET_TOKEN_TTL_MINUTES = 30;

function hashResetToken(token: string) {
  return createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createPasswordReset(
  email: string,
  locale: string,
) {
  const normalizedEmail =
    email.trim().toLowerCase();

  const user =
    await findUserByEmail(
      normalizedEmail,
    );

  if (!user) {
    return;
  }

  await deletePasswordResetTokensByUserId(
    user.id,
  );

  const token =
    randomBytes(32).toString(
      "hex",
    );

  const tokenHash =
    hashResetToken(token);

  const expiresAt =
    new Date(
      Date.now() +
        RESET_TOKEN_TTL_MINUTES *
          60 *
          1000,
    );

  const resetToken =
    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

  const resetUrl =
    new URL(
      `/${locale}/reset-password`,
      env.APP_URL,
    );

  resetUrl.searchParams.set(
    "token",
    token,
  );

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl:
        resetUrl.toString(),
    });
  } catch (error) {
    await deletePasswordResetToken(
      resetToken.id,
    );

    console.error(
      "Failed to send password reset email:",
      error,
    );

    throw new Error(
      "PASSWORD_RESET_EMAIL_FAILED",
    );
  }
}

export async function resetPassword(
  token: string,
  password: string,
) {
  const tokenHash =
    hashResetToken(token);

  const resetToken =
    await findPasswordResetToken(
      tokenHash,
    );

  if (!resetToken) {
    throw new Error(
      "RESET_TOKEN_INVALID",
    );
  }

  if (
    resetToken.expiresAt <
    new Date()
  ) {
    await deletePasswordResetToken(
      resetToken.id,
    );

    throw new Error(
      "RESET_TOKEN_EXPIRED",
    );
  }

  const passwordHash =
    await hashPassword(password);

  await updateUserPassword(
    resetToken.userId,
    passwordHash,
  );

  await deletePasswordResetTokensByUserId(
    resetToken.userId,
  );
}