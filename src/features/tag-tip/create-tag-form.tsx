"use client";

import dynamic from "next/dynamic";
import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TAG_CATEGORIES, type TagCategory } from "@/features/tag-tip/categories";
import { createTagAction, type CreateTagFormState } from "@/features/tag-tip/actions";

const LocationPickerMap = dynamic(
  () => import("@/features/map/location-picker-map").then((mod) => mod.LocationPickerMap),
  {
    ssr: false,
    loading: () => <div className="bg-muted h-80 w-full animate-pulse rounded-xl" />,
  },
);

const initialState: CreateTagFormState = { attempt: 0 };

function inputValue(value: string | number | null | undefined) {
  return value == null ? "" : String(value);
}

function coordinateNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function CreateTagForm({ initialTitle }: { initialTitle?: string }) {
  const t = useTranslations("tagTip.form");
  const tCategory = useTranslations("tagCategory");
  const [state, formAction, pending] = useActionState(createTagAction, initialState);

  const [latitude, setLatitude] = useState(() => inputValue(state.submitted?.latitude));
  const [longitude, setLongitude] = useState(() => inputValue(state.submitted?.longitude));

  useEffect(() => {
    setLatitude(inputValue(state.submitted?.latitude));
    setLongitude(inputValue(state.submitted?.longitude));
  }, [state.attempt, state.submitted?.latitude, state.submitted?.longitude]);

  const latitudeNumber = coordinateNumber(latitude);
  const longitudeNumber = coordinateNumber(longitude);

  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-title">{t("titleLabel")}</Label>
        <Input
          id="tag-title"
          name="title"
          required
          placeholder={t("titlePlaceholder")}
          defaultValue={state.submitted?.title ?? (state.attempt === 0 ? initialTitle : undefined)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-category">{t("categoryLabel")}</Label>

        <Select name="category" defaultValue={state.submitted?.category ?? "RESTAURANT"}>
          <SelectTrigger id="tag-category" className="w-full">
            <SelectValue>
              {(value: TagCategory | null) => value ? tCategory(value) : null}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            {TAG_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>{tCategory(category)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tag-content">{t("contentLabel")}</Label>
        <Input
          id="tag-content"
          name="content"
          placeholder={t("contentPlaceholder")}
          defaultValue={state.submitted?.content}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-opening-time">{t("openingTimeLabel")}</Label>
          <Input
            id="tag-opening-time"
            name="openingTime"
            type="time"
            defaultValue={state.submitted?.openingTime}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-closing-time">{t("closingTimeLabel")}</Label>
          <Input
            id="tag-closing-time"
            name="closingTime"
            type="time"
            defaultValue={state.submitted?.closingTime}
          />
        </div>
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">{t("openingHoursHint")}</p>

      <div className="overflow-hidden rounded-xl border">
        <LocationPickerMap
          latitude={latitudeNumber}
          longitude={longitudeNumber}
          onChange={(value) => {
            setLatitude(value.latitude.toFixed(6));
            setLongitude(value.longitude.toFixed(6));
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-lat">{t("latitudeLabel")}</Label>
          <Input
            id="tag-lat"
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            placeholder="10.762600"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tag-lng">{t("longitudeLabel")}</Label>
          <Input
            id="tag-lng"
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            placeholder="106.660200"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
        </div>
      </div>

      <p className="text-muted-foreground -mt-2 text-xs">{t("coordinatesHint")}</p>

      {state.duplicate && (
        <div className="border-chart-2/40 bg-chart-2/10 flex flex-col gap-2 rounded-lg border p-3 text-sm">
          <p>{t("duplicateWarning", { title: state.duplicate.title })}</p>

          <Button
            type="submit"
            name="force"
            value="true"
            variant="outline"
            size="sm"
            disabled={pending}
            className="self-start"
          >
            {pending ? t("submitPending") : t("createAnyway")}
          </Button>
        </div>
      )}

      {state.createdTitle && (
        <p className="text-primary text-sm">
          {t("createdSuccess", { title: state.createdTitle })}
        </p>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">{state.error}</p>
      )}

      {!state.duplicate && (
        <Button
          type="submit"
          name="force"
          value="false"
          disabled={pending}
          className="self-start"
        >
          {pending ? t("submitPending") : t("submit")}
        </Button>
      )}
    </form>
  );
}