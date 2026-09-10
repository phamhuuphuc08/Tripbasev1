"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addItineraryItem,
  editItineraryItem,
  removeItineraryItem,
  reorderItineraryItems,
} from "@/server/services/itinerary.service";

export interface ItineraryFormState {
  error?: string;
}

export interface ReorderItineraryState {
  success?: boolean;
  error?: "INVALID_ORDER" | "REORDER_FAILED";
}

const reorderSchema = z.array(z.object({
  id: z.string().min(1),
  day: z.number().int().min(1),
  sortOrder: z.number().int().min(0),
}));

/**
 * Hiện ItineraryItem chưa lưu ngày giờ tuyệt đối.
 * day là số ngày tương đối của chuyến đi, còn startTime/endTime
 * chỉ lưu giờ trong ngày và được neo vào 1970-01-01.
 *
 * Sau này khi M02 chuyển sang timestamp thật theo Trip.startDate
 * thì phần này có thể thay đổi.
 */
function parseTimeInput(value: string | undefined): Date | null {
  if (!value) return null;

  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const date = new Date(Date.UTC(1970, 0, 1, hour, minute));

  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeLocationTagId(value: string | undefined): string | null {
  if (!value || value === "none") {
    return null;
  }

  return value;
}

function validateTimeRange(
  startTime: Date | null,
  endTime: Date | null,
): boolean {
  if (!startTime || !endTime) {
    return true;
  }

  // Hiện tại chưa hỗ trợ hoạt động qua ngày hôm sau.
  // Vì vậy:
  // 08:00 -> 10:00 = hợp lệ
  // 08:00 -> 08:00 = không hợp lệ
  // 23:00 -> 02:00 = không hợp lệ
  return endTime.getTime() > startTime.getTime();
}

export async function addItineraryItemAction(
  tripId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session = await getSession();
  const t = await getTranslations("itinerary.errors");

  if (!session) {
    return { error: t("loginRequired") };
  }

  const schema = z.object({
    day: z.coerce.number().int().min(1, t("dayInvalid")),
    title: z.string().trim().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().trim().optional(),
    locationTagId: z.string().optional(),
  });

  const parsed = schema.safeParse({
    day: formData.get("day"),
    title: formData.get("title")?.toString() || undefined,
    startTime: formData.get("startTime")?.toString() || undefined,
    endTime: formData.get("endTime")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    locationTagId:
      formData.get("locationTagId")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const startTime = parseTimeInput(parsed.data.startTime);
  const endTime = parseTimeInput(parsed.data.endTime);

  if (!validateTimeRange(startTime, endTime)) {
    return { error: t("endBeforeStart") };
  }

  try {
    await addItineraryItem(tripId, session.userId, {
      day: parsed.data.day,
      title: parsed.data.title?.trim() ?? "",
      startTime,
      endTime,
      notes: parsed.data.notes?.trim() || null,
      locationTagId: normalizeLocationTagId(
        parsed.data.locationTagId,
      ),
    });
  } catch {
    return { error: t("addFailed") };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}`,
    locale,
  });
}

export async function updateItineraryItemAction(
  tripId: string,
  itemId: string,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session = await getSession();
  const t = await getTranslations("itinerary.errors");

  if (!session) {
    return { error: t("loginRequired") };
  }

  const schema = z.object({
    day: z.coerce.number().int().min(1, t("dayInvalid")),
    title: z.string().trim().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().trim().optional(),
    locationTagId: z.string().optional(),
  });

  const parsed = schema.safeParse({
    day: formData.get("day"),
    title: formData.get("title")?.toString() || undefined,
    startTime: formData.get("startTime")?.toString() || undefined,
    endTime: formData.get("endTime")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    locationTagId:
      formData.get("locationTagId")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const startTime = parseTimeInput(parsed.data.startTime);
  const endTime = parseTimeInput(parsed.data.endTime);

  if (!validateTimeRange(startTime, endTime)) {
    return { error: t("endBeforeStart") };
  }

  try {
    await editItineraryItem(itemId, session.userId, {
      day: parsed.data.day,
      title: parsed.data.title?.trim() ?? "",
      startTime,
      endTime,
      notes: parsed.data.notes?.trim() || null,
      locationTagId: normalizeLocationTagId(
        parsed.data.locationTagId,
      ),
    });
  } catch {
    // Tạm dùng addFailed để không phải thêm translation key mới.
    // Có thể đổi thành updateFailed sau khi thêm key vào vi.json/en.json.
    return { error: t("addFailed") };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}`,
    locale,
  });
}

export async function removeItineraryItemAction(
  tripId: string,
  itemId: string,
  _formData: FormData,
) {
  // Signature required by <form action={...}>; action xoá không có field.
  void _formData;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  if (session) {
    try {
      await removeItineraryItem(itemId, session.userId);
    } catch {
      // Best-effort giống pattern hiện tại của project.
    }
  }

  return redirect({
    href: `/trips/${tripId}`,
    locale,
  });
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
    if (error instanceof Error && error.message === "INVALID_ORDER") return { error: "INVALID_ORDER" };
    return { error: "REORDER_FAILED" };
  }
}