import { toExpenseCategory } from "@/features/budget/categories";
import {
  createExpense,
  deleteExpense,
  findExpenseById,
  findExpensesByTrip,
} from "@/server/repositories/expense.repository";
import { findTripById } from "@/server/repositories/trip.repository";

export class BudgetError extends Error {}

async function assertTripOwner(tripId: string, ownerId: string) {
  const trip = await findTripById(tripId);
  if (!trip) throw new BudgetError("TRIP_NOT_FOUND");
  // Same defense-in-depth pattern as trip.service/itinerary.service — the
  // UI only ever renders the add/delete controls for the owner.
  if (trip.ownerId !== ownerId) throw new BudgetError("FORBIDDEN");
  return trip;
}

export async function listExpenses(tripId: string) {
  const expenses = await findExpensesByTrip(tripId);
  return expenses.map((expense) => ({
    ...expense,
    category: toExpenseCategory(expense.category),
    amount: Number(expense.amount),
  }));
}

export async function addExpense(
  tripId: string,
  ownerId: string,
  input: {
    category: string;
    amount: number;
    note: string | null;
    splitBetween: string[];
  },
) {
  await assertTripOwner(tripId, ownerId);
  return createExpense({ tripId, paidById: ownerId, ...input });
}

export async function removeExpense(expenseId: string, ownerId: string) {
  const expense = await findExpenseById(expenseId);
  if (!expense) throw new BudgetError("NOT_FOUND");
  await assertTripOwner(expense.tripId, ownerId);
  return deleteExpense(expenseId);
}

export interface BudgetSummary {
  totalSpent: number;
  budgetTarget: number | null;
  remaining: number | null;
  byCategory: { category: string; total: number }[];
  bySplitMember: { name: string; owed: number }[];
}

/**
 * Rule-based money view (mục 11's "Money View", không AI): tổng chi phí,
 * phân theo hạng mục, và chia đều mỗi expense cho danh sách
 * `splitBetween` của nó — cộng dồn theo tên để ra "mỗi người nợ bao
 * nhiêu". Đây là "chia tiền cơ bản" theo đúng mục 5 của spec, không phải
 * thuật toán settle-up tối ưu (ai trả ai bao nhiêu để cân bằng).
 */
export async function computeBudgetSummary(
  tripId: string,
): Promise<BudgetSummary> {
  const [trip, expenses] = await Promise.all([
    findTripById(tripId),
    listExpenses(tripId),
  ]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const budgetTarget =
    trip?.budgetTarget != null ? Number(trip.budgetTarget) : null;

  const byCategoryMap = new Map<string, number>();
  const bySplitMap = new Map<string, number>();
  for (const expense of expenses) {
    byCategoryMap.set(
      expense.category,
      (byCategoryMap.get(expense.category) ?? 0) + expense.amount,
    );
    if (expense.splitBetween.length > 0) {
      const share = expense.amount / expense.splitBetween.length;
      for (const name of expense.splitBetween) {
        bySplitMap.set(name, (bySplitMap.get(name) ?? 0) + share);
      }
    }
  }

  return {
    totalSpent,
    budgetTarget,
    remaining: budgetTarget != null ? budgetTarget - totalSpent : null,
    byCategory: [...byCategoryMap.entries()].map(([category, total]) => ({
      category,
      total,
    })),
    bySplitMember: [...bySplitMap.entries()].map(([name, owed]) => ({
      name,
      owed,
    })),
  };
}
