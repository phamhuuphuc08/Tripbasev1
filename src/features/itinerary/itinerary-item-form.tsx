"use client";

import { useActionState } from "react";
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
import { addItineraryItemAction } from "@/features/itinerary/actions";
import type { TagCategory } from "@/features/tag-tip/categories";

const initialState = { error: undefined } as { error?: string };

export interface TagOption {
  id: string;
  title: string;
  category: TagCategory;
}

export function ItineraryItemForm({
  tripId,
  dayCount,
  tagOptions,
}: {
  tripId: string;
  dayCount: number;
  tagOptions: TagOption[];
}) {
  const t = useTranslations("itinerary.form");
  const tCategory = useTranslations("tagCategory");
  const action = addItineraryItemAction.bind(null, tripId);
  const [state, formAction, pending] = useActionState(action, initialState);

  const dayChoices = Array.from(
    { length: Math.max(dayCount, 1) + 1 },
    (_, i) => i + 1,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-title">{t("titleLabel")}</Label>
        <Input
          id="item-title"
          name="title"
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-day">{t("dayLabel")}</Label>
          <Select name="day" defaultValue={String(dayChoices[0])}>
            <SelectTrigger id="item-day" className="w-full">
              <SelectValue>{(value: string | null) => value}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {dayChoices.map((day) => (
                <SelectItem key={day} value={String(day)}>
                  {t("dayOption", { day })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-start">{t("startTimeLabel")}</Label>
          <Input id="item-start" name="startTime" type="time" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="item-end">{t("endTimeLabel")}</Label>
          <Input id="item-end" name="endTime" type="time" />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-tag">{t("tagLabel")}</Label>
        <Select name="locationTagId" defaultValue="none">
          <SelectTrigger id="item-tag" className="w-full">
            <SelectValue>
              {(value: string | null) => {
                if (!value || value === "none") return t("noTagOption");
                const option = tagOptions.find((tag) => tag.id === value);
                return option
                  ? `${tCategory(option.category)} ${option.title}`
                  : t("noTagOption");
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("noTagOption")}</SelectItem>
            {tagOptions.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tCategory(tag.category)} {tag.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="item-notes">{t("notesLabel")}</Label>
        <Input
          id="item-notes"
          name="notes"
          placeholder={t("notesPlaceholder")}
        />
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
