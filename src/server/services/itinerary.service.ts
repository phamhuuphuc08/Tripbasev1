import {
  estimateTravelBetween,
  formatDistanceKm,
  isValidGeoPoint,
} from "@/features/map/geo";
import { findTripById } from "@/server/repositories/trip.repository";
import {
  createItineraryItem,
  deleteItineraryItem,
  findItineraryItemById,
  findItineraryItemsByTrip,
  reorderItineraryItems as reorderItineraryItemsRepo,
  updateItineraryItem,
} from "@/server/repositories/itinerary.repository";

export class ItineraryError extends Error {}

type TimeRangeItem = {
  id: string;
  day: number;
  startTime: Date | null;
  endTime: Date | null;
};

type TravelTimeItem = TimeRangeItem & {
  locationTag?: {
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type ItineraryItemInput = {
  day: number;
  title: string;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  locationTagId: string | null;
};

export interface ItineraryOverlap {
  itemId: string;
  overlappingItemIds: string[];
}

export interface ItineraryShortGap {
  itemId: string;
  previousItemId: string;
  gapMinutes: number;
}

export interface ItineraryTravelSegment {
  itemId: string;
  previousItemId: string;
  distanceKm: number;
  estimatedMinutes: number;
  availableMinutes: number;
  insufficientTravelTime: boolean;
}

export const MIN_ITINERARY_GAP_MINUTES = 15;

function getTimeMinutes(value: Date | null): number | null {
  if (!value) return null;
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

export async function listItineraryItems(tripId: string) {
  const items = await findItineraryItemsByTrip(tripId);

  return items.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;

    const timeA = getTimeMinutes(a.startTime);
    const timeB = getTimeMinutes(b.startTime);

    if (timeA == null && timeB != null) return 1;
    if (timeA != null && timeB == null) return -1;
    if (timeA != null && timeB != null && timeA !== timeB) return timeA - timeB;

    return a.sortOrder - b.sortOrder;
  });
}

function itemsOverlap(first: TimeRangeItem, second: TimeRangeItem): boolean {
  if (first.day !== second.day) return false;

  const firstStart = getTimeMinutes(first.startTime);
  const firstEnd = getTimeMinutes(first.endTime);
  const secondStart = getTimeMinutes(second.startTime);
  const secondEnd = getTimeMinutes(second.endTime);

  if (
    firstStart == null ||
    firstEnd == null ||
    secondStart == null ||
    secondEnd == null
  ) {
    return false;
  }

  if (firstEnd <= firstStart || secondEnd <= secondStart) return false;

  return firstStart < secondEnd && firstEnd > secondStart;
}

export function detectItineraryOverlaps(
  items: TimeRangeItem[],
): ItineraryOverlap[] {
  const overlapMap = new Map<string, Set<string>>();

  for (let i = 0; i < items.length; i += 1) {
    const first = items[i];

    for (let j = i + 1; j < items.length; j += 1) {
      const second = items[j];
      if (!itemsOverlap(first, second)) continue;

      const firstOverlaps =
        overlapMap.get(first.id) ?? new Set<string>();

      firstOverlaps.add(second.id);
      overlapMap.set(first.id, firstOverlaps);

      const secondOverlaps =
        overlapMap.get(second.id) ?? new Set<string>();

      secondOverlaps.add(first.id);
      overlapMap.set(second.id, secondOverlaps);
    }
  }

  return Array.from(overlapMap.entries()).map(
    ([itemId, overlappingIds]) => ({
      itemId,
      overlappingItemIds: Array.from(overlappingIds),
    }),
  );
}

export function detectItineraryShortGaps(
  items: TimeRangeItem[],
  minimumGapMinutes = MIN_ITINERARY_GAP_MINUTES,
): ItineraryShortGap[] {
  const result: ItineraryShortGap[] = [];
  const itemsByDay = new Map<number, TimeRangeItem[]>();

  for (const item of items) {
    const dayItems = itemsByDay.get(item.day) ?? [];
    dayItems.push(item);
    itemsByDay.set(item.day, dayItems);
  }

  for (const dayItems of itemsByDay.values()) {
    const validItems = dayItems
      .filter((item) => {
        const start = getTimeMinutes(item.startTime);
        const end = getTimeMinutes(item.endTime);

        return start != null && end != null && end > start;
      })
      .sort(
        (a, b) =>
          (getTimeMinutes(a.startTime) ?? 0) -
          (getTimeMinutes(b.startTime) ?? 0),
      );

    for (let i = 1; i < validItems.length; i += 1) {
      const previous = validItems[i - 1];
      const current = validItems[i];

      const previousEnd = getTimeMinutes(previous.endTime);
      const currentStart = getTimeMinutes(current.startTime);

      if (previousEnd == null || currentStart == null) continue;

      const gapMinutes = currentStart - previousEnd;

      // gap < 0 = đang trùng giờ, overlap warning đã xử lý.
      if (
        gapMinutes >= 0 &&
        gapMinutes < minimumGapMinutes
      ) {
        result.push({
          itemId: current.id,
          previousItemId: previous.id,
          gapMinutes,
        });
      }
    }
  }

  return result;
}

/**
 * Tính khoảng cách và thời gian di chuyển giữa các hoạt động liên tiếp.
 *
 * Chỉ xử lý khi:
 * - cùng ngày
 * - hoạt động trước có giờ kết thúc
 * - hoạt động sau có giờ bắt đầu
 * - cả hai LocationTag đều có tọa độ hợp lệ
 * - hai hoạt động không bị trùng giờ
 *
 * itemId là hoạt động ĐẾN.
 * previousItemId là hoạt động ĐI TỪ.
 */
export function detectItineraryTravel(
  items: TravelTimeItem[],
): ItineraryTravelSegment[] {
  const result: ItineraryTravelSegment[] = [];
  const itemsByDay = new Map<number, TravelTimeItem[]>();

  for (const item of items) {
    const dayItems = itemsByDay.get(item.day) ?? [];
    dayItems.push(item);
    itemsByDay.set(item.day, dayItems);
  }

  for (const dayItems of itemsByDay.values()) {
    const sortedItems = dayItems
      .filter((item) => getTimeMinutes(item.startTime) != null)
      .sort(
        (a, b) =>
          (getTimeMinutes(a.startTime) ?? 0) -
          (getTimeMinutes(b.startTime) ?? 0),
      );

    for (let i = 1; i < sortedItems.length; i += 1) {
      const previous = sortedItems[i - 1];
      const current = sortedItems[i];

      const previousEnd = getTimeMinutes(previous.endTime);
      const currentStart = getTimeMinutes(current.startTime);

      if (previousEnd == null || currentStart == null) continue;

      const availableMinutes = currentStart - previousEnd;

      // Nếu âm thì hai hoạt động đang trùng giờ.
      // Phần này đã được overlap warning xử lý.
      if (availableMinutes < 0) continue;

      const previousLocation = previous.locationTag;
      const currentLocation = current.locationTag;

      if (
        previousLocation?.latitude == null ||
        previousLocation.longitude == null ||
        currentLocation?.latitude == null ||
        currentLocation.longitude == null
      ) {
        continue;
      }

      const from = {
        latitude: previousLocation.latitude,
        longitude: previousLocation.longitude,
      };

      const to = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      };

      if (!isValidGeoPoint(from) || !isValidGeoPoint(to)) continue;

      const travel = estimateTravelBetween(from, to);

      result.push({
        itemId: current.id,
        previousItemId: previous.id,
        distanceKm: formatDistanceKm(travel.distanceKm),
        estimatedMinutes: travel.estimatedMinutes,
        availableMinutes,
        insufficientTravelTime:
          travel.estimatedMinutes > availableMinutes,
      });
    }
  }

  return result;
}

async function assertTripOwner(
  tripId: string,
  ownerId: string,
) {
  const trip = await findTripById(tripId);

  if (!trip) throw new ItineraryError("TRIP_NOT_FOUND");
  if (trip.ownerId !== ownerId) {
    throw new ItineraryError("FORBIDDEN");
  }

  return trip;
}

export async function addItineraryItem(
  tripId: string,
  ownerId: string,
  input: ItineraryItemInput,
) {
  await assertTripOwner(tripId, ownerId);

  return createItineraryItem({
    tripId,
    ...input,
  });
}

export async function editItineraryItem(
  itemId: string,
  ownerId: string,
  input: ItineraryItemInput,
) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");

  await assertTripOwner(item.tripId, ownerId);

  return updateItineraryItem(itemId, {
    day: input.day,
    title: input.title,
    startTime: input.startTime,
    endTime: input.endTime,
    notes: input.notes,
    locationTagId: input.locationTagId,
  });
}

export async function removeItineraryItem(
  itemId: string,
  ownerId: string,
) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");

  await assertTripOwner(item.tripId, ownerId);

  return deleteItineraryItem(itemId);
}

export async function reorderItineraryItems(
  tripId: string,
  ownerId: string,
  items: {
    id: string;
    day: number;
    sortOrder: number;
  }[],
) {
  await assertTripOwner(tripId, ownerId);

  if (
    !items.length ||
    items.some(
      (item) =>
        !Number.isInteger(item.day) ||
        item.day < 1 ||
        !Number.isInteger(item.sortOrder) ||
        item.sortOrder < 0,
    )
  ) {
    throw new ItineraryError("INVALID_ORDER");
  }

  const currentItems =
    await findItineraryItemsByTrip(tripId);

  const allowedIds = new Set(
    currentItems.map((item) => item.id),
  );

  const submittedIds = new Set(
    items.map((item) => item.id),
  );

  if (
    submittedIds.size !== items.length ||
    items.some((item) => !allowedIds.has(item.id))
  ) {
    throw new ItineraryError("INVALID_ORDER");
  }

  return reorderItineraryItemsRepo(items);
}