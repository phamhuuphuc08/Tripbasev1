"use client";

import { useActionState, useState } from "react";
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

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

const SUPPORTED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

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
  const tErrors = useTranslations("booking.errors");
  const token = shareToken ?? null;

  const [documentError, setDocumentError] = useState<string | null>(null);

  const action = editingBooking
    ? updateBookingAction.bind(
        null,
        tripId,
        editingBooking.id,
        token,
      )
    : addBookingAction.bind(null, tripId, token);

  const [state, formAction, pending] = useActionState(
    action,
    initialState,
  );

  function handleDocumentChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      setDocumentError(null);
      return;
    }

    if (file.size > MAX_DOCUMENT_BYTES) {
      setDocumentError(tErrors("documentTooLarge"));

      event.currentTarget.value = "";

      return;
    }

    if (!SUPPORTED_DOCUMENT_TYPES.has(file.type)) {
      setDocumentError(tErrors("documentTypeUnsupported"));

      event.currentTarget.value = "";

      return;
    }

    setDocumentError(null);
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-type">
            {t("typeLabel")}
          </Label>

          <Input
            id="booking-type"
            name="type"
            required
            defaultValue={editingBooking?.type ?? ""}
            placeholder={t("typePlaceholder")}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="booking-provider">
            {t("providerLabel")}
          </Label>

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
          <Label htmlFor="booking-date-time">
            {t("dateTimeLabel")}
          </Label>

          <Input
            id="booking-date-time"
            name="dateTime"
            type="datetime-local"
            defaultValue={toDateTimeLocal(
              editingBooking?.dateTime,
            )}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="booking-document">
          {t("documentLabel")}
        </Label>

        <Input
          id="booking-document"
          name="document"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleDocumentChange}
        />

        <p className="text-muted-foreground text-xs">
          {t("documentHint")}
        </p>

        {documentError && (
          <p
            role="alert"
            className="text-destructive text-sm"
          >
            {documentError}
          </p>
        )}
      </div>

      {editingBooking?.fileUrl && (
        <div className="border-border flex flex-col gap-2 rounded-lg border p-3">
          <p className="text-sm font-medium">
            {t("currentDocument")}
          </p>

          <p className="text-muted-foreground text-xs">
            {t("replaceDocumentHint")}
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="removeDocument"
              className="size-4"
            />

            <span>
              {t("removeDocument")}
            </span>
          </label>
        </div>
      )}

      {state.error && (
        <p
          role="alert"
          className="text-destructive text-sm"
        >
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        disabled={pending || Boolean(documentError)}
        className="self-start"
      >
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