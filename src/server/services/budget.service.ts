import { toExpenseCategory } from "@/features/budget/categories";
import {
  createExpense,
  deleteExpense,
  findExpenseById,
  findExpensesByTrip,
  updateExpense as updateExpenseRepo,
} from "@/server/repositories/expense.repository";
import { findTripById } from "@/server/repositories/trip.repository";
import { assertCanEditTrip, PermissionError } from "@/server/services/permission.service";

export class BudgetError extends Error {}

export interface ExpenseInput {
  category: string;
  amount: number;
  note: string | null;
  splitBetween: string[];
}

export interface BudgetSettlement {
  from: string;
  to: string;
  amount: number;
}

export interface BudgetMemberBalance {
  name: string;
  paid: number;
  owed: number;
  balance: number;
}

export interface BudgetSummary {
  totalSpent: number;
  budgetTarget: number | null;
  remaining: number | null;
  byCategory: { category: string; total: number }[];
  bySplitMember: { name: string; owed: number }[];
  balances: BudgetMemberBalance[];
  settlements: BudgetSettlement[];
}

async function assertTripEditor(tripId: string, userId: string) {
  const trip = await findTripById(tripId);
  if (!trip) throw new BudgetError("TRIP_NOT_FOUND");

  try {
    await assertCanEditTrip(tripId, userId);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new BudgetError("TRIP_NOT_FOUND");
      throw new BudgetError("FORBIDDEN");
    }
    throw error;
  }

  return trip;
}

function normalizeSplitBetween(names: string[]) {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export async function listExpenses(tripId: string) {
  const expenses = await findExpensesByTrip(tripId);

  return expenses.map((expense) => ({
    ...expense,
    category: toExpenseCategory(expense.category),
    amount: Number(expense.amount),
    paidByName: expense.paidBy.name,
  }));
}

export async function addExpense(tripId: string, userId: string, input: ExpenseInput) {
  await assertTripEditor(tripId, userId);

  return createExpense({
    tripId,
    paidById: userId,
    category: input.category,
    amount: input.amount,
    note: input.note,
    splitBetween: normalizeSplitBetween(input.splitBetween),
  });
}

export async function editExpense(expenseId: string, userId: string, input: ExpenseInput) {
  const expense = await findExpenseById(expenseId);
  if (!expense) throw new BudgetError("NOT_FOUND");

  await assertTripEditor(expense.tripId, userId);

  return updateExpenseRepo(expenseId, {
    category: input.category,
    amount: input.amount,
    note: input.note,
    splitBetween: normalizeSplitBetween(input.splitBetween),
  });
}

export async function removeExpense(expenseId: string, userId: string) {
  const expense = await findExpenseById(expenseId);
  if (!expense) throw new BudgetError("NOT_FOUND");

  await assertTripEditor(expense.tripId, userId);
  return deleteExpense(expenseId);
}

function computeSettlements(balances: BudgetMemberBalance[]): BudgetSettlement[] {
  const debtors = balances
    .filter((member) => member.balance < -0.01)
    .map((member) => ({ name: member.name, amount: roundMoney(-member.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const creditors = balances
    .filter((member) => member.balance > 0.01)
    .map((member) => ({ name: member.name, amount: roundMoney(member.balance) }))
    .sort((a, b) => b.amount - a.amount);

  const settlements: BudgetSettlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0.01) {
      settlements.push({ from: debtor.name, to: creditor.name, amount });
      debtor.amount = roundMoney(debtor.amount - amount);
      creditor.amount = roundMoney(creditor.amount - amount);
    }

    if (debtor.amount <= 0.01) debtorIndex += 1;
    if (creditor.amount <= 0.01) creditorIndex += 1;
  }

  return settlements;
}

export async function computeBudgetSummary(tripId: string): Promise<BudgetSummary> {
  const [trip, expenses] = await Promise.all([
    findTripById(tripId),
    listExpenses(tripId),
  ]);

  const totalSpent = roundMoney(
    expenses.reduce((sum, expense) => sum + expense.amount, 0),
  );

  const budgetTarget = trip?.budgetTarget != null ? Number(trip.budgetTarget) : null;
  const byCategoryMap = new Map<string, number>();
  const owedMap = new Map<string, number>();
  const paidMap = new Map<string, number>();

  for (const expense of expenses) {
    byCategoryMap.set(
      expense.category,
      roundMoney((byCategoryMap.get(expense.category) ?? 0) + expense.amount),
    );

    paidMap.set(
      expense.paidByName,
      roundMoney((paidMap.get(expense.paidByName) ?? 0) + expense.amount),
    );

    const members = normalizeSplitBetween(expense.splitBetween);

    if (members.length > 0) {
      const share = expense.amount / members.length;

      for (const name of members) {
        owedMap.set(name, roundMoney((owedMap.get(name) ?? 0) + share));
      }
    }
  }

  const memberNames = new Set<string>([
    ...paidMap.keys(),
    ...owedMap.keys(),
  ]);

  const balances: BudgetMemberBalance[] = [...memberNames]
    .map((name) => {
      const paid = roundMoney(paidMap.get(name) ?? 0);
      const owed = roundMoney(owedMap.get(name) ?? 0);

      return {
        name,
        paid,
        owed,
        balance: roundMoney(paid - owed),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    totalSpent,
    budgetTarget,
    remaining: budgetTarget != null ? roundMoney(budgetTarget - totalSpent) : null,
    byCategory: [...byCategoryMap.entries()].map(([category, total]) => ({
      category,
      total,
    })),
    bySplitMember: [...owedMap.entries()].map(([name, owed]) => ({
      name,
      owed: roundMoney(owed),
    })),
    balances,
    settlements: computeSettlements(balances),
  };
}