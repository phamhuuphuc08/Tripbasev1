"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  AuthError,
  loginWithPassword,
  logout,
  registerUser,
} from "@/server/services/auth.service";

export interface AuthFormState {
  error?: string;
}

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

const registerSchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên."),
  email: z.string().email("Email không hợp lệ."),
  password: z.string().min(8, "Mật khẩu cần ít nhất 8 ký tự."),
});

function firstIssueMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Dữ liệu không hợp lệ.";
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
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
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  const callbackUrl = formData.get("callbackUrl");
  redirect(typeof callbackUrl === "string" && callbackUrl ? callbackUrl : "/");
}

export async function registerAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
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
    if (error instanceof AuthError) return { error: error.message };
    throw error;
  }

  redirect("/");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}
