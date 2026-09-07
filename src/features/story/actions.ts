"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { STORY_THEMES } from "@/features/story/themes";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addStorySlide,
  removeStorySlide,
} from "@/server/services/story.service";
import { StoryPhotoError } from "@/server/storage/story-photo";

export interface StorySlideFormState {
  error?: string;
}

type PhotoErrorKey = "photoTooLarge" | "photoUnsupportedType" | "photoEmpty";

const PHOTO_ERROR_KEY: Record<string, PhotoErrorKey> = {
  EMPTY_FILE: "photoEmpty",
  TOO_LARGE: "photoTooLarge",
  UNSUPPORTED_TYPE: "photoUnsupportedType",
};

export async function addStorySlideAction(
  tripId: string,
  _prevState: StorySlideFormState,
  formData: FormData,
): Promise<StorySlideFormState> {
  const session = await getSession();
  const t = await getTranslations("story.errors");
  if (!session) {
    return { error: t("loginRequired") };
  }

  const schema = z.object({
    day: z.string().optional(),
    caption: z
      .string()
      .trim()
      .min(1, t("captionRequired"))
      .max(220, t("captionTooLong")),
    theme: z.enum(STORY_THEMES),
  });

  const rawDay = formData.get("day")?.toString();
  const parsed = schema.safeParse({
    day: rawDay === "cover" ? undefined : rawDay,
    caption: formData.get("caption"),
    theme: formData.get("theme"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const day = parsed.data.day ? Number(parsed.data.day) : null;
  if (day != null && (!Number.isInteger(day) || day < 1)) {
    return { error: t("dayInvalid") };
  }

  const photoEntry = formData.get("photo");
  const photoFile =
    photoEntry instanceof File && photoEntry.size > 0 ? photoEntry : null;

  try {
    await addStorySlide(tripId, session.userId, {
      day,
      caption: parsed.data.caption,
      theme: parsed.data.theme,
      photoFile,
    });
  } catch (error) {
    if (error instanceof StoryPhotoError) {
      const key = PHOTO_ERROR_KEY[error.message];
      return { error: t(key ?? "addFailed") };
    }
    return { error: t("addFailed") };
  }

  const locale = await getLocale();
  return redirect({ href: `/trips/${tripId}`, locale });
}

export async function removeStorySlideAction(
  tripId: string,
  slideId: string,
  _formData: FormData,
) {
  // Signature required by <form action={...}>; this action has no fields.
  void _formData;
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (session) {
    try {
      await removeStorySlide(slideId, session.userId);
    } catch {
      // best-effort, see trip/actions.ts's addTravelerAction
    }
  }

  return redirect({ href: `/trips/${tripId}`, locale });
}
