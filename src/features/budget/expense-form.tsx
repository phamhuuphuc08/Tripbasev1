"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addExpenseAction,
  type ExpenseFormState,
  updateExpenseAction,
} from "@/features/budget/actions";
import {
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/features/budget/categories";

const initialState: ExpenseFormState = {};

export interface EditingExpense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  note: string | null;
  splitBetween: string[];
}

export function ExpenseForm({
  tripId,
  travelerNames,
  editingExpense,
}: {
  tripId: string;
  travelerNames: string[];
  editingExpense?: EditingExpense;
}) {
  const t = useTranslations("budget.form");
  const tCategory = useTranslations("expenseCategory");

  const action = editingExpense
    ? updateExpenseAction.bind(null, tripId, editingExpense.id)
    : addExpenseAction.bind(null, tripId);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-category">{t("categoryLabel")}</Label>

          <Select
            name="category"
            defaultValue={editingExpense?.category ?? "OTHER"}
          >
            <SelectTrigger id="expense-category" className="w-full">
              <SelectValue>
                {(value: ExpenseCategory | null) =>
                  value ? tCategory(value) : null
                }
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {EXPENSE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {tCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-amount">{t("amountLabel")}</Label>

          <div className="relative">
            <Input
              id="expense-amount"
              name="amount"
              type="number"
              min={1}
              step={1000}
              inputMode="numeric"
              required
              defaultValue={editingExpense?.amount ?? ""}
              placeholder={t("amountPlaceholder")}
              className="pr-12"
            />

            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              VND
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="expense-note">{t("noteLabel")}</Label>

        <Input
          id="expense-note"
          name="note"
          defaultValue={editingExpense?.note ?? ""}
          placeholder={t("notePlaceholder")}
        />
      </div>

      {travelerNames.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label>{t("splitLabel")}</Label>

          <p className="text-muted-foreground -mt-1 text-xs">
            {t("splitHint")}
          </p>

          <div className="flex flex-wrap gap-2">
            {travelerNames.map((name) => (
              <label
                key={name}
                className="border-input has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm"
              >
                <Checkbox
                  name="splitBetween"
                  value={name}
                  defaultChecked={editingExpense?.splitBetween.includes(name)}
                />
                {name}
              </label>
            ))}
          </div>
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? editingExpense
            ? t("updatePending")
            : t("submitPending")
          : editingExpense
            ? t("updateSubmit")
            : t("submit")}
      </Button>
    </form>
  );
}