import { prisma } from "@/server/db/client";

export function findItineraryItemsByTrip(tripId: string) {
  return prisma.itineraryItem.findMany({
    where: { tripId },
    include: {
      locationTag: {
        select: {
          id: true,
          title: true,
          category: true,
          latitude: true,
          longitude: true,
          citeTrustScore: true,
        },
      },
    },
    orderBy: [
      { day: "asc" },

      { sortOrder: "asc" },
    ],
  });
}

export function findItineraryItemById(id: string) {
  return prisma.itineraryItem.findUnique({
    where: { id },
    include: {
      locationTag: {
        select: {
          id: true,
          title: true,
          category: true,
          latitude: true,
          longitude: true,
          citeTrustScore: true,
        },
      },
    },
  });
}

export function createItineraryItem(data: {
  tripId: string;
  day: number;
  title: string;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  locationTagId: string | null;
}) {
  return prisma.itineraryItem.create({
    data,
  });
}

export function updateItineraryItem(
  id: string,
  data: {
    day: number;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    notes: string | null;
    locationTagId: string | null;
  },
) {
  return prisma.itineraryItem.update({
    where: { id },
    data,
  });
}

export function deleteItineraryItem(id: string) {
  return prisma.itineraryItem.delete({
    where: { id },
  });
}

export function reorderItineraryItems(items: { id: string; day: number; sortOrder: number }[]) {
  return prisma.$transaction(items.map((item) => prisma.itineraryItem.update({
    where: { id: item.id },
    data: { day: item.day, sortOrder: item.sortOrder },
  })));
}