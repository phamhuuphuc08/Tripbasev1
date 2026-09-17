import { prisma } from "@/server/db/client";

export function findBookingsByTrip(tripId: string) {
  return prisma.booking.findMany({
    where: { tripId },
    orderBy: [
      { dateTime: "asc" },
      { id: "asc" },
    ],
  });
}

export function findBookingById(id: string) {
  return prisma.booking.findUnique({
    where: { id },
  });
}

export function createBooking(data: {
  tripId: string;
  type: string;
  provider: string | null;
  confirmationCode: string | null;
  fileUrl: string | null;
  dateTime: Date | null;
}) {
  return prisma.booking.create({ data });
}

export function updateBooking(
  id: string,
  data: {
    type: string;
    provider: string | null;
    confirmationCode: string | null;
    fileUrl: string | null;
    dateTime: Date | null;
  },
) {
  return prisma.booking.update({
    where: { id },
    data,
  });
}

export function deleteBooking(id: string) {
  return prisma.booking.delete({
    where: { id },
  });
}