"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { EXPENSE_CATEGORIES } from "@/features/budget/categories";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { addExpense, removeExpense } from "@/server/services/budget.service";

export interface ExpenseFormState {
  error?: string;
}

export async function addExpenseAction(
  tripId: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await getSession();
  const t = await getTranslations("budget.errors");
  if (!session) {
    return { error: t("loginRequired") };
  }

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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const splitBetween = formData.getAll("splitBetween").map(String);

  try {
    await addExpense(tripId, session.userId, {
      category: parsed.data.category,
      amount: parsed.data.amount,
      note: parsed.data.note?.trim() || null,
      splitBetween,
    });
  } catch {
    return { error: t("addFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function removeExpenseAction(
  tripId: string,
  expenseId: string,
  _formData: FormData,
) {
  // Signature required by <form action={...}>; this action has no fields.
  void _formData;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (session) {
    try {
      await removeExpense(expenseId, session.userId);
    } catch {
      // best-effort, see trip/actions.ts's addTravelerAction
    }
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}
