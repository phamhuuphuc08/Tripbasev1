"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Clock3,
  MapPin,
  Sparkles,
  Tag,
} from "lucide-react";

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

import {
  TAG_CATEGORIES,
  type TagCategory,
} from "@/features/tag-tip/categories";

import {
  createTagAction,
  type CreateTagFormState,
} from "@/features/tag-tip/actions";

const LocationPickerMap = dynamic(
  () =>
    import("@/features/map/location-picker-map").then(
      (mod) => mod.LocationPickerMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="bg-muted h-80 w-full animate-pulse rounded-2xl" />
    ),
  },
);

const initialState: CreateTagFormState = {
  attempt: 0,
};

function inputValue(
  value: string | number | null | undefined,
) {
  return value == null
    ? ""
    : String(value);
}

function coordinateNumber(
  value: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function CoordinateFields({
  initialLatitude,
  initialLongitude,
}: {
  initialLatitude?: string | number | null;
  initialLongitude?: string | number | null;
}) {
  const t =
    useTranslations(
      "tagTip.form",
    );

  const [
    latitude,
    setLatitude,
  ] = useState(
    () =>
      inputValue(
        initialLatitude,
      ),
  );

  const [
    longitude,
    setLongitude,
  ] = useState(
    () =>
      inputValue(
        initialLongitude,
      ),
  );

  const latitudeNumber =
    coordinateNumber(
      latitude,
    );

  const longitudeNumber =
    coordinateNumber(
      longitude,
    );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
          <MapPin className="size-4" />
        </span>

        <div>
          <h3 className="text-sm font-semibold">
            {t(
              "locationTitle",
            )}
          </h3>

          <p className="text-muted-foreground text-xs">
            {t(
              "locationDescription",
            )}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border shadow-sm">
        <LocationPickerMap
          latitude={
            latitudeNumber
          }
          longitude={
            longitudeNumber
          }
          onChange={(
            value,
          ) => {
            setLatitude(
              value.latitude.toFixed(
                6,
              ),
            );

            setLongitude(
              value.longitude.toFixed(
                6,
              ),
            );
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tag-lat"
            className="text-sm font-medium"
          >
            {t(
              "latitudeLabel",
            )}
          </Label>

          <Input
            id="tag-lat"
            name="latitude"
            type="number"
            step="any"
            min="-90"
            max="90"
            placeholder="10.762600"
            value={
              latitude
            }
            onChange={(
              event,
            ) =>
              setLatitude(
                event.target
                  .value,
              )
            }
            className="h-11 rounded-xl"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tag-lng"
            className="text-sm font-medium"
          >
            {t(
              "longitudeLabel",
            )}
          </Label>

          <Input
            id="tag-lng"
            name="longitude"
            type="number"
            step="any"
            min="-180"
            max="180"
            placeholder="106.660200"
            value={
              longitude
            }
            onChange={(
              event,
            ) =>
              setLongitude(
                event.target
                  .value,
              )
            }
            className="h-11 rounded-xl"
          />
        </div>
      </div>

      <p className="text-muted-foreground text-xs leading-5">
        {t(
          "coordinatesHint",
        )}
      </p>
    </div>
  );
}

export function CreateTagForm({
  initialTitle,
}: {
  initialTitle?: string;
}) {
  const t =
    useTranslations(
      "tagTip.form",
    );

  const tCategory =
    useTranslations(
      "tagCategory",
    );

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    createTagAction,
    initialState,
  );

  return (
    <form
      key={
        state.attempt
      }
      action={
        formAction
      }
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Tag className="size-4" />
          </span>

          <div>
            <h3 className="text-sm font-semibold">
              {t(
                "basicInfoTitle",
              )}
            </h3>

            <p className="text-muted-foreground text-xs">
              {t(
                "basicInfoDescription",
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tag-title"
            className="text-sm font-medium"
          >
            {t(
              "titleLabel",
            )}
          </Label>

          <Input
            id="tag-title"
            name="title"
            required
            placeholder={
              t(
                "titlePlaceholder",
              )
            }
            defaultValue={
              state.submitted
                ?.title ??
              (
                state.attempt ===
                0
                  ? initialTitle
                  : undefined
              )
            }
            className="h-11 rounded-xl"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tag-category"
            className="text-sm font-medium"
          >
            {t(
              "categoryLabel",
            )}
          </Label>

          <Select
            name="category"
            defaultValue={
              state.submitted
                ?.category ??
              "RESTAURANT"
            }
          >
            <SelectTrigger
              id="tag-category"
              className="h-11 w-full rounded-xl"
            >
              <SelectValue>
                {(
                  value:
                    | TagCategory
                    | null,
                ) =>
                  value
                    ? tCategory(
                        value,
                      )
                    : null
                }
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              {TAG_CATEGORIES.map(
                (
                  category,
                ) => (
                  <SelectItem
                    key={
                      category
                    }
                    value={
                      category
                    }
                  >
                    {
                      tCategory(
                        category,
                      )
                    }
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="tag-content"
            className="text-sm font-medium"
          >
            {t(
              "contentLabel",
            )}
          </Label>

          <Input
            id="tag-content"
            name="content"
            placeholder={
              t(
                "contentPlaceholder",
              )
            }
            defaultValue={
              state.submitted
                ?.content
            }
            className="h-11 rounded-xl"
          />

          <p className="text-muted-foreground text-xs leading-5">
            {t(
              "contentHint",
            )}
          </p>
        </div>
      </div>

      <div className="border-t pt-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
            <Clock3 className="size-4" />
          </span>

          <div>
            <h3 className="text-sm font-semibold">
              {t(
                "openingHoursTitle",
              )}
            </h3>

            <p className="text-muted-foreground text-xs">
              {t(
                "openingHoursDescription",
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="tag-opening-time"
              className="text-sm font-medium"
            >
              {t(
                "openingTimeLabel",
              )}
            </Label>

            <Input
              id="tag-opening-time"
              name="openingTime"
              type="time"
              defaultValue={
                state.submitted
                  ?.openingTime
              }
              className="h-11 rounded-xl"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="tag-closing-time"
              className="text-sm font-medium"
            >
              {t(
                "closingTimeLabel",
              )}
            </Label>

            <Input
              id="tag-closing-time"
              name="closingTime"
              type="time"
              defaultValue={
                state.submitted
                  ?.closingTime
              }
              className="h-11 rounded-xl"
            />
          </div>
        </div>

        <p className="text-muted-foreground mt-2 text-xs leading-5">
          {t(
            "openingHoursHint",
          )}
        </p>
      </div>

      <div className="border-t pt-6">
        <CoordinateFields
          key={
            state.attempt
          }
          initialLatitude={
            state.submitted
              ?.latitude
          }
          initialLongitude={
            state.submitted
              ?.longitude
          }
        />
      </div>

      {state.duplicate && (
        <div className="border-chart-2/40 bg-chart-2/10 flex flex-col gap-3 rounded-xl border p-4 text-sm">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 size-4 shrink-0" />

            <p>
              {t(
                "duplicateWarning",
                {
                  title:
                    state.duplicate
                      .title,
                },
              )}
            </p>
          </div>

          <Button
            type="submit"
            name="force"
            value="true"
            variant="outline"
            size="sm"
            disabled={
              pending
            }
            className="self-start rounded-xl"
          >
            {pending
              ? t(
                  "submitPending",
                )
              : t(
                  "createAnyway",
                )}
          </Button>
        </div>
      )}

      {state.createdTitle && (
        <div className="border-primary/20 bg-primary/5 rounded-xl border px-4 py-3">
          <p className="text-primary text-sm font-medium">
            {t(
              "createdSuccess",
              {
                title:
                  state.createdTitle,
              },
            )}
          </p>
        </div>
      )}

      {state.error && (
        <div
          role="alert"
          className="border-destructive/20 bg-destructive/5 rounded-xl border px-4 py-3"
        >
          <p className="text-destructive text-sm">
            {
              state.error
            }
          </p>
        </div>
      )}

      {!state.duplicate && (
        <div className="border-t pt-5">
          <Button
            type="submit"
            name="force"
            value="false"
            disabled={
              pending
            }
            className="h-11 rounded-xl px-6 shadow-sm"
          >
            <Sparkles className="size-4" />

            {pending
              ? t(
                  "submitPending",
                )
              : t(
                  "submit",
                )}
          </Button>
        </div>
      )}
    </form>
  );
}