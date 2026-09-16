import type { ChecklistStatus } from "@prisma/client";
import { prisma } from "@/server/db/client";

const checklistInclude = {
  assignedTo: {
    select: { id: true, name: true, email: true },
  },
} as const;

export function findChecklistItemsByTrip(tripId: string) {
  return prisma.checklistItem.findMany({
    where: { tripId },
    include: checklistInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { title: "asc" }],
  });
}

export function findChecklistItemById(id: string) {
  return prisma.checklistItem.findUnique({
    where: { id },
    include: checklistInclude,
  });
}

export function createChecklistItem(data: {
  tripId: string;
  title: string;
  dueDate: Date | null;
  assignedToId: string | null;
}) {
  return prisma.checklistItem.create({
    data: {
      tripId: data.tripId,
      title: data.title,
      dueDate: data.dueDate,
      assignedToId: data.assignedToId,
      status: "PENDING",
    },
    include: checklistInclude,
  });
}

export function updateChecklistItem(
  id: string,
  data: {
    title?: string;
    dueDate?: Date | null;
    assignedToId?: string | null;
    status?: ChecklistStatus;
  },
) {
  return prisma.checklistItem.update({
    where: { id },
    data,
    include: checklistInclude,
  });
}

export function deleteChecklistItem(id: string) {
  return prisma.checklistItem.delete({ where: { id } });
}