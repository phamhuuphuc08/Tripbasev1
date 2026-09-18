"use client";

import { useActionState } from "react";
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
import { TRIP_STYLES, type TripStyle } from "@/features/trip/styles";
import {
  createTripAction,
  updateTripAction,
  type TripFormState,
} from "@/features/trip/actions";

const initialState: TripFormState = {};

type Pace = "RELAXED" | "NORMAL" | "BUSY";

export interface TripFormDefaults {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelerCount: number;
  budgetTarget: string;
  pace: Pace;
  travelStyle: TripStyle[];
  visibility: "PRIVATE" | "FRIENDS" | "PUBLIC";
  status: "IDEA" | "SCHEDULED" | "COMPLETED";
}

export function TripForm({
  mode,
  defaultValues,
  shareToken,
}: {
  mode: "create" | "edit";
  defaultValues?: TripFormDefaults;
  shareToken?: string | null;
}) {
  const t = useTranslations("trip.form");
  const tVisibility = useTranslations("tripVisibility");
  const tStatus = useTranslations("tripStatus");
  const token = shareToken ?? null;

  const action =
    mode === "edit" && defaultValues
      ? updateTripAction.bind(null, defaultValues.id, token)
      : createTripAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  const pendingLabel =
    mode === "create" ? t("createSubmitPending") : t("editSubmitPending");
  const submitLabel =
    mode === "create" ? t("createSubmit") : t("editSubmit");

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

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="travelerCount">{t("travelerCountLabel")}</Label>
          <Input
            id="travelerCount"
            name="travelerCount"
            type="number"
            min={1}
            max={50}
            step={1}
            defaultValue={defaultValues?.travelerCount ?? 1}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetTarget">{t("budgetTargetLabel")}</Label>
          <div className="relative">
            <Input
              id="budgetTarget"
              name="budgetTarget"
              type="number"
              min={0}
              step={1000}
              inputMode="numeric"
              placeholder={t("budgetTargetPlaceholder")}
              defaultValue={defaultValues?.budgetTarget}
              className="pr-12"
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              VND
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>{t("travelStyleLabel")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {TRIP_STYLES.map((style) => {
            const stylePlaceholder: Record<TripStyle, string> = {
              FOOD: t("styleFood"),
              SHOPPING: t("styleShopping"),
              CULTURE: t("styleCulture"),
              NATURE: t("styleNature"),
            };

            return (
              <label
                key={style}
                className="border-input has-[[data-checked]]:border-primary has-[[data-checked]]:bg-primary/5 flex items-center gap-2 rounded-lg border px-2.5 py-2 text-sm"
              >
                <Checkbox
                  name="travelStyle"
                  value={style}
                  defaultChecked={defaultValues?.travelStyle?.includes(style)}
                />
                {stylePlaceholder[style]}
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pace">{t("paceLabel")}</Label>
        <Select name="pace" defaultValue={defaultValues?.pace ?? "NORMAL"}>
          <SelectTrigger id="pace" className="w-full">
            <SelectValue>
              {(value: Pace | null) => {
                if (value === "RELAXED") return t("paceRelaxed");
                if (value === "BUSY") return t("paceBusy");
                return t("paceNormal");
              }}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="RELAXED">{t("paceRelaxed")}</SelectItem>
            <SelectItem value="NORMAL">{t("paceNormal")}</SelectItem>
            <SelectItem value="BUSY">{t("paceBusy")}</SelectItem>
          </SelectContent>
        </Select>
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