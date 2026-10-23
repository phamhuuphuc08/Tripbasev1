import { PlanStatus, PlanVisibility, type TravelPace } from "@prisma/client";
import { prisma } from "@/server/db/client";

import {
  createTrip as createTripRepo,
  deleteTrip as deleteTripRepo,
  findTripById,
  findTripsByOwner,
  findTripsSharedWithUser,
} from "@/server/repositories/trip.repository";

import {
  createTraveler,
  deleteTraveler,
  findTravelerById,
} from "@/server/repositories/traveler.repository";

import {
  assertCanEditTrip,
  getTripRole,
  getTripShareLinkType,
  PermissionError,
  roleCanEdit,
} from "@/server/services/permission.service";

export class TripError extends Error {}

function tripDateKey(value: Date | null | undefined): number | null {
  if (!value) return null;
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}

function rebuildItineraryDate(
  tripStartDate: Date,
  day: number,
  currentTime: Date,
): Date {
  return new Date(
    Date.UTC(
      tripStartDate.getUTCFullYear(),
      tripStartDate.getUTCMonth(),
      tripStartDate.getUTCDate() + Math.max(day - 1, 0),
      currentTime.getUTCHours(),
      currentTime.getUTCMinutes(),
      currentTime.getUTCSeconds(),
      currentTime.getUTCMilliseconds(),
    ),
  );
}

async function assertOwner(tripId: string, userId: string) {
  const trip = await findTripById(tripId);

  if (!trip) throw new TripError("NOT_FOUND");
  if (trip.ownerId !== userId) throw new TripError("FORBIDDEN");

  return trip;
}

async function assertEditorOrOwner(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  try {
    const result = await assertCanEditTrip(tripId, userId, shareToken);
    return result.trip;
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") {
        throw new TripError("NOT_FOUND");
      }

      throw new TripError("FORBIDDEN");
    }

    throw error;
  }
}

export async function getTripDetail(
  id: string,
  viewerId?: string | null,
  shareToken?: string | null,
) {
  const trip = await findTripById(id);
  if (!trip) return null;

  const [role, shareLinkType] = await Promise.all([
    getTripRole(id, viewerId),
    getTripShareLinkType(id, shareToken),
  ]);

  const isOwner = role === "OWNER";
  const isPublic = trip.visibility === PlanVisibility.PUBLIC;
  const canView = isPublic || role !== "NONE" || shareLinkType !== null;
  const canEdit =
    roleCanEdit(role) ||
    (shareLinkType === "EDIT" && viewerId != null);

  if (!canView) return null;

  const requiresLogin = viewerId == null && shareLinkType === "EDIT";

  return {
    trip,
    role,
    isOwner,
    canEdit,
    requiresLogin,
    shareLinkType,
  };
}

export function listOwnedTrips(ownerId: string) {
  return findTripsByOwner(ownerId);
}

export function listSharedTrips(userId: string) {
  return findTripsSharedWithUser(userId);
}

export function createTrip(
  ownerId: string,
  input: {
    name: string;
    destination: string;
    coverImageUrl: string | null;
    startDate: Date | null;
    endDate: Date | null;
    visibility: PlanVisibility;
    travelerCount: number;
    budgetTarget: number | null;
    pace: TravelPace;
    travelStyle: string[];
  },
) {
  return createTripRepo({
    ownerId,
    ...input,
  });
}

export async function updateTrip(
  tripId: string,
  userId: string,
  input: {
    name: string;
    destination: string;
    coverImageUrl?: string;
    startDate: Date | null;
    endDate: Date | null;
    visibility: PlanVisibility;
    status: PlanStatus;
    travelerCount: number;
    budgetTarget: number | null;
    pace: TravelPace;
    travelStyle: string[];
  },
  shareToken?: string | null,
) {
  const currentTrip = await assertEditorOrOwner(tripId, userId, shareToken);

  /*
   * Chỉ Owner được phép:
   * - chuyển sang COMPLETED
   * - chuyển từ COMPLETED về trạng thái khác
   */
  if (
    input.status !== currentTrip.status &&
    (input.status === PlanStatus.COMPLETED ||
      currentTrip.status === PlanStatus.COMPLETED) &&
    currentTrip.ownerId !== userId
  ) {
    throw new TripError("FORBIDDEN");
  }

  const startDateChanged =
    tripDateKey(currentTrip.startDate) !== tripDateKey(input.startDate);

  return prisma.$transaction(async (tx) => {
    /*
     * M12 — Verified by Author
     *
     * COMPLETED chưa chắc là Verified.
     * Evidence MVP:
     * - Story có ảnh
     * - Booking có document
     */
    let verifiedByAuthor = false;

    if (input.status === PlanStatus.COMPLETED) {
const storyPhotoCount = await tx.storySlide.count({
  where: {
    tripId,
    photo: { not: null },
  },
});

verifiedByAuthor = storyPhotoCount > 0;
    }

    const updatedTrip = await tx.trip.update({
      where: { id: tripId },
      data: {
        ...input,
        verifiedByAuthor,
      },
    });

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

export async function deleteTrip(
  tripId: string,
  userId: string,
) {
  await assertOwner(tripId, userId);
  return deleteTripRepo(tripId);
}

export async function addTraveler(
  tripId: string,
  userId: string,
  input: {
    name: string;
    ageGroup: string | null;
  },
  shareToken?: string | null,
) {
  await assertEditorOrOwner(tripId, userId, shareToken);

  return createTraveler({
    tripId,
    ...input,
  });
}

export async function removeTraveler(
  travelerId: string,
  userId: string,
  shareToken?: string | null,
) {
  const traveler = await findTravelerById(travelerId);

  if (!traveler) {
    throw new TripError("NOT_FOUND");
  }

  await assertEditorOrOwner(
    traveler.tripId,
    userId,
    shareToken,
  );

  return deleteTraveler(travelerId);
}
