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
import {
  createTripAction,
  updateTripAction,
  type TripFormState,
} from "@/features/trip/actions";

const initialState: TripFormState = {};

export interface TripFormDefaults {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  visibility: "PRIVATE" | "FRIENDS" | "PUBLIC";
  status: "IDEA" | "SCHEDULED" | "COMPLETED";
}

export function TripForm({
  mode,
  defaultValues,
}: {
  mode: "create" | "edit";
  defaultValues?: TripFormDefaults;
}) {
  const t = useTranslations("trip.form");
  const tVisibility = useTranslations("tripVisibility");
  const tStatus = useTranslations("tripStatus");

  const action =
    mode === "edit" && defaultValues
      ? updateTripAction.bind(null, defaultValues.id)
      : createTripAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const pendingLabel =
    mode === "create" ? t("createSubmitPending") : t("editSubmitPending");
  const submitLabel = mode === "create" ? t("createSubmit") : t("editSubmit");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder={t("namePlaceholder")}
          defaultValue={defaultValues?.name}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="destination">{t("destinationLabel")}</Label>
        <Input
          id="destination"
          name="destination"
          required
          placeholder={t("destinationPlaceholder")}
          defaultValue={defaultValues?.destination}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="startDate">{t("startDateLabel")}</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={defaultValues?.startDate}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="endDate">{t("endDateLabel")}</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={defaultValues?.endDate}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="visibility">{t("visibilityLabel")}</Label>
        <Select
          name="visibility"
          defaultValue={defaultValues?.visibility ?? "PRIVATE"}
        >
          <SelectTrigger id="visibility" className="w-full">
            <SelectValue>
              {(value: "PRIVATE" | "FRIENDS" | "PUBLIC" | null) =>
                value ? tVisibility(value) : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PRIVATE">{tVisibility("PRIVATE")}</SelectItem>
            <SelectItem value="FRIENDS">{tVisibility("FRIENDS")}</SelectItem>
            <SelectItem value="PUBLIC">{tVisibility("PUBLIC")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "edit" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">{t("statusLabel")}</Label>
          <Select name="status" defaultValue={defaultValues?.status ?? "IDEA"}>
            <SelectTrigger id="status" className="w-full">
              <SelectValue>
                {(value: "IDEA" | "SCHEDULED" | "COMPLETED" | null) =>
                  value ? tStatus(value) : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDEA">{tStatus("IDEA")}</SelectItem>
              <SelectItem value="SCHEDULED">{tStatus("SCHEDULED")}</SelectItem>
              <SelectItem value="COMPLETED">{tStatus("COMPLETED")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
