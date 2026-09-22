import { estimateTravelBetween, formatDistanceKm, isValidGeoPoint } from "@/features/map/geo";
import { prisma } from "@/server/db/client";
import {
  createItineraryComment as createItineraryCommentRepo, createItineraryItem, createItineraryVote,
  deleteItineraryComment as deleteItineraryCommentRepo, deleteItineraryItem, deleteItineraryVotesByUser,
  findItineraryCommentById, findItineraryItemById, findItineraryItemsByTrip, findItineraryVoteByUser,
  reorderItineraryItems as reorderItineraryItemsRepo, updateItineraryItem,
} from "@/server/repositories/itinerary.repository";
import { findTripById } from "@/server/repositories/trip.repository";
import { assertCanEditTrip, PermissionError } from "@/server/services/permission.service";

export class ItineraryError extends Error {}

type TimeRangeItem = { id: string; day: number; startTime: Date | null; endTime: Date | null };
type TravelTimeItem = TimeRangeItem & { locationTag?: { latitude: number | null; longitude: number | null } | null };
type OpeningHoursItem = TimeRangeItem & {
  locationTag?: { title?: string; openingHours: string | null } | null;
  place?: { name?: string; openingHours: string | null } | null;
};
type ItineraryItemInput = {
  day: number; title: string; startTime: Date | null; endTime: Date | null;
  notes: string | null; locationTagId: string | null; placeId?: string | null;
};

export interface ItineraryOverlap { itemId: string; overlappingItemIds: string[] }
export interface ItineraryShortGap { itemId: string; previousItemId: string; gapMinutes: number }
export interface ItineraryTravelSegment {
  itemId: string; previousItemId: string; distanceKm: number; estimatedMinutes: number;
  availableMinutes: number; insufficientTravelTime: boolean;
}
export interface ItineraryOpeningHoursWarning { itemId: string; openingHours: string; placeName: string | null }
export interface ItineraryVoteSummary { up: number; down: number; score: number; currentUserVote: "UP" | "DOWN" | null }

export const MIN_ITINERARY_GAP_MINUTES = 15;
export const MAX_ITINERARY_COMMENT_LENGTH = 1000;
const DAY_MS = 86400000;

function getTimeMinutes(value: Date | null): number | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function getUtcDateStamp(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function getTripDayCount(startDate: Date | null, endDate: Date | null): number | null {
  if (!startDate || !endDate) return null;
  const difference = getUtcDateStamp(endDate) - getUtcDateStamp(startDate);
  if (difference < 0) return 1;
  return Math.floor(difference / DAY_MS) + 1;
}

function validateDay(day: number, startDate: Date | null, endDate: Date | null) {
  if (!Number.isInteger(day) || day < 1) throw new ItineraryError("DAY_OUT_OF_RANGE");
  const totalDays = getTripDayCount(startDate, endDate);
  if (totalDays != null && day > totalDays) throw new ItineraryError("DAY_OUT_OF_RANGE");
}

export function buildTripDateTime(tripStartDate: Date, day: number, value: Date | null): Date | null {
  if (!value) return null;
  if (Number.isNaN(tripStartDate.getTime()) || Number.isNaN(value.getTime())) throw new ItineraryError("DATETIME_INVALID");
  return new Date(Date.UTC(
    tripStartDate.getUTCFullYear(), tripStartDate.getUTCMonth(), tripStartDate.getUTCDate() + day - 1,
    value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds(), value.getUTCMilliseconds(),
  ));
}

function normalizeSchedule(day: number, startTime: Date | null, endTime: Date | null, tripStartDate: Date | null, tripEndDate: Date | null) {
  validateDay(day, tripStartDate, tripEndDate);
  if ((startTime || endTime) && !tripStartDate) throw new ItineraryError("TRIP_START_DATE_REQUIRED");

  const normalizedStart = tripStartDate && startTime ? buildTripDateTime(tripStartDate, day, startTime) : null;
  const normalizedEnd = tripStartDate && endTime ? buildTripDateTime(tripStartDate, day, endTime) : null;

  if (normalizedStart && normalizedEnd && normalizedEnd.getTime() <= normalizedStart.getTime()) {
    throw new ItineraryError("END_BEFORE_START");
  }

  return { startTime: normalizedStart, endTime: normalizedEnd };
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

  if (firstStart == null || firstEnd == null || secondStart == null || secondEnd == null) return false;
  if (firstEnd <= firstStart || secondEnd <= secondStart) return false;

  return firstStart < secondEnd && firstEnd > secondStart;
}

export function detectItineraryOverlaps(items: TimeRangeItem[]): ItineraryOverlap[] {
  const overlapMap = new Map<string, Set<string>>();

  for (let i = 0; i < items.length; i += 1) {
    const first = items[i];

    for (let j = i + 1; j < items.length; j += 1) {
      const second = items[j];
      if (!itemsOverlap(first, second)) continue;

      const firstOverlaps = overlapMap.get(first.id) ?? new Set<string>();
      firstOverlaps.add(second.id);
      overlapMap.set(first.id, firstOverlaps);

      const secondOverlaps = overlapMap.get(second.id) ?? new Set<string>();
      secondOverlaps.add(first.id);
      overlapMap.set(second.id, secondOverlaps);
    }
  }

  return Array.from(overlapMap.entries()).map(([itemId, overlappingIds]) => ({
    itemId, overlappingItemIds: Array.from(overlappingIds),
  }));
}

export function detectItineraryShortGaps(items: TimeRangeItem[], minimumGapMinutes = MIN_ITINERARY_GAP_MINUTES): ItineraryShortGap[] {
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
      .sort((a, b) => (getTimeMinutes(a.startTime) ?? 0) - (getTimeMinutes(b.startTime) ?? 0));

    for (let i = 1; i < validItems.length; i += 1) {
      const previous = validItems[i - 1];
      const current = validItems[i];
      const previousEnd = getTimeMinutes(previous.endTime);
      const currentStart = getTimeMinutes(current.startTime);

      if (previousEnd == null || currentStart == null) continue;

      const gapMinutes = currentStart - previousEnd;
      if (gapMinutes >= 0 && gapMinutes < minimumGapMinutes) {
        result.push({ itemId: current.id, previousItemId: previous.id, gapMinutes });
      }
    }
  }

  return result;
}

export function detectItineraryTravel(items: TravelTimeItem[]): ItineraryTravelSegment[] {
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
      .sort((a, b) => (getTimeMinutes(a.startTime) ?? 0) - (getTimeMinutes(b.startTime) ?? 0));

    for (let i = 1; i < sortedItems.length; i += 1) {
      const previous = sortedItems[i - 1];
      const current = sortedItems[i];
      const previousEnd = getTimeMinutes(previous.endTime);
      const currentStart = getTimeMinutes(current.startTime);

      if (previousEnd == null || currentStart == null) continue;

      const availableMinutes = currentStart - previousEnd;
      if (availableMinutes < 0) continue;

      const previousLocation = previous.locationTag;
      const currentLocation = current.locationTag;

      if (
        previousLocation?.latitude == null || previousLocation.longitude == null ||
        currentLocation?.latitude == null || currentLocation.longitude == null
      ) continue;

      const from = { latitude: previousLocation.latitude, longitude: previousLocation.longitude };
      const to = { latitude: currentLocation.latitude, longitude: currentLocation.longitude };

      if (!isValidGeoPoint(from) || !isValidGeoPoint(to)) continue;

      const travel = estimateTravelBetween(from, to);

      result.push({
        itemId: current.id,
        previousItemId: previous.id,
        distanceKm: formatDistanceKm(travel.distanceKm),
        estimatedMinutes: travel.estimatedMinutes,
        availableMinutes,
        insufficientTravelTime: travel.estimatedMinutes > availableMinutes,
      });
    }
  }

  return result;
}

function parseOpeningHours(value: string): { openMinutes: number; closeMinutes: number } | null {
  const match = /^\s*([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)\s*$/.exec(value);
  if (!match) return null;

  return {
    openMinutes: Number(match[1]) * 60 + Number(match[2]),
    closeMinutes: Number(match[3]) * 60 + Number(match[4]),
  };
}

function isInsideOpeningHours(startMinutes: number | null, endMinutes: number | null, openMinutes: number, closeMinutes: number): boolean {
  if (startMinutes == null && endMinutes == null) return true;

  const start = startMinutes ?? endMinutes;
  const end = endMinutes ?? startMinutes;

  if (start == null || end == null) return true;
  if (openMinutes === closeMinutes) return true;

  if (openMinutes < closeMinutes) return start >= openMinutes && end <= closeMinutes;

  const afterOpening = start >= openMinutes && end >= openMinutes;
  const beforeClosing = start <= closeMinutes && end <= closeMinutes;

  return afterOpening || beforeClosing;
}

export function detectItineraryOpeningHours(items: OpeningHoursItem[]): ItineraryOpeningHoursWarning[] {
  const result: ItineraryOpeningHoursWarning[] = [];

  for (const item of items) {
    const openingHours = item.locationTag?.openingHours ?? item.place?.openingHours ?? null;
    if (!openingHours) continue;

    const parsed = parseOpeningHours(openingHours);
    if (!parsed) continue;

    const startMinutes = getTimeMinutes(item.startTime);
    const endMinutes = getTimeMinutes(item.endTime);

    if (isInsideOpeningHours(startMinutes, endMinutes, parsed.openMinutes, parsed.closeMinutes)) continue;

    result.push({
      itemId: item.id,
      openingHours,
      placeName: item.locationTag?.title ?? item.place?.name ?? null,
    });
  }

  return result;
}

export function summarizeItineraryVotes(
  votes: { userId: string; voteType: "UP" | "DOWN" }[],
  currentUserId?: string | null,
): ItineraryVoteSummary {
  let up = 0;
  let down = 0;
  let currentUserVote: "UP" | "DOWN" | null = null;

  for (const vote of votes) {
    if (vote.voteType === "UP") up += 1;
    if (vote.voteType === "DOWN") down += 1;
    if (currentUserId && vote.userId === currentUserId) currentUserVote = vote.voteType;
  }

  return { up, down, score: up - down, currentUserVote };
}

async function assertTripEditor(tripId: string, userId: string, shareToken?: string | null) {
  const trip = await findTripById(tripId);
  if (!trip) throw new ItineraryError("TRIP_NOT_FOUND");

  try {
    await assertCanEditTrip(tripId, userId, shareToken);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new ItineraryError("TRIP_NOT_FOUND");
      throw new ItineraryError("FORBIDDEN");
    }
    throw error;
  }

  return trip;
}

export async function addItineraryItem(
  tripId: string, userId: string, input: ItineraryItemInput, shareToken?: string | null,
) {
  const trip = await assertTripEditor(tripId, userId, shareToken);
  const schedule = normalizeSchedule(input.day, input.startTime, input.endTime, trip.startDate, trip.endDate);
  const existingItems = await findItineraryItemsByTrip(tripId);
  const dayItems = existingItems.filter((item) => item.day === input.day);

  const nextSortOrder = dayItems.length === 0
    ? 0
    : Math.max(...dayItems.map((item) => item.sortOrder)) + 1;

  return createItineraryItem({
    tripId,
    day: input.day,
    title: input.title,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    notes: input.notes,
    locationTagId: input.locationTagId,
    placeId: input.placeId ?? null,
    sortOrder: nextSortOrder,
  });
}

export async function editItineraryItem(
  itemId: string, userId: string, input: ItineraryItemInput, shareToken?: string | null,
) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");
  await assertTripEditor(item.trip.id, userId, shareToken);

  const schedule = normalizeSchedule(input.day, input.startTime, input.endTime, item.trip.startDate, item.trip.endDate);

  return updateItineraryItem(itemId, {
    day: input.day,
    title: input.title,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    notes: input.notes,
    locationTagId: input.locationTagId,
    placeId: input.placeId ?? null,
  });
}

export async function removeItineraryItem(itemId: string, userId: string, shareToken?: string | null) {
  const item = await findItineraryItemById(itemId);

  if (!item) throw new ItineraryError("NOT_FOUND");
  await assertTripEditor(item.trip.id, userId, shareToken);

  return deleteItineraryItem(itemId);
}

export async function reorderItineraryItems(
  tripId: string,
  userId: string,
  items: { id: string; day: number; sortOrder: number }[],
  shareToken?: string | null,
) {
  const trip = await assertTripEditor(tripId, userId, shareToken);

  if (
    !items.length ||
    items.some((item) =>
      !Number.isInteger(item.day) || item.day < 1 ||
      !Number.isInteger(item.sortOrder) || item.sortOrder < 0
    )
  ) throw new ItineraryError("INVALID_ORDER");

  for (const submitted of items) validateDay(submitted.day, trip.startDate, trip.endDate);

  const currentItems = await findItineraryItemsByTrip(tripId);
  const currentItemMap = new Map(currentItems.map((item) => [item.id, item]));
  const submittedIds = new Set(items.map((item) => item.id));

  if (submittedIds.size !== items.length || items.some((item) => !currentItemMap.has(item.id))) {
    throw new ItineraryError("INVALID_ORDER");
  }

  const normalizedItems = items.map((submitted) => {
    const current = currentItemMap.get(submitted.id);
    if (!current) throw new ItineraryError("INVALID_ORDER");

    if (!trip.startDate && submitted.day !== current.day && (current.startTime || current.endTime)) {
      throw new ItineraryError("TRIP_START_DATE_REQUIRED");
    }

    const startTime = trip.startDate && current.startTime
      ? buildTripDateTime(trip.startDate, submitted.day, current.startTime)
      : current.startTime;

    const endTime = trip.startDate && current.endTime
      ? buildTripDateTime(trip.startDate, submitted.day, current.endTime)
      : current.endTime;

    return { id: submitted.id, day: submitted.day, sortOrder: submitted.sortOrder, startTime, endTime };
  });

  return reorderItineraryItemsRepo(normalizedItems);
}

async function assertCanInteractWithTrip(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  const trip = await findTripById(tripId);
  if (!trip) throw new ItineraryError("TRIP_NOT_FOUND");

  if (trip.ownerId === userId || trip.visibility === "PUBLIC") {
    return trip;
  }

  const collaborator = await prisma.collaborator.findFirst({
    where: { planId: tripId, userId },
    select: { id: true, role: true },
  });

  if (collaborator) return trip;

  if (shareToken) {
    try {
      await assertCanEditTrip(tripId, userId, shareToken);
      return trip;
    } catch (error) {
      if (error instanceof PermissionError) {
        if (error.code === "TRIP_NOT_FOUND") {
          throw new ItineraryError("TRIP_NOT_FOUND");
        }

        throw new ItineraryError("FORBIDDEN");
      }

      throw error;
    }
  }

  throw new ItineraryError("FORBIDDEN");
}

async function assertCanInteractWithItem(
  itemId: string,
  userId: string,
  shareToken?: string | null,
) {
  const item = await findItineraryItemById(itemId);
  if (!item) throw new ItineraryError("NOT_FOUND");

  await assertCanInteractWithTrip(
    item.trip.id,
    userId,
    shareToken,
  );

  return item;
}

export async function voteItineraryItem(
  itemId: string,
  userId: string,
  voteType: "UP" | "DOWN",
  shareToken?: string | null,
) {
  await assertCanInteractWithItem(
    itemId,
    userId,
    shareToken,
  );

  const existing =
    await findItineraryVoteByUser(itemId, userId);

  if (existing && existing.voteType === voteType) {
    await deleteItineraryVotesByUser(itemId, userId);

    return {
      action: "REMOVED" as const,
      voteType: null,
    };
  }

  await deleteItineraryVotesByUser(itemId, userId);
  await createItineraryVote(itemId, userId, voteType);

  return {
    action: existing
      ? ("CHANGED" as const)
      : ("CREATED" as const),
    voteType,
  };
}

export async function addItineraryComment(
  itemId: string,
  userId: string,
  content: string,
  shareToken?: string | null,
) {
  await assertCanInteractWithItem(
    itemId,
    userId,
    shareToken,
  );

  const normalized = content.trim();

  if (!normalized) {
    throw new ItineraryError("COMMENT_REQUIRED");
  }

  if (normalized.length > MAX_ITINERARY_COMMENT_LENGTH) {
    throw new ItineraryError("COMMENT_TOO_LONG");
  }

  return createItineraryCommentRepo(
    itemId,
    userId,
    normalized,
  );
}

export async function removeItineraryComment(
  commentId: string,
  userId: string,
  shareToken?: string | null,
) {
  const comment =
    await findItineraryCommentById(commentId);

  if (!comment) {
    throw new ItineraryError("COMMENT_NOT_FOUND");
  }

  if (
    comment.targetType !== "ITINERARY_ITEM" ||
    !comment.item
  ) {
    throw new ItineraryError("COMMENT_NOT_FOUND");
  }

  await assertCanInteractWithTrip(
    comment.item.tripId,
    userId,
    shareToken,
  );

  const isAuthor = comment.userId === userId;
  const isTripOwner =
    comment.item.trip.ownerId === userId;

  if (!isAuthor && !isTripOwner) {
    throw new ItineraryError("FORBIDDEN");
  }

  return deleteItineraryCommentRepo(commentId);
}