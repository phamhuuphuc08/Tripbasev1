import type { PlanVisibility, ShareLinkType } from "@prisma/client";
import { findCollaboratorByTripAndUser } from "@/server/repositories/collaborator.repository";
import { findShareLinkByToken } from "@/server/repositories/share-link.repository";
import { findTripById } from "@/server/repositories/trip.repository";

export type TripPermissionRole = "OWNER" | "EDITOR" | "VIEWER" | "NONE";

export class PermissionError extends Error {
  constructor(public code: "TRIP_NOT_FOUND" | "FORBIDDEN") {
    super(code);
    this.name = "PermissionError";
  }
}

export async function getTripRole(
  tripId: string,
  userId?: string | null,
): Promise<TripPermissionRole> {
  if (!userId) return "NONE";

  const trip = await findTripById(tripId);
  if (!trip) return "NONE";
  if (trip.ownerId === userId) return "OWNER";

  const collaborator = await findCollaboratorByTripAndUser(tripId, userId);
  if (!collaborator) return "NONE";

  return collaborator.role;
}

export async function getTripShareLinkType(
  tripId: string,
  shareToken?: string | null,
): Promise<ShareLinkType | null> {
  const token = shareToken?.trim();
  if (!token) return null;

  const shareLink = await findShareLinkByToken(token);
  if (!shareLink || shareLink.planId !== tripId) return null;
  if (shareLink.revokedAt) return null;
  if (shareLink.expiresAt && shareLink.expiresAt.getTime() <= Date.now()) return null;

  return shareLink.type;
}

export function roleCanEdit(role: TripPermissionRole) {
  return role === "OWNER" || role === "EDITOR";
}

export function roleCanManageMembers(role: TripPermissionRole) {
  return role === "OWNER";
}

export function roleCanDeleteTrip(role: TripPermissionRole) {
  return role === "OWNER";
}

export function roleCanView(role: TripPermissionRole, visibility: PlanVisibility) {
  if (visibility === "PUBLIC") return true;
  return role !== "NONE";
}

export async function canViewTrip(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  const trip = await findTripById(tripId);
  if (!trip) return false;

  const role = await getTripRole(tripId, userId);
  if (roleCanView(role, trip.visibility)) return true;

  const shareLinkType = await getTripShareLinkType(tripId, shareToken);
  return shareLinkType !== null;
}

export async function canEditTrip(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  const role = await getTripRole(tripId, userId);
  if (roleCanEdit(role)) return true;

  // Edit Link yêu cầu người dùng đăng nhập.
  if (!userId) return false;

  const shareLinkType = await getTripShareLinkType(tripId, shareToken);
  return shareLinkType === "EDIT";
}

export async function isTripOwner(
  tripId: string,
  userId?: string | null,
) {
  if (!userId) return false;

  const trip = await findTripById(tripId);
  return Boolean(trip && trip.ownerId === userId);
}

export async function assertCanViewTrip(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  const trip = await findTripById(tripId);
  if (!trip) throw new PermissionError("TRIP_NOT_FOUND");

  const role = await getTripRole(tripId, userId);
  const shareLinkType = await getTripShareLinkType(tripId, shareToken);

  if (!roleCanView(role, trip.visibility) && !shareLinkType) {
    throw new PermissionError("FORBIDDEN");
  }

  return { trip, role, shareLinkType };
}

export async function assertCanEditTrip(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  const trip = await findTripById(tripId);
  if (!trip) throw new PermissionError("TRIP_NOT_FOUND");

  const role: TripPermissionRole =
    trip.ownerId === userId ? "OWNER" : await getTripRole(tripId, userId);

  if (roleCanEdit(role)) return { trip, role, shareLinkType: null };

  const shareLinkType = await getTripShareLinkType(tripId, shareToken);
  if (shareLinkType !== "EDIT") throw new PermissionError("FORBIDDEN");

  return { trip, role, shareLinkType };
}

export async function assertTripOwner(
  tripId: string,
  userId: string,
) {
  const trip = await findTripById(tripId);
  if (!trip) throw new PermissionError("TRIP_NOT_FOUND");
  if (trip.ownerId !== userId) throw new PermissionError("FORBIDDEN");

  return trip;
}