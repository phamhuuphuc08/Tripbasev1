"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { redirect } from "@/i18n/navigation";
import {
  AuthError,
  type AuthErrorCode,
  loginWithPassword,
  logout,
  registerUser,
} from "@/server/services/auth.service";

export interface AuthFormState {
  error?: string;
}

const ERROR_KEY = {
  EMAIL_TAKEN: "emailTaken",
  INVALID_CREDENTIALS: "invalidCredentials",
  REGISTRATION_DISABLED: "registrationDisabled",
  ACCOUNT_SUSPENDED: "accountSuspended",
  ACCOUNT_UNAVAILABLE: "accountUnavailable",
} as const satisfies Record<AuthErrorCode, string>;

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input.";
}

export async function loginAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const t = await getTranslations("auth.errors");

  const loginSchema = z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(1, t("passwordRequired")),
  });

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  try {
    await loginWithPassword(parsed.data);
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t(ERROR_KEY[error.code]) };
    }

    throw error;
  }

  const callbackUrl = formData.get("callbackUrl");
  const locale = await getLocale();

  return redirect({
    href: typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/",
    locale,
  });
}

export async function registerAction(_prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const t = await getTranslations("auth.errors");

  const registerSchema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(8, t("passwordMin")),
  });

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: firstIssueMessage(parsed.error) };
  }

  try {
    await registerUser(parsed.data);
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: t(ERROR_KEY[error.code]) };
    }

    throw error;
  }

  const locale = await getLocale();
  return redirect({ href: "/", locale });
}

export async function logoutAction() {
  await logout();

  const locale = await getLocale();
  return redirect({ href: "/", locale });
}