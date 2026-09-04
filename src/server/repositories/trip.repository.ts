import { PlanVisibility } from "@prisma/client";
import { prisma } from "@/server/db/client";

const ownerSelect = { id: true, name: true } as const;

export function findPublicTripsByDestination(query: string, take = 20) {
  return prisma.trip.findMany({
    where: {
      visibility: PlanVisibility.PUBLIC,
      destination: { contains: query, mode: "insensitive" },
    },
    include: { owner: { select: ownerSelect } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function findRecentPublicTrips(take = 6) {
  return prisma.trip.findMany({
    where: { visibility: PlanVisibility.PUBLIC },
    include: { owner: { select: ownerSelect } },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export function findTripById(id: string) {
  return prisma.trip.findUnique({
    where: { id },
    include: {
      owner: { select: ownerSelect },
      _count: { select: { itineraryItems: true } },
    },
  });
}
