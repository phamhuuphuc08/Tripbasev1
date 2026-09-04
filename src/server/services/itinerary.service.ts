import {
  createItineraryItem as createItineraryItemRepo,
  deleteItineraryItem as deleteItineraryItemRepo,
  findItineraryByTrip,
  findItineraryItemById,
  updateItineraryItem as updateItineraryItemRepo,
} from "@/server/repositories/itinerary.repository";
import { findTripById } from "@/server/repositories/trip.repository";

export class ItineraryError extends Error {}

export function listTripItinerary(tripId: string) {
  return findItineraryByTrip(tripId);
}

export async function createItineraryItem(
  ownerId: string,
  input: {
    tripId: string;
    title: string;
    day: number;
    startTime: Date | null;
    endTime: Date | null;
    sortOrder: number;
    placeId?: string | null;
    locationTagId?: string | null;
    notes?: string | null;
  },
) {
  const trip = await findTripById(input.tripId);

  if (!trip) throw new ItineraryError("TRIP_NOT_FOUND");
  if (trip.ownerId !== ownerId) throw new ItineraryError("FORBIDDEN");

  if (input.endTime && input.startTime && input.endTime < input.startTime) {
    throw new ItineraryError("END_BEFORE_START");
  }

  return createItineraryItemRepo(input);
}

export async function updateItineraryItem(
  itemId: string,
  ownerId: string,
  input: {
    title: string;
    day: number;
    startTime: Date | null;
    endTime: Date | null;
    sortOrder: number;
    placeId?: string | null;
    locationTagId?: string | null;
    notes?: string | null;
  },
) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");
  if (item.trip.ownerId !== ownerId) throw new ItineraryError("FORBIDDEN");

  if (input.endTime && input.startTime && input.endTime < input.startTime) {
    throw new ItineraryError("END_BEFORE_START");
  }

  return updateItineraryItemRepo(itemId, input);
}

export async function deleteItineraryItem(
  itemId: string,
  ownerId: string,
) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");
  if (item.trip.ownerId !== ownerId) throw new ItineraryError("FORBIDDEN");

  return deleteItineraryItemRepo(itemId);
}