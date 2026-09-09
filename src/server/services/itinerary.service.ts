import { findTripById } from "@/server/repositories/trip.repository";
import {
  createItineraryItem,
  deleteItineraryItem,
  findItineraryItemById,
  findItineraryItemsByTrip,
} from "@/server/repositories/itinerary.repository";

export class ItineraryError extends Error {}

export function listItineraryItems(tripId: string) {
  return findItineraryItemsByTrip(tripId);
}

async function assertTripOwner(tripId: string, ownerId: string) {
  const trip = await findTripById(tripId);
  if (!trip) throw new ItineraryError("TRIP_NOT_FOUND");
  // UI only renders the add/delete controls for the owner — this check is
  // defense-in-depth, same pattern as trip.service.updateTrip.
  if (trip.ownerId !== ownerId) throw new ItineraryError("FORBIDDEN");
}

export async function addItineraryItem(
  tripId: string,
  ownerId: string,
  input: {
    day: number;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    notes: string | null;
    locationTagId: string | null;
  },
) {
  await assertTripOwner(tripId, ownerId);
  return createItineraryItem({ tripId, ...input });
}

export async function removeItineraryItem(itemId: string, ownerId: string) {
  const item = await findItineraryItemById(itemId);
  if (!item) throw new ItineraryError("NOT_FOUND");
  await assertTripOwner(item.tripId, ownerId);
  return deleteItineraryItem(itemId);
}
