"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  BUDGET_LEVELS,
  TRAVEL_STYLES,
  toTravelInterests,
} from "@/features/profile/preferences";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  ProfileError,
  updateProfile,
} from "@/server/services/creator-profile.service";
import { AvatarError } from "@/server/storage/avatar";

export interface EditProfileFormState {
  error?: string;
}

type AvatarErrorKey =
  "avatarEmptyFile" | "avatarTooLarge" | "avatarUnsupportedType";

const AVATAR_ERROR_KEY: Record<string, AvatarErrorKey> = {
  EMPTY_FILE: "avatarEmptyFile",
  TOO_LARGE: "avatarTooLarge",
  UNSUPPORTED_TYPE: "avatarUnsupportedType",
};

export async function updateProfileAction(
  creatorId: string,
  _prevState: EditProfileFormState,
  formData: FormData,
): Promise<EditProfileFormState> {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({ href: "/login", locale });
  }
  // Render-time gating (only showing this form to the owner) isn't a
  // security boundary — a POST can be sent directly, so check again here.
  if (session.userId !== creatorId) {
    return redirect({ href: `/creators/${creatorId}`, locale });
  }

  const t = await getTranslations("creatorProfile.errors");
  const schema = z.object({
    name: z.string().trim().min(1, t("nameRequired")),
    bio: z.string().trim().max(280, t("bioTooLong")).optional(),
    travelStyle: z.enum(TRAVEL_STYLES).optional(),
    budgetLevel: z.enum(BUDGET_LEVELS).optional(),
  });

  const rawTravelStyle = formData.get("travelStyle");
  const rawBudgetLevel = formData.get("budgetLevel");
  const parsed = schema.safeParse({
    name: formData.get("name"),
    bio: formData.get("bio")?.toString() || undefined,
    travelStyle:
      rawTravelStyle === "none" ? undefined : rawTravelStyle || undefined,
    budgetLevel:
      rawBudgetLevel === "none" ? undefined : rawBudgetLevel || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const travelInterests = toTravelInterests(
    formData.getAll("travelInterests").map(String),
  );

  const avatarEntry = formData.get("avatar");
  const avatarFile =
    avatarEntry instanceof File && avatarEntry.size > 0 ? avatarEntry : null;

  try {
    await updateProfile(creatorId, session.userId, {
      name: parsed.data.name,
      bio: parsed.data.bio ?? null,
      travelStyle: parsed.data.travelStyle ?? null,
      budgetLevel: parsed.data.budgetLevel ?? null,
      travelInterests,
      avatarFile,
    });
  } catch (error) {
    if (error instanceof AvatarError) {
      const key = AVATAR_ERROR_KEY[error.message];
      return { error: t(key ?? "updateFailed") };
    }
    if (error instanceof ProfileError) {
      return { error: t("updateFailed") };
    }
    throw error;
  }

  return redirect({ href: `/creators/${creatorId}`, locale });
}
