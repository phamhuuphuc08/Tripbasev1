"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  STORY_THEMES,
  STORY_THEME_SWATCH,
  type StoryTheme,
} from "@/features/story/themes";
import {
  addStorySlideAction,
  type StorySlideFormState,
} from "@/features/story/actions";

const initialState: StorySlideFormState = {};

export function StorySlideForm({
  tripId,
  dayCount,
}: {
  tripId: string;
  dayCount: number;
}) {
  const t = useTranslations("story.form");
  const action = addStorySlideAction.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [theme, setTheme] = useState<StoryTheme>("SUNSET");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const dayChoices = Array.from(
    { length: Math.max(dayCount, 1) },
    (_, i) => i + 1,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slide-day">{t("dayLabel")}</Label>
        <Select name="day" defaultValue="cover">
          <SelectTrigger id="slide-day" className="w-full">
            <SelectValue>
              {(value: string | null) =>
                !value || value === "cover"
                  ? t("coverOption")
                  : t("dayOption", { day: value })
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cover">{t("coverOption")}</SelectItem>
            {dayChoices.map((day) => (
              <SelectItem key={day} value={String(day)}>
                {t("dayOption", { day })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slide-caption">{t("captionLabel")}</Label>
        <Textarea
          id="slide-caption"
          name="caption"
          required
          maxLength={220}
          placeholder={t("captionPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("themeLabel")}</Label>
        <input type="hidden" name="theme" value={theme} />
        <div className="flex gap-2">
          {STORY_THEMES.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={option}
              onClick={() => setTheme(option)}
              className={`size-8 rounded-full ${STORY_THEME_SWATCH[option]} ${
                theme === option
                  ? "ring-foreground ring-2 ring-offset-2 ring-offset-transparent"
                  : ""
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slide-photo">{t("photoLabel")}</Label>
        <div className="flex items-center gap-3">
          {photoPreview && (
            // Local upload preview, not an optimizable asset.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt=""
              className="size-14 shrink-0 rounded-lg object-cover"
            />
          )}
          <Input
            id="slide-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0];
              setPhotoPreview(file ? URL.createObjectURL(file) : null);
            }}
          />
        </div>
        <p className="text-muted-foreground text-xs">{t("photoHint")}</p>
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? t("submitPending") : t("submit")}
      </Button>
    </form>
  );
}
