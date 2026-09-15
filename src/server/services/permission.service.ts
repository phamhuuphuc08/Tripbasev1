import type { PlanVisibility } from "@prisma/client";
import { findCollaboratorByTripAndUser } from "@/server/repositories/collaborator.repository";
import { findTripById } from "@/server/repositories/trip.repository";

export type TripPermissionRole =
  | "OWNER"
  | "EDITOR"
  | "VIEWER"
  | "NONE";

export class PermissionError extends Error {
  constructor(
    public code:
      | "TRIP_NOT_FOUND"
      | "FORBIDDEN",
  ) {
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

  if (trip.ownerId === userId) {
    return "OWNER";
  }

  const collaborator =
    await findCollaboratorByTripAndUser(
      tripId,
      userId,
    );

  if (!collaborator) return "NONE";

  return collaborator.role;
}

export function roleCanEdit(
  role: TripPermissionRole,
) {
  return (
    role === "OWNER" ||
    role === "EDITOR"
  );
}

export function roleCanManageMembers(
  role: TripPermissionRole,
) {
  return role === "OWNER";
}

export function roleCanDeleteTrip(
  role: TripPermissionRole,
) {
  return role === "OWNER";
}

export function roleCanView(
  role: TripPermissionRole,
  visibility: PlanVisibility,
) {
  if (visibility === "PUBLIC") {
    return true;
  }

  return role !== "NONE";
}

export async function canViewTrip(
  tripId: string,
  userId?: string | null,
) {
  const trip = await findTripById(tripId);
  if (!trip) return false;

  const role = await getTripRole(
    tripId,
    userId,
  );

  return roleCanView(
    role,
    trip.visibility,
  );
}

export async function canEditTrip(
  tripId: string,
  userId?: string | null,
) {
  const role = await getTripRole(
    tripId,
    userId,
  );

  return roleCanEdit(role);
}

export async function isTripOwner(
  tripId: string,
  userId?: string | null,
) {
  if (!userId) return false;

  const trip = await findTripById(tripId);

  return Boolean(
    trip &&
      trip.ownerId === userId,
  );
}

export async function assertCanViewTrip(
  tripId: string,
  userId?: string | null,
) {
  const trip = await findTripById(tripId);

  if (!trip) {
    throw new PermissionError(
      "TRIP_NOT_FOUND",
    );
  }

  const role = await getTripRole(
    tripId,
    userId,
  );

  if (
    !roleCanView(
      role,
      trip.visibility,
    )
  ) {
    throw new PermissionError(
      "FORBIDDEN",
    );
  }

  return {
    trip,
    role,
  };
}

export async function assertCanEditTrip(
  tripId: string,
  userId: string,
) {
  const trip = await findTripById(tripId);

  if (!trip) {
    throw new PermissionError(
      "TRIP_NOT_FOUND",
    );
  }

  const role =
    trip.ownerId === userId
      ? "OWNER"
      : await getTripRole(
          tripId,
          userId,
        );

  if (!roleCanEdit(role)) {
    throw new PermissionError(
      "FORBIDDEN",
    );
  }

  return {
    trip,
    role,
  };
}

export async function assertTripOwner(
  tripId: string,
  userId: string,
) {
  const trip = await findTripById(tripId);

  if (!trip) {
    throw new PermissionError(
      "TRIP_NOT_FOUND",
    );
  }

  if (trip.ownerId !== userId) {
    throw new PermissionError(
      "FORBIDDEN",
    );
  }

  return trip;
}