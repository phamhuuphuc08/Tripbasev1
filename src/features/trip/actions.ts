"use server";

import { PlanStatus, PlanVisibility } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { createTrip, updateTrip } from "@/server/services/trip.service";

export interface TripFormState {
  error?: string;
}

function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createTripAction(
  _prevState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("trip.errors");
  const schema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    destination: z.string().trim().min(1, t("destinationRequired")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    visibility: z.enum(PlanVisibility),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination"),
    startDate: formData.get("startDate")?.toString() || undefined,
    endDate: formData.get("endDate")?.toString() || undefined,
    visibility: formData.get("visibility"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const startDate = parseDateInput(parsed.data.startDate);
  const endDate = parseDateInput(parsed.data.endDate);
  if (startDate && endDate && endDate < startDate) {
    return { error: t("endBeforeStart") };
  }

  const trip = await createTrip(session.userId, {
    name: parsed.data.name,
    destination: parsed.data.destination,
    startDate,
    endDate,
    visibility: parsed.data.visibility,
  });

  return redirect({ href: `/trips/${trip.id}`, locale });
}

export async function updateTripAction(
  tripId: string,
  _prevState: TripFormState,
  formData: FormData,
): Promise<TripFormState> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({ href: "/login", locale });
  }

  const t = await getTranslations("trip.errors");
  const schema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    destination: z.string().trim().min(1, t("destinationRequired")),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    visibility: z.enum(PlanVisibility),
    status: z.enum(PlanStatus),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination"),
    startDate: formData.get("startDate")?.toString() || undefined,
    endDate: formData.get("endDate")?.toString() || undefined,
    visibility: formData.get("visibility"),
    status: formData.get("status"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const startDate = parseDateInput(parsed.data.startDate);
  const endDate = parseDateInput(parsed.data.endDate);
  if (startDate && endDate && endDate < startDate) {
    return { error: t("endBeforeStart") };
  }

  try {
    await updateTrip(tripId, session.userId, {
      name: parsed.data.name,
      destination: parsed.data.destination,
      startDate,
      endDate,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
    });
  } catch {
    return { error: t("updateFailed") };
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}
