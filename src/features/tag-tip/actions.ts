"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { TAG_CATEGORIES, type TagCategory } from "@/features/tag-tip/categories";
import { getSession } from "@/server/auth/session";
import { createTagWithDedupCheck } from "@/server/services/location-tag.service";

export interface CreateTagFormState {
  attempt: number;
  error?: string;
  duplicate?: { id: string; title: string };
  createdTitle?: string;
  submitted?: {
    title: string;
    category: TagCategory;
    content: string;
    latitude: string;
    longitude: string;
    openingTime: string;
    closingTime: string;
  };
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function parseCoordinate(value: string, min: number, max: number): number | null | undefined {
  const normalized = value.trim();
  if (!normalized) return null;

  const number = Number(normalized);
  if (!Number.isFinite(number) || number < min || number > max) return undefined;

  return number;
}

export async function createTagAction(
  prevState: CreateTagFormState,
  formData: FormData,
): Promise<CreateTagFormState> {
  const attempt = prevState.attempt + 1;
  const session = await getSession();
  const t = await getTranslations("tagTip.errors");

  if (!session) return { attempt, error: t("loginRequired") };

  const rawTitle = formData.get("title")?.toString() ?? "";
  const rawCategory = formData.get("category")?.toString() ?? "";
  const rawContent = formData.get("content")?.toString() ?? "";
  const rawLatitude = formData.get("latitude")?.toString() ?? "";
  const rawLongitude = formData.get("longitude")?.toString() ?? "";
  const rawOpeningTime = formData.get("openingTime")?.toString() ?? "";
  const rawClosingTime = formData.get("closingTime")?.toString() ?? "";

  const submitted: CreateTagFormState["submitted"] = {
    title: rawTitle,
    category: (TAG_CATEGORIES as readonly string[]).includes(rawCategory)
      ? rawCategory as TagCategory
      : "RESTAURANT",
    content: rawContent,
    latitude: rawLatitude,
    longitude: rawLongitude,
    openingTime: rawOpeningTime,
    closingTime: rawClosingTime,
  };

  const schema = z.object({
    title: z.string().trim().min(1, t("titleRequired")),
    category: z.enum(TAG_CATEGORIES),
    content: z.string().trim().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    openingTime: z.string().optional(),
    closingTime: z.string().optional(),
  });

  const parsed = schema.safeParse({
    title: rawTitle,
    category: rawCategory,
    content: rawContent || undefined,
    latitude: rawLatitude || undefined,
    longitude: rawLongitude || undefined,
    openingTime: rawOpeningTime || undefined,
    closingTime: rawClosingTime || undefined,
  });

  if (!parsed.success) {
    return { attempt, submitted, error: parsed.error.issues[0]?.message ?? t("invalidInput") };
  }

  const latitude = parseCoordinate(rawLatitude, -90, 90);
  const longitude = parseCoordinate(rawLongitude, -180, 180);

  if (latitude === undefined || longitude === undefined) {
    return { attempt, submitted, error: t("coordinatesInvalid") };
  }

  const hasOpening = Boolean(rawOpeningTime);
  const hasClosing = Boolean(rawClosingTime);

  if (hasOpening !== hasClosing) {
    return { attempt, submitted, error: t("openingHoursPairRequired") };
  }

  if ((hasOpening && !isValidTime(rawOpeningTime)) || (hasClosing && !isValidTime(rawClosingTime))) {
    return { attempt, submitted, error: t("openingHoursInvalid") };
  }

  const openingHours = hasOpening && hasClosing ? `${rawOpeningTime}-${rawClosingTime}` : null;
  const force = formData.get("force") === "true";

  try {
    const result = await createTagWithDedupCheck(
      session.userId,
      {
        title: parsed.data.title,
        category: parsed.data.category,
        content: parsed.data.content?.trim() || null,
        latitude,
        longitude,
        openingHours,
      },
      force,
    );

    if (result.status === "duplicate") {
      return { attempt, submitted, duplicate: result.suggestion };
    }

    return { attempt, createdTitle: result.tag.title };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "OPENING_HOURS_INVALID") return { attempt, submitted, error: t("openingHoursInvalid") };
      if (error.message === "TITLE_REQUIRED") return { attempt, submitted, error: t("titleRequired") };
      if (error.message === "TAG_DAILY_LIMIT_REACHED") return { attempt, submitted, error: t("dailyLimitReached") };
      if (error.message === "TAG_CREATE_SUSPENDED") return { attempt, submitted, error: t("createSuspended") };
      if (error.message === "ACCOUNT_SUSPENDED") return { attempt, submitted, error: t("accountSuspended") };
      if (error.message === "ACCOUNT_UNAVAILABLE") return { attempt, submitted, error: t("accountUnavailable") };
    }

    return { attempt, submitted, error: t("createFailed") };
  }
}