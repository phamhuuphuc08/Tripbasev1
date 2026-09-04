"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  TAG_CATEGORIES,
  type TagCategory,
} from "@/features/tag-tip/categories";
import { getSession } from "@/server/auth/session";
import { createTagWithDedupCheck } from "@/server/services/location-tag.service";

export interface CreateTagFormState {
  // React resets uncontrolled form fields after a Server Action runs
  // (https://react.dev/reference/react-dom/components/form#handling-form-submission-errors)
  // — bumping this on every return and keying the <form> on it forces a
  // remount, so we can re-seed the fields from `submitted` below instead
  // of silently losing what the user typed (this bit us on the duplicate
  // path: the title box would go blank right when the user most needs to
  // see what they typed).
  attempt: number;
  error?: string;
  duplicate?: { id: string; title: string };
  createdTitle?: string;
  submitted?: { title: string; category: TagCategory; content: string };
}

export async function createTagAction(
  prevState: CreateTagFormState,
  formData: FormData,
): Promise<CreateTagFormState> {
  const attempt = prevState.attempt + 1;
  const session = await getSession();
  const t = await getTranslations("tagTip.errors");
  if (!session) {
    return { attempt, error: t("loginRequired") };
  }

  const schema = z.object({
    title: z.string().trim().min(1, t("titleRequired")),
    category: z.enum(TAG_CATEGORIES),
    content: z.string().trim().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  });

  const rawTitle = formData.get("title")?.toString() ?? "";
  const rawCategory = formData.get("category");
  const rawContent = formData.get("content")?.toString() ?? "";
  const submitted = {
    title: rawTitle,
    category: (TAG_CATEGORIES as readonly string[]).includes(
      rawCategory as string,
    )
      ? (rawCategory as TagCategory)
      : "RESTAURANT",
    content: rawContent,
  } as const;

  const parsed = schema.safeParse({
    title: rawTitle,
    category: rawCategory,
    content: rawContent || undefined,
    latitude: formData.get("latitude")?.toString() || undefined,
    longitude: formData.get("longitude")?.toString() || undefined,
  });
  if (!parsed.success) {
    return {
      attempt,
      submitted,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  // Set by whichever submit button was clicked — see create-tag-form.tsx.
  const force = formData.get("force") === "true";

  const latitude = parsed.data.latitude ? Number(parsed.data.latitude) : null;
  const longitude = parsed.data.longitude
    ? Number(parsed.data.longitude)
    : null;

  const result = await createTagWithDedupCheck(
    session.userId,
    {
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content?.trim() || null,
      latitude: latitude != null && !Number.isNaN(latitude) ? latitude : null,
      longitude:
        longitude != null && !Number.isNaN(longitude) ? longitude : null,
    },
    force,
  );

  if (result.status === "duplicate") {
    return { attempt, submitted, duplicate: result.suggestion };
  }

  return { attempt, createdTitle: result.tag.title };
}
