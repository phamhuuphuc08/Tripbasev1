import {
  PlanVisibility,
  type PlanStatus,
  type TravelPace,
} from "@prisma/client";
import {
  createTrip as createTripRepo,
  deleteTrip as deleteTripRepo,
  findTripById,
  findTripsByOwner,
  updateTrip as updateTripRepo,
} from "@/server/repositories/trip.repository";
import {
  createTraveler,
  deleteTraveler,
  findTravelerById,
} from "@/server/repositories/traveler.repository";

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
    travelerCount: number;
    budgetTarget: number | null;
    pace: TravelPace;
    travelStyle: string[];
  },
) {
  return createTripRepo({ ownerId, ...input });
}

async function assertOwner(tripId: string, ownerId: string) {
  const trip = await findTripById(tripId);
  if (!trip) throw new TripError("NOT_FOUND");
  // UI only ever renders owner-only controls for the owner — this is
  // defense-in-depth, not the primary access check.
  if (trip.ownerId !== ownerId) throw new TripError("FORBIDDEN");
  return trip;
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
    travelerCount: number;
    budgetTarget: number | null;
    pace: TravelPace;
    travelStyle: string[];
  },
) {
  await assertOwner(tripId, ownerId);
  return updateTripRepo(tripId, input);
}

export async function deleteTrip(tripId: string, ownerId: string) {
  await assertOwner(tripId, ownerId);
  return deleteTripRepo(tripId);
}

export async function addTraveler(
  tripId: string,
  ownerId: string,
  input: { name: string; ageGroup: string | null },
) {
  await assertOwner(tripId, ownerId);
  return createTraveler({ tripId, ...input });
}

export async function removeTraveler(travelerId: string, ownerId: string) {
  const traveler = await findTravelerById(travelerId);
  if (!traveler) throw new TripError("NOT_FOUND");
  await assertOwner(traveler.tripId, ownerId);
  return deleteTraveler(travelerId);
}
