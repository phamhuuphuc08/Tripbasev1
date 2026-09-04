"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  BUDGET_LEVELS,
  TRAVEL_INTERESTS,
  TRAVEL_STYLES,
  type BudgetLevel,
  type TravelInterest,
  type TravelStyle,
} from "@/features/profile/preferences";
import {
  updateProfileAction,
  type EditProfileFormState,
} from "@/features/profile/actions";

const initialState: EditProfileFormState = {};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function EditProfileForm({
  creatorId,
  defaultValues,
}: {
  creatorId: string;
  defaultValues: {
    name: string;
    bio: string | null;
    image: string | null;
    travelStyle: TravelStyle | null;
    budgetLevel: BudgetLevel | null;
    travelInterests: TravelInterest[];
  };
}) {
  const t = useTranslations("creatorProfile.edit");
  const tStyle = useTranslations("travelStyle");
  const tBudget = useTranslations("budgetLevel");
  const tInterest = useTranslations("travelInterest");
  const [state, formAction, pending] = useActionState(
    updateProfileAction.bind(null, creatorId),
    initialState,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-avatar">{t("avatarLabel")}</Label>
        <div className="flex items-center gap-3">
          {avatarPreview || defaultValues.image ? (
            // Local upload preview / user-provided file, not an
            // optimizable asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview ?? defaultValues.image ?? undefined}
              alt=""
              className="size-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="bg-primary/15 text-primary flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
              {initialsOf(defaultValues.name)}
            </div>
          )}
          <Input
            id="profile-avatar"
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setAvatarPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">{t("avatarHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-name">{t("nameLabel")}</Label>
        <Input
          id="profile-name"
          name="name"
          required
          defaultValue={defaultValues.name}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="profile-bio">{t("bioLabel")}</Label>
        <Textarea
          id="profile-bio"
          name="bio"
          maxLength={280}
          placeholder={t("bioPlaceholder")}
          defaultValue={defaultValues.bio ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-travel-style">{t("travelStyleLabel")}</Label>
          <Select
            name="travelStyle"
            defaultValue={defaultValues.travelStyle ?? "none"}
          >
            <SelectTrigger id="profile-travel-style" className="w-full">
              <SelectValue>
                {(value: TravelStyle | "none" | null) =>
                  value && value !== "none"
                    ? tStyle(value)
                    : t("travelStyleNone")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("travelStyleNone")}</SelectItem>
              {TRAVEL_STYLES.map((style) => (
                <SelectItem key={style} value={style}>
                  {tStyle(style)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="profile-budget-level">{t("budgetLevelLabel")}</Label>
          <Select
            name="budgetLevel"
            defaultValue={defaultValues.budgetLevel ?? "none"}
          >
            <SelectTrigger id="profile-budget-level" className="w-full">
              <SelectValue>
                {(value: BudgetLevel | "none" | null) =>
                  value && value !== "none"
                    ? tBudget(value)
                    : t("budgetLevelNone")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("budgetLevelNone")}</SelectItem>
              {BUDGET_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {tBudget(level)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("interestsLabel")}</Label>
        <p className="text-muted-foreground -mt-1 text-xs">
          {t("interestsHint")}
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TRAVEL_INTERESTS.map((interest) => (
            <label
              key={interest}
              className="border-input has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm"
            >
              <Checkbox
                name="travelInterests"
                value={interest}
                defaultChecked={defaultValues.travelInterests.includes(
                  interest,
                )}
              />
              {tInterest(interest)}
            </label>
          ))}
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? t("submitPending") : t("submit")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => history.back()}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
}
