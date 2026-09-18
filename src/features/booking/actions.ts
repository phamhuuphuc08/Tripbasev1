"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addBooking,
  BookingError,
  editBooking,
  removeBooking,
} from "@/server/services/booking.service";

export interface BookingFormState {
  error?: string;
}

function normalizeShareToken(shareToken: string | null) {
  const token = shareToken?.trim();
  return token || null;
}

function bookingHref(tripId: string, shareToken: string | null) {
  const token = normalizeShareToken(shareToken);

  return token
    ? `/trips/${tripId}?shareToken=${encodeURIComponent(token)}#booking`
    : `/trips/${tripId}#booking`;
}

async function parseBookingForm(formData: FormData) {
  const t = await getTranslations("booking.errors");

  const schema = z.object({
    type: z.string().trim().min(1, t("typeRequired")),
    provider: z.string().trim().optional(),
    confirmationCode: z.string().trim().optional(),
    fileUrl: z.string().trim().optional(),
    dateTime: z.string().trim().optional(),
  });

  const parsed = schema.safeParse({
    type: formData.get("type")?.toString() ?? "",
    provider: formData.get("provider")?.toString() || undefined,
    confirmationCode:
      formData.get("confirmationCode")?.toString() || undefined,
    fileUrl:
      formData.get("fileUrl")?.toString() || undefined,
    dateTime:
      formData.get("dateTime")?.toString() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error:
        parsed.error.issues[0]?.message ??
        t("invalidInput"),
    };
  }

  let dateTime: Date | null = null;

  if (parsed.data.dateTime) {
    const parsedDate = new Date(
      parsed.data.dateTime,
    );

    if (Number.isNaN(parsedDate.getTime())) {
      return {
        success: false as const,
        error: t("dateInvalid"),
      };
    }

    dateTime = parsedDate;
  }

  const rawDocument =
    formData.get("document");

  const document =
    rawDocument instanceof File &&
    rawDocument.size > 0
      ? rawDocument
      : null;

  const removeDocument =
    formData.get("removeDocument") === "on";

  return {
    success: true as const,
    data: {
      type: parsed.data.type,
      provider:
        parsed.data.provider?.trim() ||
        null,
      confirmationCode:
        parsed.data.confirmationCode?.trim() ||
        null,
      fileUrl:
        parsed.data.fileUrl === undefined
          ? undefined
          : parsed.data.fileUrl.trim() ||
            null,
      dateTime,
      document,
      removeDocument,
    },
  };
}

async function bookingErrorMessage(
  error: unknown,
  fallbackKey:
    | "addFailed"
    | "updateFailed",
) {
  const t =
    await getTranslations(
      "booking.errors",
    );

  if (error instanceof BookingError) {
    if (error.message === "TOO_LARGE") {
      return t("documentTooLarge");
    }

    if (
      error.message ===
      "UNSUPPORTED_TYPE"
    ) {
      return t(
        "documentTypeUnsupported",
      );
    }

    if (
      error.message === "FORBIDDEN"
    ) {
      return t("forbidden");
    }

    if (
      error.message === "NOT_FOUND"
    ) {
      return t("notFound");
    }
  }

  return t(fallbackKey);
}

export async function addBookingAction(
  tripId: string,
  shareToken: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await getSession();
  const t =
    await getTranslations(
      "booking.errors",
    );

  if (!session) {
    return {
      error: t("loginRequired"),
    };
  }

  const parsed =
    await parseBookingForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error,
    };
  }

  try {
    await addBooking(
      tripId,
      session.userId,
      parsed.data,
      normalizeShareToken(
        shareToken,
      ),
    );
  } catch (error) {
    return {
      error:
        await bookingErrorMessage(
          error,
          "addFailed",
        ),
    };
  }

  const locale = await getLocale();

  return redirect({
    href: bookingHref(
      tripId,
      shareToken,
    ),
    locale,
  });
}

export async function updateBookingAction(
  tripId: string,
  bookingId: string,
  shareToken: string | null,
  _prevState: BookingFormState,
  formData: FormData,
): Promise<BookingFormState> {
  const session = await getSession();
  const t =
    await getTranslations(
      "booking.errors",
    );

  if (!session) {
    return {
      error: t("loginRequired"),
    };
  }

  const parsed =
    await parseBookingForm(formData);

  if (!parsed.success) {
    return {
      error: parsed.error,
    };
  }

  try {
    await editBooking(
      bookingId,
      session.userId,
      parsed.data,
      normalizeShareToken(
        shareToken,
      ),
    );
  } catch (error) {
    return {
      error:
        await bookingErrorMessage(
          error,
          "updateFailed",
        ),
    };
  }

  const locale = await getLocale();

  return redirect({
    href: bookingHref(
      tripId,
      shareToken,
    ),
    locale,
  });
}

export async function removeBookingAction(
  tripId: string,
  bookingId: string,
  shareToken: string | null,
  _formData: FormData,
) {
  void _formData;

  const [session, locale] =
    await Promise.all([
      getSession(),
      getLocale(),
    ]);

  if (session) {
    try {
      await removeBooking(
        bookingId,
        session.userId,
        normalizeShareToken(
          shareToken,
        ),
      );
    } catch {
      // Best-effort delete.
    }
  }

  return redirect({
    href: bookingHref(
      tripId,
      shareToken,
    ),
    locale,
  });
}