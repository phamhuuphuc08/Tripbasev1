import { prisma } from "@/server/db/client";

export function listPlaces() {
  return prisma.place.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      latitude: true,
      longitude: true,
      openingHours: true,
      costEstimate: true,
    },
  });
}

export function findPlaceById(id: string) {
  return prisma.place.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      latitude: true,
      longitude: true,
      openingHours: true,
      costEstimate: true,
    },
  });
}