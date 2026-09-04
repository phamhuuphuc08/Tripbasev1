"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createItineraryItemAction,
  updateItineraryItemAction,
  type ItineraryErrorCode,
  type ItineraryFormState,
} from "@/features/itinerary/actions";

export interface ItineraryFormDefaults {
  id: string;
  title: string;
  day: number;
  startTime: string;
  endTime: string;
  sortOrder: number;
  notes: string;
}

export function ItineraryForm({
  tripId,
  mode = "create",
  defaultValues,
}: {
  tripId: string;
  mode?: "create" | "edit";
  defaultValues?: ItineraryFormDefaults;
}) {
  const t = useTranslations("itinerary.form");
  const te = useTranslations("itinerary.errors");

  const action =
    mode === "edit" && defaultValues
      ? updateItineraryItemAction.bind(null, defaultValues.id, tripId)
      : createItineraryItemAction.bind(null, tripId);

  const [state, formAction, pending] = useActionState<ItineraryFormState, FormData>(
    action,
    {},
  );

  function errorText(error?: ItineraryErrorCode) {
    if (!error) return null;
    if (error === "TITLE_REQUIRED") return te("titleRequired");
    if (error === "DAY_INVALID") return te("dayInvalid");
    if (error === "DATETIME_INVALID") return te("dateTimeInvalid");
    if (error === "END_BEFORE_START") return te("endBeforeStart");
    if (error === "UPDATE_FAILED") return te("updateFailed");
    if (error === "DELETE_FAILED") return te("deleteFailed");
    return te("createFailed");
  }

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="hidden"
        name="sortOrder"
        value={defaultValues?.sortOrder ?? 0}
      />

      <div className="space-y-2">
        <label htmlFor="itinerary-title" className="text-sm font-medium">
          {t("titleLabel")}
        </label>
        <Input
          id="itinerary-title"
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          placeholder={t("titlePlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="itinerary-day" className="text-sm font-medium">
          {t("dayLabel")}
        </label>
        <Input
          id="itinerary-day"
          name="day"
          type="number"
          min={1}
          max={365}
          required
          defaultValue={defaultValues?.day ?? 1}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="itinerary-start" className="text-sm font-medium">
            {t("startTimeLabel")}
          </label>
          <Input
            id="itinerary-start"
            name="startTime"
            type="datetime-local"
            defaultValue={defaultValues?.startTime ?? ""}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="itinerary-end" className="text-sm font-medium">
            {t("endTimeLabel")}
          </label>
          <Input
            id="itinerary-end"
            name="endTime"
            type="datetime-local"
            defaultValue={defaultValues?.endTime ?? ""}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="itinerary-notes" className="text-sm font-medium">
          {t("notesLabel")}
        </label>
        <Textarea
          id="itinerary-notes"
          name="notes"
          defaultValue={defaultValues?.notes ?? ""}
          placeholder={t("notesPlaceholder")}
        />
      </div>

      {state.error && (
        <p className="text-destructive text-sm">{errorText(state.error)}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending
          ? t("saving")
          : mode === "edit"
            ? t("save")
            : t("create")}
      </Button>
    </form>
  );
}