"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addItineraryComment, addItineraryItem, editItineraryItem, ItineraryError,
  removeItineraryComment, removeItineraryItem, reorderItineraryItems, voteItineraryItem,
} from "@/server/services/itinerary.service";

export interface ItineraryFormState { error?: string }
export interface ReorderItineraryState { success?: boolean; error?: "INVALID_ORDER" | "REORDER_FAILED" }
export interface ItineraryVoteActionState { success?: boolean; error?: "LOGIN_REQUIRED" | "INVALID_VOTE" | "VOTE_FAILED" }
export interface ItineraryCommentActionState {
  success?: boolean;
  error?: "LOGIN_REQUIRED" | "COMMENT_REQUIRED" | "COMMENT_TOO_LONG" | "COMMENT_FAILED" | "DELETE_FAILED";
}

const reorderSchema = z.array(z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  sortOrder: z.number().int().min(0),
}));

const itemSchema = z.object({
  day: z.coerce.number().int().min(1),
  title: z.string().trim().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  notes: z.string().trim().optional(),
  locationTagId: z.string().optional(),
});

/**
 * Date 1970 ở đây chỉ là carrier tạm cho HH:mm.
 * itinerary.service.ts sẽ chuyển nó thành timestamp thật:
 * Trip.startDate + (day - 1) + HH:mm.
 */
function parseTimeInput(value: string | undefined): Date | null | undefined {
  if (!value) return null;

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;

  const date = new Date(Date.UTC(1970, 0, 1, hour, minute));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function normalizeLocationTagId(value: string | undefined): string | null {
  return !value || value === "none" ? null : value;
}

function validateTimeRange(startTime: Date | null, endTime: Date | null): boolean {
  if (!startTime || !endTime) return true;
  return endTime.getTime() > startTime.getTime();
}

function readItemForm(formData: FormData) {
  return itemSchema.safeParse({
    day: formData.get("day"),
    title: formData.get("title")?.toString() || undefined,
    startTime: formData.get("startTime")?.toString() || undefined,
    endTime: formData.get("endTime")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    locationTagId: formData.get("locationTagId")?.toString() || undefined,
  });
}

async function itineraryServiceError(error: unknown, fallback: "addFailed" | "updateFailed") {
  const t = await getTranslations("itinerary.errors");

  if (!(error instanceof ItineraryError)) return t(fallback);

  switch (error.message) {
    case "TRIP_START_DATE_REQUIRED": return t("tripStartDateRequired");
    case "DAY_OUT_OF_RANGE": return t("dayInvalid");
    case "END_BEFORE_START": return t("endBeforeStart");
    case "DATETIME_INVALID": return t("timeInvalid");
    case "FORBIDDEN": return t("forbidden");
    default: return t(fallback);
  }
}

export async function addItineraryItemAction(
  tripId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session = await getSession();
  const t = await getTranslations("itinerary.errors");

  if (!session) return { error: t("loginRequired") };

  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: t("dayInvalid") };

  const startTime = parseTimeInput(parsed.data.startTime);
  const endTime = parseTimeInput(parsed.data.endTime);

  if (startTime === undefined || endTime === undefined) return { error: t("timeInvalid") };
  if (!validateTimeRange(startTime, endTime)) return { error: t("endBeforeStart") };

  try {
    await addItineraryItem(tripId, session.userId, {
      day: parsed.data.day,
      title: parsed.data.title?.trim() ?? "",
      startTime,
      endTime,
      notes: parsed.data.notes?.trim() || null,
      locationTagId: normalizeLocationTagId(parsed.data.locationTagId),
    });
  } catch (error) {
    return { error: await itineraryServiceError(error, "addFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#itinerary`, locale });
}

export async function updateItineraryItemAction(
  tripId: string,
  itemId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session = await getSession();
  const t = await getTranslations("itinerary.errors");

  if (!session) return { error: t("loginRequired") };

  const parsed = readItemForm(formData);
  if (!parsed.success) return { error: t("dayInvalid") };

  const startTime = parseTimeInput(parsed.data.startTime);
  const endTime = parseTimeInput(parsed.data.endTime);

  if (startTime === undefined || endTime === undefined) return { error: t("timeInvalid") };
  if (!validateTimeRange(startTime, endTime)) return { error: t("endBeforeStart") };

  try {
    await editItineraryItem(itemId, session.userId, {
      day: parsed.data.day,
      title: parsed.data.title?.trim() ?? "",
      startTime,
      endTime,
      notes: parsed.data.notes?.trim() || null,
      locationTagId: normalizeLocationTagId(parsed.data.locationTagId),
    });
  } catch (error) {
    return { error: await itineraryServiceError(error, "updateFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}#itinerary`, locale });
}

export async function removeItineraryItemAction(
  tripId: string,
  itemId: string,
  _formData: FormData,
) {
  void _formData;

  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  if (session) {
    try {
      await removeItineraryItem(itemId, session.userId);
    } catch {
      // Giữ best-effort để nút xoá không làm vỡ trang.
    }
  }

  return redirect({ href: `/trips/${tripId}#itinerary`, locale });
}

export async function reorderItineraryAction(
  tripId: string,
  items: { id: string; day: number; sortOrder: number }[],
): Promise<ReorderItineraryState> {
  const session = await getSession();
  if (!session) return { error: "REORDER_FAILED" };

  const parsed = reorderSchema.safeParse(items);
  if (!parsed.success) return { error: "INVALID_ORDER" };

  try {
    await reorderItineraryItems(tripId, session.userId, parsed.data);
    return { success: true };
  } catch (error) {
    if (error instanceof ItineraryError && (error.message === "INVALID_ORDER" || error.message === "DAY_OUT_OF_RANGE")) {
      return { error: "INVALID_ORDER" };
    }

    return { error: "REORDER_FAILED" };
  }
}

export async function voteItineraryItemAction(
  itemId: string,
  voteType: "UP" | "DOWN",
): Promise<ItineraryVoteActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = z.enum(["UP", "DOWN"]).safeParse(voteType);
  if (!parsed.success || !itemId) return { error: "INVALID_VOTE" };

  try {
    await voteItineraryItem(itemId, session.userId, parsed.data);
    return { success: true };
  } catch {
    return { error: "VOTE_FAILED" };
  }
}

export async function addItineraryCommentAction(
  itemId: string,
  content: string,
): Promise<ItineraryCommentActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = z.string().trim().min(1).max(1000).safeParse(content);

  if (!parsed.success) {
    const tooLong = typeof content === "string" && content.trim().length > 1000;
    return { error: tooLong ? "COMMENT_TOO_LONG" : "COMMENT_REQUIRED" };
  }

  try {
    await addItineraryComment(itemId, session.userId, parsed.data);
    return { success: true };
  } catch (error) {
    if (error instanceof ItineraryError) {
      if (error.message === "COMMENT_REQUIRED") return { error: "COMMENT_REQUIRED" };
      if (error.message === "COMMENT_TOO_LONG") return { error: "COMMENT_TOO_LONG" };
    }

    return { error: "COMMENT_FAILED" };
  }
}

export async function removeItineraryCommentAction(
  commentId: string,
): Promise<ItineraryCommentActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };
  if (!commentId) return { error: "DELETE_FAILED" };

  try {
    await removeItineraryComment(commentId, session.userId);
    return { success: true };
  } catch {
    return { error: "DELETE_FAILED" };
  }
}