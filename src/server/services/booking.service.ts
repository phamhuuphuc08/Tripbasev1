import {
  createBooking,
  deleteBooking,
  findBookingById,
  findBookingsByTrip,
  updateBooking as updateBookingRepo,
} from "@/server/repositories/booking.repository";
import {
  assertCanEditTrip,
  assertCanViewTrip,
  PermissionError,
} from "@/server/services/permission.service";
import {
  BookingDocumentError,
  deleteBookingDocumentIfLocal,
  isBookingDocumentKey,
  saveBookingDocument,
} from "@/server/storage/booking-document";

export class BookingError extends Error {}

export interface BookingInput {
  type: string;
  provider: string | null;
  confirmationCode: string | null;
  fileUrl?: string | null;
  dateTime: Date | null;
  document?: File | null;
  removeDocument?: boolean;
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeBookingInput(input: BookingInput) {
  return {
    type: input.type.trim(),
    provider: normalizeText(input.provider),
    confirmationCode: normalizeText(input.confirmationCode),
    fileUrl:
      input.fileUrl === undefined
        ? undefined
        : normalizeText(input.fileUrl),
    dateTime: input.dateTime,
  };
}

async function assertTripViewer(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  try {
    return await assertCanViewTrip(
      tripId,
      userId,
      shareToken,
    );
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") {
        throw new BookingError("TRIP_NOT_FOUND");
      }

      throw new BookingError("FORBIDDEN");
    }

    throw error;
  }
}

async function assertTripEditor(
  tripId: string,
  userId: string,
  shareToken?: string | null,
) {
  try {
    return await assertCanEditTrip(
      tripId,
      userId,
      shareToken,
    );
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") {
        throw new BookingError("TRIP_NOT_FOUND");
      }

      throw new BookingError("FORBIDDEN");
    }

    throw error;
  }
}

async function savePrivateDocument(
  tripId: string,
  file: File,
) {
  try {
    return await saveBookingDocument(
      tripId,
      file,
    );
  } catch (error) {
    if (error instanceof BookingDocumentError) {
      throw new BookingError(error.message);
    }

    throw error;
  }
}

export async function listBookings(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  await assertTripViewer(
    tripId,
    userId,
    shareToken,
  );

  return findBookingsByTrip(tripId);
}

export async function getBookingDocumentForViewer(
  bookingId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  const booking = await findBookingById(bookingId);

  if (!booking) {
    throw new BookingError("NOT_FOUND");
  }

  await assertTripViewer(
    booking.tripId,
    userId,
    shareToken,
  );

  if (
    !booking.fileUrl ||
    !isBookingDocumentKey(booking.fileUrl)
  ) {
    throw new BookingError("DOCUMENT_NOT_FOUND");
  }

  return {
    booking,
    storageKey: booking.fileUrl,
  };
}

export async function addBooking(
  tripId: string,
  userId: string,
  input: BookingInput,
  shareToken?: string | null,
) {
  await assertTripEditor(
    tripId,
    userId,
    shareToken,
  );

  const normalized =
    normalizeBookingInput(input);

  if (!normalized.type) {
    throw new BookingError("TYPE_REQUIRED");
  }

  let uploadedDocument: string | null = null;

  if (
    input.document &&
    input.document.size > 0
  ) {
    uploadedDocument =
      await savePrivateDocument(
        tripId,
        input.document,
      );
  }

  try {
    return await createBooking({
      tripId,
      type: normalized.type,
      provider: normalized.provider,
      confirmationCode:
        normalized.confirmationCode,
      fileUrl:
        uploadedDocument ??
        normalized.fileUrl ??
        null,
      dateTime: normalized.dateTime,
    });
  } catch (error) {
    if (uploadedDocument) {
      await deleteBookingDocumentIfLocal(
        uploadedDocument,
      );
    }

    throw error;
  }
}

export async function editBooking(
  bookingId: string,
  userId: string,
  input: BookingInput,
  shareToken?: string | null,
) {
  const booking =
    await findBookingById(bookingId);

  if (!booking) {
    throw new BookingError("NOT_FOUND");
  }

  await assertTripEditor(
    booking.tripId,
    userId,
    shareToken,
  );

  const normalized =
    normalizeBookingInput(input);

  if (!normalized.type) {
    throw new BookingError("TYPE_REQUIRED");
  }

  let nextFileUrl =
    normalized.fileUrl === undefined
      ? booking.fileUrl
      : normalized.fileUrl;

  if (input.removeDocument) {
    nextFileUrl = null;
  }

  let uploadedDocument: string | null = null;

  if (
    input.document &&
    input.document.size > 0
  ) {
    uploadedDocument =
      await savePrivateDocument(
        booking.tripId,
        input.document,
      );

    nextFileUrl = uploadedDocument;
  }

  try {
    const updated =
      await updateBookingRepo(
        bookingId,
        {
          type: normalized.type,
          provider: normalized.provider,
          confirmationCode:
            normalized.confirmationCode,
          fileUrl: nextFileUrl,
          dateTime:
            normalized.dateTime,
        },
      );

    if (
      booking.fileUrl &&
      booking.fileUrl !==
        updated.fileUrl
    ) {
      await deleteBookingDocumentIfLocal(
        booking.fileUrl,
      );
    }

    return updated;
  } catch (error) {
    if (uploadedDocument) {
      await deleteBookingDocumentIfLocal(
        uploadedDocument,
      );
    }

    throw error;
  }
}

export async function removeBooking(
  bookingId: string,
  userId: string,
  shareToken?: string | null,
) {
  const booking =
    await findBookingById(bookingId);

  if (!booking) {
    throw new BookingError("NOT_FOUND");
  }

  await assertTripEditor(
    booking.tripId,
    userId,
    shareToken,
  );

  const deleted =
    await deleteBooking(bookingId);

  await deleteBookingDocumentIfLocal(
    booking.fileUrl,
  );

  return deleted;
}