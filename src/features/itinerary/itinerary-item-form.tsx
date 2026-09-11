"use client";

import { useActionState, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addItineraryItemAction, updateItineraryItemAction, type ItineraryFormState } from "@/features/itinerary/actions";
import type { TagCategory } from "@/features/tag-tip/categories";
import { findBestPossibleDuplicate, normalizeDedupText } from "@/server/services/tag-dedup.service";

const initialState: ItineraryFormState = {};

export interface TagOption {
  id: string;
  title: string;
  category: TagCategory;
}

export interface EditableItineraryItem {
  id: string;
  day: number;
  title?: string | null;
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  notes?: string | null;
  locationTagId?: string | null;
}

function formatTimeInput(value: string | Date | null | undefined): string {
  if (!value) return "";
  if (typeof value === "string" && /^\d{2}:\d{2}$/.test(value)) return value;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hour}:${minute}`;
}

export function ItineraryItemForm({
  tripId, dayCount, tagOptions, editingItem,
}: {
  tripId: string;
  dayCount: number;
  tagOptions: TagOption[];
  editingItem?: EditableItineraryItem;
}) {
  const t = useTranslations("itinerary.form");
  const tCategory = useTranslations("tagCategory");
  const isEditing = Boolean(editingItem?.id);

  const addAction = addItineraryItemAction.bind(null, tripId);
  const updateAction = editingItem ? updateItineraryItemAction.bind(null, tripId, editingItem.id) : null;
  const [state, formAction, pending] = useActionState(updateAction ?? addAction, initialState);

  const maxDay = Math.max(dayCount, editingItem?.day ?? 1, 1);
  const dayChoices = Array.from({ length: maxDay }, (_, index) => index + 1);
  const defaultDay = String(editingItem?.day ?? dayChoices[0] ?? 1);

  const defaultTag = editingItem?.locationTagId && tagOptions.some((tag) => tag.id === editingItem.locationTagId)
    ? editingItem.locationTagId
    : "none";

  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [tagQuery, setTagQuery] = useState("");
  const [selectedTagId, setSelectedTagId] = useState(defaultTag);

  const filteredTags = useMemo(() => {
    const query = normalizeDedupText(tagQuery);
    if (!query) return tagOptions;

    return tagOptions.filter((tag) => {
      const tagTitle = normalizeDedupText(tag.title);
      const category = normalizeDedupText(tCategory(tag.category));
      return tagTitle.includes(query) || category.includes(query);
    });
  }, [tagOptions, tagQuery, tCategory]);

  const duplicateSuggestion = useMemo(() => {
    const query = tagQuery.trim();
    if (normalizeDedupText(query).length < 3) return null;

    const candidates = tagOptions.filter((tag) => tag.id !== selectedTagId);
    const match = findBestPossibleDuplicate(candidates, query);

    return match
      ? { tag: match.candidate, score: match.score }
      : null;
  }, [tagOptions, tagQuery, selectedTagId]);

  const selectedTag = selectedTagId !== "none"
    ? tagOptions.find((tag) => tag.id === selectedTagId)
    : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`item-title-${editingItem?.id ?? "new"}`}>{t("titleLabel")}</Label>
        <Input
          id={`item-title-${editingItem?.id ?? "new"}`}
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`item-day-${editingItem?.id ?? "new"}`}>{t("dayLabel")}</Label>

          <Select name="day" defaultValue={defaultDay}>
            <SelectTrigger id={`item-day-${editingItem?.id ?? "new"}`} className="w-full">
              <SelectValue>
                {(value: string | null) => {
                  const day = Number(value);
                  return Number.isFinite(day) ? t("dayOption", { day }) : value;
                }}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {dayChoices.map((day) => (
                <SelectItem key={day} value={String(day)}>{t("dayOption", { day })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`item-start-${editingItem?.id ?? "new"}`}>{t("startTimeLabel")}</Label>
          <Input
            id={`item-start-${editingItem?.id ?? "new"}`}
            name="startTime"
            type="time"
            defaultValue={formatTimeInput(editingItem?.startTime)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`item-end-${editingItem?.id ?? "new"}`}>{t("endTimeLabel")}</Label>
          <Input
            id={`item-end-${editingItem?.id ?? "new"}`}
            name="endTime"
            type="time"
            defaultValue={formatTimeInput(editingItem?.endTime)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`item-tag-search-${editingItem?.id ?? "new"}`}>{t("tagSearchLabel")}</Label>

        <Input
          id={`item-tag-search-${editingItem?.id ?? "new"}`}
          type="search"
          value={tagQuery}
          onChange={(event) => setTagQuery(event.target.value)}
          placeholder={t("tagSearchPlaceholder")}
          autoComplete="off"
        />

        {duplicateSuggestion && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/30">
            <p className="text-amber-800 dark:text-amber-300">
              {t("duplicateSuggestion", { title: duplicateSuggestion.tag.title })}
            </p>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setSelectedTagId(duplicateSuggestion.tag.id);
                setTagQuery("");
              }}
            >
              {t("useExistingTag")}
            </Button>
          </div>
        )}

        <Label htmlFor={`item-tag-${editingItem?.id ?? "new"}`}>{t("tagLabel")}</Label>

        <Select
          name="locationTagId"
          value={selectedTagId}
          onValueChange={(value) => setSelectedTagId(value ?? "none")}
        >
          <SelectTrigger id={`item-tag-${editingItem?.id ?? "new"}`} className="w-full">
            <SelectValue>
              {(value: string | null) => {
                if (!value || value === "none") return t("noTagOption");

                const option = tagOptions.find((tag) => tag.id === value);
                return option ? `${tCategory(option.category)} ${option.title}` : t("noTagOption");
              }}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="none">{t("noTagOption")}</SelectItem>

            {filteredTags.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tCategory(tag.category)} {tag.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {tagQuery.trim() && filteredTags.length === 0 && (
          <p className="text-muted-foreground text-xs">{t("noMatchingTag")}</p>
        )}

        {selectedTag && (
          <p className="text-muted-foreground text-xs">
            {t("selectedTag", { title: selectedTag.title })}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`item-notes-${editingItem?.id ?? "new"}`}>{t("notesLabel")}</Label>
        <Input
          id={`item-notes-${editingItem?.id ?? "new"}`}
          name="notes"
          defaultValue={editingItem?.notes ?? ""}
          placeholder={t("notesPlaceholder")}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">{state.error}</p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? isEditing ? t("submitEditPending") : t("submitPending")
          : isEditing ? t("submitEdit") : t("submit")}
      </Button>
    </form>
  );
}