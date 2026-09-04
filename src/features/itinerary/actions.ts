"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  createItineraryItem,
  deleteItineraryItem,
  updateItineraryItem,
} from "@/server/services/itinerary.service";

export type ItineraryErrorCode =
  | "TITLE_REQUIRED"
  | "DAY_INVALID"
  | "DATETIME_INVALID"
  | "END_BEFORE_START"
  | "CREATE_FAILED"
  | "UPDATE_FAILED"
  | "DELETE_FAILED";

export interface ItineraryFormState {
  error?: ItineraryErrorCode;
}

const itinerarySchema = z.object({
  title: z.string().trim().min(1),
  day: z.coerce.number().int().min(1).max(365),
  sortOrder: z.coerce.number().int().min(0),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().trim().optional(),
  placeId: z.string().trim().optional(),
  locationTagId: z.string().trim().optional(),
});

function parseOptionalDateTime(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseFormData(formData: FormData) {
  return itinerarySchema.safeParse({
    title: formData.get("title"),
    day: formData.get("day"),
    sortOrder: formData.get("sortOrder") ?? 0,
    startTime: formData.get("startTime")?.toString() || undefined,
    endTime: formData.get("endTime")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    placeId: formData.get("placeId")?.toString() || undefined,
    locationTagId: formData.get("locationTagId")?.toString() || undefined,
  });
}

function getValidationError(
  field: PropertyKey | undefined,
  fallback: "CREATE_FAILED" | "UPDATE_FAILED",
): ItineraryFormState {
  if (field === "title") return { error: "TITLE_REQUIRED" };
  if (field === "day") return { error: "DAY_INVALID" };
  return { error: fallback };
}

export async function createItineraryItemAction(
  tripId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) return redirect({ href: `/login?callbackUrl=/trips/${tripId}`, locale });

  const parsed = parseFormData(formData);
  if (!parsed.success) return getValidationError(parsed.error.issues[0]?.path[0], "CREATE_FAILED");

  const startTime = parseOptionalDateTime(parsed.data.startTime);
  const endTime = parseOptionalDateTime(parsed.data.endTime);

  if (startTime === undefined || endTime === undefined) return { error: "DATETIME_INVALID" };
  if (startTime && endTime && endTime < startTime) return { error: "END_BEFORE_START" };

  try {
    await createItineraryItem(session.userId, {
      tripId,
      title: parsed.data.title,
      day: parsed.data.day,
      startTime,
      endTime,
      sortOrder: parsed.data.sortOrder,
      placeId: parsed.data.placeId || null,
      locationTagId: parsed.data.locationTagId || null,
      notes: parsed.data.notes || null,
    });
  } catch {
    return { error: "CREATE_FAILED" };
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function updateItineraryItemAction(
  itemId: string,
  tripId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) return redirect({ href: `/login?callbackUrl=/trips/${tripId}`, locale });

  const parsed = parseFormData(formData);
  if (!parsed.success) return getValidationError(parsed.error.issues[0]?.path[0], "UPDATE_FAILED");

  const startTime = parseOptionalDateTime(parsed.data.startTime);
  const endTime = parseOptionalDateTime(parsed.data.endTime);

  if (startTime === undefined || endTime === undefined) return { error: "DATETIME_INVALID" };
  if (startTime && endTime && endTime < startTime) return { error: "END_BEFORE_START" };

  try {
    await updateItineraryItem(itemId, session.userId, {
      title: parsed.data.title,
      day: parsed.data.day,
      startTime,
      endTime,
      sortOrder: parsed.data.sortOrder,
      placeId: parsed.data.placeId || null,
      locationTagId: parsed.data.locationTagId || null,
      notes: parsed.data.notes || null,
    });
  } catch {
    return { error: "UPDATE_FAILED" };
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function deleteItineraryItemAction(itemId: string, tripId: string) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) return redirect({ href: `/login?callbackUrl=/trips/${tripId}`, locale });

  try {
    await deleteItineraryItem(itemId, session.userId);
  } catch {
    return;
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}