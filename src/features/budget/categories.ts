// Fixed expense-category taxonomy (mục 4: "Vé máy bay, khách sạn, ăn uống,
// vé tham quan, di chuyển, shopping, dự phòng") — same app-level union,
// coerce-at-the-boundary pattern as tag-tip/categories.ts and
// trip/styles.ts, not a DB enum.

export const EXPENSE_CATEGORIES = [
  "FLIGHT",
  "HOTEL",
  "FOOD",
  "ATTRACTION",
  "TRANSPORT",
  "SHOPPING",
  "CONTINGENCY",
  "OTHER",
] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (
    typeof value === "string" &&
    (EXPENSE_CATEGORIES as readonly string[]).includes(value)
  );
}

export function toExpenseCategory(value: string | null): ExpenseCategory {
  return isExpenseCategory(value) ? value : "OTHER";
}
