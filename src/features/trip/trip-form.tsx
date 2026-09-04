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

  // M01 — Trip Builder
  travelerCount: number;
  budgetTarget: string;
  travelStyle: string[];
  pace: "RELAXED" | "NORMAL" | "BUSY";

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

  const submitLabel =
    mode === "create" ? t("createSubmit") : t("editSubmit");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {/* =========================================================
          TÊN CHUYẾN ĐI
      ========================================================= */}
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

      {/* =========================================================
          ĐIỂM ĐẾN
      ========================================================= */}
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

      {/* =========================================================
          NGÀY BẮT ĐẦU / NGÀY KẾT THÚC
      ========================================================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

      {/* =========================================================
          SỐ NGƯỜI / NGÂN SÁCH
      ========================================================= */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="travelerCount">
            {t("travelerCountLabel")}
          </Label>

          <Input
            id="travelerCount"
            name="travelerCount"
            type="number"
            min="1"
            max="50"
            step="1"
            required
            defaultValue={defaultValues?.travelerCount ?? 1}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="budgetTarget">
            {t("budgetTargetLabel")}
          </Label>

          <div className="relative">
            <Input
              id="budgetTarget"
              name="budgetTarget"
              type="number"
              min="0"
              step="1000"
              inputMode="numeric"
              placeholder={t("budgetTargetPlaceholder")}
              defaultValue={defaultValues?.budgetTarget}
              className="pr-14"
            />

            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              VND
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================
          SỞ THÍCH DU LỊCH
      ========================================================= */}
      <div className="flex flex-col gap-2">
        <Label>{t("travelStyleLabel")}</Label>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {/* Ăn uống */}
          <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="checkbox"
              name="travelStyle"
              value="FOOD"
              defaultChecked={defaultValues?.travelStyle?.includes("FOOD")}
              className="h-4 w-4"
            />

            <span className="text-sm">{t("styleFood")}</span>
          </label>

          {/* Mua sắm */}
          <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="checkbox"
              name="travelStyle"
              value="SHOPPING"
              defaultChecked={defaultValues?.travelStyle?.includes(
                "SHOPPING",
              )}
              className="h-4 w-4"
            />

            <span className="text-sm">{t("styleShopping")}</span>
          </label>

          {/* Văn hóa */}
          <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="checkbox"
              name="travelStyle"
              value="CULTURE"
              defaultChecked={defaultValues?.travelStyle?.includes(
                "CULTURE",
              )}
              className="h-4 w-4"
            />

            <span className="text-sm">{t("styleCulture")}</span>
          </label>

          {/* Thiên nhiên */}
          <label className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
            <input
              type="checkbox"
              name="travelStyle"
              value="NATURE"
              defaultChecked={defaultValues?.travelStyle?.includes(
                "NATURE",
              )}
              className="h-4 w-4"
            />

            <span className="text-sm">{t("styleNature")}</span>
          </label>
        </div>
      </div>

      {/* =========================================================
          NHỊP ĐỘ CHUYẾN ĐI
      ========================================================= */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pace">{t("paceLabel")}</Label>

        <Select
          name="pace"
          defaultValue={defaultValues?.pace ?? "NORMAL"}
        >
          <SelectTrigger id="pace" className="w-full">
            <SelectValue>
              {(value: "RELAXED" | "NORMAL" | "BUSY" | null) => {
                if (value === "RELAXED") {
                  return t("paceRelaxed");
                }

                if (value === "NORMAL") {
                  return t("paceNormal");
                }

                if (value === "BUSY") {
                  return t("paceBusy");
                }

                return null;
              }}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="RELAXED">
              {t("paceRelaxed")}
            </SelectItem>

            <SelectItem value="NORMAL">
              {t("paceNormal")}
            </SelectItem>

            <SelectItem value="BUSY">
              {t("paceBusy")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* =========================================================
          QUYỀN RIÊNG TƯ
      ========================================================= */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="visibility">
          {t("visibilityLabel")}
        </Label>

        <Select
          name="visibility"
          defaultValue={defaultValues?.visibility ?? "PRIVATE"}
        >
          <SelectTrigger id="visibility" className="w-full">
            <SelectValue>
              {(
                value: "PRIVATE" | "FRIENDS" | "PUBLIC" | null,
              ) => (value ? tVisibility(value) : null)}
            </SelectValue>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="PRIVATE">
              {tVisibility("PRIVATE")}
            </SelectItem>

            <SelectItem value="FRIENDS">
              {tVisibility("FRIENDS")}
            </SelectItem>

            <SelectItem value="PUBLIC">
              {tVisibility("PUBLIC")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* =========================================================
          TRẠNG THÁI
          Chỉ hiện khi sửa Trip
      ========================================================= */}
      {mode === "edit" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status">{t("statusLabel")}</Label>

          <Select
            name="status"
            defaultValue={defaultValues?.status ?? "IDEA"}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue>
                {(
                  value:
                    | "IDEA"
                    | "SCHEDULED"
                    | "COMPLETED"
                    | null,
                ) => (value ? tStatus(value) : null)}
              </SelectValue>
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="IDEA">
                {tStatus("IDEA")}
              </SelectItem>

              <SelectItem value="SCHEDULED">
                {tStatus("SCHEDULED")}
              </SelectItem>

              <SelectItem value="COMPLETED">
                {tStatus("COMPLETED")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* =========================================================
          ERROR
      ========================================================= */}
      {state.error && (
        <p
          role="alert"
          className="text-destructive rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          {state.error}
        </p>
      )}

      {/* =========================================================
          SUBMIT
      ========================================================= */}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}