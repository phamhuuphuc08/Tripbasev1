import { prisma } from "@/server/db/client";

export function findItineraryByTrip(tripId: string) {
  return prisma.itineraryItem.findMany({
    where: { tripId },
    include: {
      place: true,
      locationTag: true,
    },
    orderBy: [
      { day: "asc" },
      { startTime: "asc" },
      { sortOrder: "asc" },
    ],
  });
}

export function createItineraryItem(data: {
  tripId: string;
  title: string;
  day: number;
  startTime: Date | null;
  endTime: Date | null;
  sortOrder: number;
  placeId?: string | null;
  locationTagId?: string | null;
  notes?: string | null;
}) {
  return prisma.itineraryItem.create({
    data,
    include: {
      place: true,
      locationTag: true,
    },
  });
}

export function updateItineraryItem(
  id: string,
  data: {
    title: string;
    day: number;
    startTime: Date | null;
    endTime: Date | null;
    sortOrder: number;
    placeId?: string | null;
    locationTagId?: string | null;
    notes?: string | null;
  },
) {
  return prisma.itineraryItem.update({
    where: { id },
    data,
    include: {
      place: true,
      locationTag: true,
    },
  });
}

export function deleteItineraryItem(id: string) {
  return prisma.itineraryItem.delete({
    where: { id },
  });
}

export function findItineraryItemById(id: string) {
  return prisma.itineraryItem.findUnique({
    where: { id },
    include: {
      trip: true,
      place: true,
      locationTag: true,
    },
  });
}