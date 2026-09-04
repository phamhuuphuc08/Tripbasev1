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
  EXPENSE_CATEGORIES,
  type ExpenseCategory,
} from "@/features/budget/categories";
import {
  addExpenseAction,
  type ExpenseFormState,
} from "@/features/budget/actions";

const initialState: ExpenseFormState = {};

export function ExpenseForm({
  tripId,
  travelerNames,
}: {
  tripId: string;
  travelerNames: string[];
}) {
  const t = useTranslations("budget.form");
  const tCategory = useTranslations("expenseCategory");
  const action = addExpenseAction.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expense-category">{t("categoryLabel")}</Label>
          <Select name="category" defaultValue="OTHER">
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
              min={0}
              step={1000}
              inputMode="numeric"
              required
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
                <Checkbox name="splitBetween" value={name} />
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
        {pending ? t("submitPending") : t("submit")}
      </Button>
    </form>
  );
}
