import { prisma } from "@/server/db/client";

export function findExpensesByTrip(tripId: string) {
  return prisma.expense.findMany({
    where: { tripId },
    orderBy: { createdAt: "desc" },
  });
}

export function findExpenseById(id: string) {
  return prisma.expense.findUnique({ where: { id } });
}

export function createExpense(data: {
  tripId: string;
  category: string;
  amount: number;
  note: string | null;
  paidById: string;
  splitBetween: string[];
}) {
  return prisma.expense.create({ data });
}

export function deleteExpense(id: string) {
  return prisma.expense.delete({ where: { id } });
}
