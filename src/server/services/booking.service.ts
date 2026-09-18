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

export class BookingError extends Error {}

export interface BookingInput {
  type: string;
  provider: string | null;
  confirmationCode: string | null;
  fileUrl: string | null;
  dateTime: Date | null;
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized || null;
}

function normalizeBookingInput(input: BookingInput): BookingInput {
  return {
    type: input.type.trim(),
    provider: normalizeText(input.provider),
    confirmationCode: normalizeText(input.confirmationCode),
    fileUrl: normalizeText(input.fileUrl),
    dateTime: input.dateTime,
  };
}

async function assertTripViewer(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  try {
    return await assertCanViewTrip(tripId, userId, shareToken);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new BookingError("TRIP_NOT_FOUND");
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
    return await assertCanEditTrip(tripId, userId, shareToken);
  } catch (error) {
    if (error instanceof PermissionError) {
      if (error.code === "TRIP_NOT_FOUND") throw new BookingError("TRIP_NOT_FOUND");
      throw new BookingError("FORBIDDEN");
    }

    throw error;
  }
}

export async function listBookings(
  tripId: string,
  userId?: string | null,
  shareToken?: string | null,
) {
  await assertTripViewer(tripId, userId, shareToken);
  return findBookingsByTrip(tripId);
}

export async function addBooking(
  tripId: string,
  userId: string,
  input: BookingInput,
  shareToken?: string | null,
) {
  await assertTripEditor(tripId, userId, shareToken);

  const normalized = normalizeBookingInput(input);
  if (!normalized.type) throw new BookingError("TYPE_REQUIRED");

  return createBooking({
    tripId,
    ...normalized,
  });
}

export async function editBooking(
  bookingId: string,
  userId: string,
  input: BookingInput,
  shareToken?: string | null,
) {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new BookingError("NOT_FOUND");

  await assertTripEditor(booking.tripId, userId, shareToken);

  const normalized = normalizeBookingInput(input);
  if (!normalized.type) throw new BookingError("TYPE_REQUIRED");

  return updateBookingRepo(bookingId, normalized);
}

export async function removeBooking(
  bookingId: string,
  userId: string,
  shareToken?: string | null,
) {
  const booking = await findBookingById(bookingId);
  if (!booking) throw new BookingError("NOT_FOUND");

  await assertTripEditor(booking.tripId, userId, shareToken);
  return deleteBooking(bookingId);
}