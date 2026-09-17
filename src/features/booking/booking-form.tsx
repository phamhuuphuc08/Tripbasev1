"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addBookingAction,
  type BookingFormState,
  updateBookingAction,
} from "@/features/booking/actions";

const initialState: BookingFormState = {};

export interface EditingBooking {
  id: string;
  type: string;
  provider: string | null;
  confirmationCode: string | null;
  fileUrl: string | null;
  dateTime: Date | string | null;
}

function toDateTimeLocal(value: Date | string | null | undefined) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);

  return local.toISOString().slice(0, 16);
}

export function BookingForm({
  tripId,
  editingBooking,
  shareToken,
}: {
  tripId: string;
  editingBooking?: EditingBooking;
  shareToken?: string | null;
}) {
  const t = useTranslations("booking.form");
  const token = shareToken ?? null;

  const action = editingBooking
    ? updateBookingAction.bind(null, tripId, editingBooking.id, token)
    : addBookingAction.bind(null, tripId, token);

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-type">{t("typeLabel")}</Label>
          <Input
            id="booking-type"
            name="type"
            required
            defaultValue={editingBooking?.type ?? ""}
            placeholder={t("typePlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-provider">{t("providerLabel")}</Label>
          <Input
            id="booking-provider"
            name="provider"
            defaultValue={editingBooking?.provider ?? ""}
            placeholder={t("providerPlaceholder")}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-confirmation-code">
            {t("confirmationCodeLabel")}
          </Label>
          <Input
            id="booking-confirmation-code"
            name="confirmationCode"
            defaultValue={editingBooking?.confirmationCode ?? ""}
            placeholder={t("confirmationCodePlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-date-time">{t("dateTimeLabel")}</Label>
          <Input
            id="booking-date-time"
            name="dateTime"
            type="datetime-local"
            defaultValue={toDateTimeLocal(editingBooking?.dateTime)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="booking-file-url">{t("fileUrlLabel")}</Label>
        <Input
          id="booking-file-url"
          name="fileUrl"
          type="url"
          defaultValue={editingBooking?.fileUrl ?? ""}
          placeholder={t("fileUrlPlaceholder")}
        />
        <p className="text-muted-foreground text-xs">{t("fileUrlHint")}</p>
      </div>

      {state.error && (
        <p role="alert" className="text-destructive text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending} className="self-start">
        {pending
          ? editingBooking
            ? t("updatePending")
            : t("submitPending")
          : editingBooking
            ? t("updateSubmit")
            : t("submit")}
      </Button>
    </form>
  );
}