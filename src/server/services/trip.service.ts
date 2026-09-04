import { PlanVisibility, type PlanStatus } from "@prisma/client";
import {
  createTrip as createTripRepo,
  findTripById,
  findTripsByOwner,
  updateTrip as updateTripRepo,
} from "@/server/repositories/trip.repository";

export class TripError extends Error {}

export async function getTripDetail(id: string, viewerId?: string) {
  const trip = await findTripById(id);
  if (!trip) return null;

  const isOwner = viewerId != null && trip.ownerId === viewerId;
  const isPublic = trip.visibility === PlanVisibility.PUBLIC;

  // Private and not yours: behave like it doesn't exist, don't leak that a
  // private plan with this id is out there.
  if (!isPublic && !isOwner) return null;

  // mục 3.3/6b của spec: xem chi tiết plan public vẫn cần đăng nhập.
  const requiresLogin = viewerId == null;

  return { trip, isOwner, requiresLogin };
}

export function listOwnedTrips(ownerId: string) {
  return findTripsByOwner(ownerId);
}

export function createTrip(
  ownerId: string,
  input: {
    name: string;
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    visibility: PlanVisibility;
  },
) {
  return createTripRepo({ ownerId, ...input });
}

export async function updateTrip(
  tripId: string,
  ownerId: string,
  input: {
    name: string;
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    visibility: PlanVisibility;
    status: PlanStatus;
  },
) {
  const trip = await findTripById(tripId);
  if (!trip) throw new TripError("NOT_FOUND");
  // UI only ever renders the edit form for the owner — this is
  // defense-in-depth, not the primary access check.
  if (trip.ownerId !== ownerId) throw new TripError("FORBIDDEN");

  return updateTripRepo(tripId, input);
}
