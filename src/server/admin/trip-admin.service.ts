import "server-only";
import { prisma } from "@/server/db/client";

export async function listAdminTrips(query = "") {
  const search = query.trim();
  return prisma.trip.findMany({
    where: search
      ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { destination: { contains: search, mode: "insensitive" } }] }
      : undefined,
    select: { id: true, name: true, destination: true, status: true, visibility: true, createdAt: true, owner: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getAdminTrip(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true, name: true, destination: true, status: true, visibility: true, startDate: true,
      endDate: true, createdAt: true, updatedAt: true, owner: { select: { id: true, name: true, email: true } },
      _count: { select: { itineraryItems: true, collaborators: true, citations: true } },
    },
  });
}