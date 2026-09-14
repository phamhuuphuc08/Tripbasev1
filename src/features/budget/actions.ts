"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/features/budget/categories";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { addExpense, editExpense, removeExpense } from "@/server/services/budget.service";

export interface ExpenseFormState {
  error?: string;
}

async function parseExpenseForm(formData: FormData) {
  const t = await getTranslations("budget.errors");

  const schema = z.object({
    category: z.enum(EXPENSE_CATEGORIES),
    amount: z.coerce.number().positive(t("amountInvalid")),
    note: z.string().trim().optional(),
  });

  const parsed = schema.safeParse({
    category: formData.get("category"),
    amount: formData.get("amount"),
    note: formData.get("note")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  return {
    success: true as const,
    data: {
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: parsed.data.note?.trim() || null,
      splitBetween: formData.getAll("splitBetween").map(String),
    },
  };
}

export async function addExpenseAction(
  tripId: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await getSession();
  const t = await getTranslations("budget.errors");

  if (!session) return { error: t("loginRequired") };

  const parsed = await parseExpenseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    await addExpense(tripId, session.userId, parsed.data);
  } catch {
    return { error: t("addFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#budget`, locale });
}

export async function updateExpenseAction(
  tripId: string,
  expenseId: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await getSession();
  const t = await getTranslations("budget.errors");

  if (!session) return { error: t("loginRequired") };

  const parsed = await parseExpenseForm(formData);
  if (!parsed.success) return { error: parsed.error };

  try {
    await editExpense(expenseId, session.userId, parsed.data);
  } catch {
    return { error: t("updateFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#budget`, locale });
}

export async function removeExpenseAction(
  tripId: string,
  expenseId: string,
  _formData: FormData,
) {
  void _formData;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  if (session) {
    try {
      await removeExpense(expenseId, session.userId);
    } catch {
      // Best-effort delete.
    }
  }

  return redirect({ href: `/trips/${tripId}#budget`, locale });
}