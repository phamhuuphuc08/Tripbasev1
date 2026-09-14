import {
  PlanVisibility,
  type PlanStatus,
  type TravelPace,
} from "@prisma/client";
import { prisma } from "@/server/db/client";
import {
  createTrip as createTripRepo,
  deleteTrip as deleteTripRepo,
  findTripById,
  findTripsByOwner,
} from "@/server/repositories/trip.repository";
import {
  createTraveler,
  deleteTraveler,
  findTravelerById,
} from "@/server/repositories/traveler.repository";

export class TripError extends Error {}

function tripDateKey(value: Date | null | undefined): number | null {
  if (!value) return null;
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function rebuildItineraryDate(tripStartDate: Date, day: number, currentTime: Date): Date {
  return new Date(Date.UTC(
    tripStartDate.getUTCFullYear(),
    tripStartDate.getUTCMonth(),
    tripStartDate.getUTCDate() + Math.max(day - 1, 0),
    currentTime.getUTCHours(),
    currentTime.getUTCMinutes(),
    currentTime.getUTCSeconds(),
    currentTime.getUTCMilliseconds(),
  ));
}

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
  const currentTrip = await assertOwner(tripId, ownerId);
  const startDateChanged = tripDateKey(currentTrip.startDate) !== tripDateKey(input.startDate);

  return prisma.$transaction(async (tx) => {
    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: input,
    });

    // Khi Trip.startDate đổi, đồng bộ lại ngày thật của tất cả activity
    // nhưng giữ nguyên giờ/phút hiện tại.
    //
    // VD:
    // Trip cũ: 10/09, Day 2 08:30 -> 11/09 08:30
    // Trip mới: 20/09, Day 2 08:30 -> 21/09 08:30
    if (startDateChanged && input.startDate) {
      const items = await tx.itineraryItem.findMany({
        where: {
          tripId,
          OR: [
            { startTime: { not: null } },
            { endTime: { not: null } },
          ],
        },
        select: {
          id: true,
          day: true,
          startTime: true,
          endTime: true,
        },
      });

      for (const item of items) {
        const startTime = item.startTime
          ? rebuildItineraryDate(input.startDate, item.day, item.startTime)
          : null;

        const endTime = item.endTime
          ? rebuildItineraryDate(input.startDate, item.day, item.endTime)
          : null;

        await tx.itineraryItem.update({
          where: { id: item.id },
          data: { startTime, endTime },
        });
      }
    }

    return updatedTrip;
  });
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