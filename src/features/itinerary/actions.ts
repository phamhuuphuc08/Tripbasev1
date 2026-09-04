"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addItineraryItem,
  removeItineraryItem,
} from "@/server/services/itinerary.service";

export interface ItineraryFormState {
  error?: string;
}

/**
 * Items don't have an absolute calendar date yet (Trip.startDate is
 * optional, and `day` is a relative day-of-trip number) — for this stage
 * we only store a time-of-day, anchored to a fixed reference date so it's
 * still a valid DateTime for the column. Revisit once trips always have a
 * real start date and this can become a true per-day timestamp.
 */
function parseTimeInput(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Date.UTC(1970, 0, 1, Number(match[1]), Number(match[2])),
  );
  return Number.isNaN(date.getTime()) ? null : date;
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
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().trim().optional(),
    locationTagId: z.string().optional(),
  });

  const parsed = schema.safeParse({
    day: formData.get("day"),
    startTime: formData.get("startTime")?.toString() || undefined,
    endTime: formData.get("endTime")?.toString() || undefined,
    notes: formData.get("notes")?.toString() || undefined,
    locationTagId: formData.get("locationTagId")?.toString() || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const startTime = parseTimeInput(parsed.data.startTime);
  const endTime = parseTimeInput(parsed.data.endTime);
  if (startTime && endTime && endTime < startTime) {
    return { error: t("endBeforeStart") };
  }

  try {
    await addItineraryItem(tripId, session.userId, {
      day: parsed.data.day,
      startTime,
      endTime,
      notes: parsed.data.notes?.trim() || null,
      locationTagId:
        parsed.data.locationTagId && parsed.data.locationTagId !== "none"
          ? parsed.data.locationTagId
          : null,
    });
  } catch {
    return { error: t("addFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function removeItineraryItemAction(
  tripId: string,
  itemId: string,
  _formData: FormData,
) {
  // Signature required by <form action={...}>; this action has no fields.
  void _formData;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (session) {
    try {
      await removeItineraryItem(itemId, session.userId);
    } catch {
      // best-effort, see trip/actions.ts's addTravelerAction
    }
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}
