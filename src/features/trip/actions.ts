"use server";

import { PlanStatus, PlanVisibility, TravelPace } from "@prisma/client";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { createTrip, deleteTrip, updateTrip } from "@/server/services/trip.service";

export interface TripFormState {
  error?: string;
}

const travelStyleSchema = z.enum(["FOOD", "SHOPPING", "CULTURE", "NATURE"]);

function parseDateInput(value: string | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formValueToOptionalNumber(value: FormDataEntryValue | null) {
  if (value === null) return undefined;

  const text = value.toString().trim();
  return text || undefined;
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
    travelerCount: z.coerce.number().int().min(1).max(50),
    budgetTarget: z.preprocess(
      (value) =>
        value === undefined || value === null || value === ""
          ? undefined
          : value,
      z.coerce.number().min(0).optional(),
    ),
    travelStyle: z.array(travelStyleSchema).default([]),
    pace: z.enum(TravelPace),
    visibility: z.enum(PlanVisibility),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination"),
    startDate: formData.get("startDate")?.toString() || undefined,
    endDate: formData.get("endDate")?.toString() || undefined,
    travelerCount: formData.get("travelerCount"),
    budgetTarget: formValueToOptionalNumber(formData.get("budgetTarget")),
    travelStyle: formData.getAll("travelStyle").map((value) => value.toString()),
    pace: formData.get("pace"),
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

  let trip: Awaited<ReturnType<typeof createTrip>>;

  try {
    trip = await createTrip(session.userId, {
      name: parsed.data.name,
      destination: parsed.data.destination,
      startDate,
      endDate,
      travelerCount: parsed.data.travelerCount,
      budgetTarget: parsed.data.budgetTarget ?? null,
      travelStyle: parsed.data.travelStyle,
      pace: parsed.data.pace,
      visibility: parsed.data.visibility,
    });
  } catch {
    return { error: t("createFailed") };
  }

  return redirect({
    href: `/trips/${trip.id}`,
    locale,
  });
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
    travelerCount: z.coerce.number().int().min(1).max(50),
    budgetTarget: z.preprocess(
      (value) =>
        value === undefined || value === null || value === ""
          ? undefined
          : value,
      z.coerce.number().min(0).optional(),
    ),
    travelStyle: z.array(travelStyleSchema).default([]),
    pace: z.enum(TravelPace),
    visibility: z.enum(PlanVisibility),
    status: z.enum(PlanStatus),
  });

  const parsed = schema.safeParse({
    name: formData.get("name"),
    destination: formData.get("destination"),
    startDate: formData.get("startDate")?.toString() || undefined,
    endDate: formData.get("endDate")?.toString() || undefined,
    travelerCount: formData.get("travelerCount"),
    budgetTarget: formValueToOptionalNumber(formData.get("budgetTarget")),
    travelStyle: formData.getAll("travelStyle").map((value) => value.toString()),
    pace: formData.get("pace"),
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
      travelerCount: parsed.data.travelerCount,
      budgetTarget: parsed.data.budgetTarget ?? null,
      travelStyle: parsed.data.travelStyle,
      pace: parsed.data.pace,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
    });
  } catch {
    return { error: t("updateFailed") };
  }

  return redirect({
    href: `/trips/${tripId}`,
    locale,
  });
}

export async function deleteTripAction(tripId: string) {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  await deleteTrip(tripId, session.userId);

  return redirect({
    href: "/trips",
    locale,
  });
}