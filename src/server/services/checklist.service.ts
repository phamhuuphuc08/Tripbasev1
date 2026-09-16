import type { ChecklistStatus } from "@prisma/client";
import {
  findCollaboratorByTripAndUser,
  findCollaboratorsByTrip,
} from "@/server/repositories/collaborator.repository";
import {
  createChecklistItem,
  deleteChecklistItem,
  findChecklistItemById,
  findChecklistItemsByTrip,
  updateChecklistItem,
} from "@/server/repositories/checklist.repository";
import { findTripById } from "@/server/repositories/trip.repository";
import {
  assertCanEditTrip,
  assertCanViewTrip,
  PermissionError,
} from "@/server/services/permission.service";

export class ChecklistError extends Error {
  constructor(
    public code:
      | "TRIP_NOT_FOUND"
      | "NOT_FOUND"
      | "FORBIDDEN"
      | "TITLE_REQUIRED"
      | "INVALID_ASSIGNEE",
  ) {
    super(code);
    this.name = "ChecklistError";
  }
}

export interface ChecklistInput {
  title: string;
  dueDate: Date | null;
  assignedToId: string | null;
}

async function assertView(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  try {
    await assertCanViewTrip(tripId, userId, shareToken);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new ChecklistError("TRIP_NOT_FOUND");
      throw new ChecklistError("FORBIDDEN");
    }
    throw error;
  }
}

async function assertEdit(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  try {
    await assertCanEditTrip(tripId, userId, shareToken);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new ChecklistError("TRIP_NOT_FOUND");
      throw new ChecklistError("FORBIDDEN");
    }
    throw error;
  }
}

async function assertAssignableUser(tripId: string, assignedToId: string | null) {
  if (!assignedToId) return;

  const trip = await findTripById(tripId);
  if (!trip) throw new ChecklistError("TRIP_NOT_FOUND");
  if (trip.ownerId === assignedToId) return;

  const collaborator = await findCollaboratorByTripAndUser(tripId, assignedToId);
  if (!collaborator) throw new ChecklistError("INVALID_ASSIGNEE");
}

function normalizeTitle(title: string) {
  const value = title.trim();
  if (!value) throw new ChecklistError("TITLE_REQUIRED");
  return value;
}

export async function listChecklistItems(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  await assertView(tripId, userId, shareToken);
  return findChecklistItemsByTrip(tripId);
}

export async function listChecklistAssignees(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  await assertEdit(tripId, userId, shareToken);

  const [trip, collaborators] = await Promise.all([
    findTripById(tripId),
    findCollaboratorsByTrip(tripId),
  ]);

  if (!trip) throw new ChecklistError("TRIP_NOT_FOUND");

  const users = [
    { id: trip.owner.id, name: trip.owner.name },
    ...collaborators.map((collaborator) => ({
      id: collaborator.user.id,
      name: collaborator.user.name,
    })),
  ];

  return [...new Map(users.map((user) => [user.id, user])).values()];
}

export async function addChecklistItem(
  tripId: string,
  userId: string,
  input: ChecklistInput,
  shareToken?: string | null,
) {
  await assertEdit(tripId, userId, shareToken);
  await assertAssignableUser(tripId, input.assignedToId);

  return createChecklistItem({
    tripId,
    title: normalizeTitle(input.title),
    dueDate: input.dueDate,
    assignedToId: input.assignedToId,
  });
}

export async function editChecklistItem(
  itemId: string,
  userId: string,
  input: ChecklistInput,
  shareToken?: string | null,
) {
  const item = await findChecklistItemById(itemId);
  if (!item) throw new ChecklistError("NOT_FOUND");

  await assertEdit(item.tripId, userId, shareToken);
  await assertAssignableUser(item.tripId, input.assignedToId);

  return updateChecklistItem(itemId, {
    title: normalizeTitle(input.title),
    dueDate: input.dueDate,
    assignedToId: input.assignedToId,
  });
}

export async function changeChecklistStatus(
  itemId: string,
  userId: string,
  status: ChecklistStatus,
  shareToken?: string | null,
) {
  const item = await findChecklistItemById(itemId);
  if (!item) throw new ChecklistError("NOT_FOUND");

  await assertEdit(item.tripId, userId, shareToken);
  return updateChecklistItem(itemId, { status });
}

export async function removeChecklistItem(
  itemId: string,
  userId: string,
  shareToken?: string | null,
) {
  const item = await findChecklistItemById(itemId);
  if (!item) throw new ChecklistError("NOT_FOUND");

  await assertEdit(item.tripId, userId, shareToken);
  return deleteChecklistItem(itemId);
}