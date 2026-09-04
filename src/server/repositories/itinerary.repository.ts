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
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  });
}

export function findItineraryItemById(id: string) {
  return prisma.itineraryItem.findUnique({ where: { id } });
}

export function createItineraryItem(data: {
  tripId: string;
  day: number;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  locationTagId: string | null;
}) {
  return prisma.itineraryItem.create({ data });
}

export function deleteItineraryItem(id: string) {
  return prisma.itineraryItem.delete({ where: { id } });
}
