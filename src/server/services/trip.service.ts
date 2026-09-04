import { PlanVisibility, type PlanStatus, type TravelPace } from "@prisma/client";
import {
  createTrip as createTripRepo,
  deleteTrip as deleteTripRepo,
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

  if (!isPublic && !isOwner) return null;

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
    travelerCount: number;
    budgetTarget: number | null;
    travelStyle: string[];
    pace: TravelPace;
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
    travelerCount: number;
    budgetTarget: number | null;
    travelStyle: string[];
    pace: TravelPace;
    visibility: PlanVisibility;
    status: PlanStatus;
  },
) {
  const trip = await findTripById(tripId);

  if (!trip) throw new TripError("NOT_FOUND");
  if (trip.ownerId !== ownerId) throw new TripError("FORBIDDEN");

  return updateTripRepo(tripId, input);
}

export async function deleteTrip(tripId: string, ownerId: string) {
  const trip = await findTripById(tripId);

  if (!trip) throw new TripError("NOT_FOUND");
  if (trip.ownerId !== ownerId) throw new TripError("FORBIDDEN");

  return deleteTripRepo(tripId);
}