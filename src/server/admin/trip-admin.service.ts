import "server-only";

import { PlanStatus, PlanVisibility } from "@prisma/client";
import { prisma } from "@/server/db/client";

export async function listAdminTrips(
  query = "",
  status?: PlanStatus,
  visibility?: PlanVisibility,
) {
  const search = query.trim();

  return prisma.trip.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(visibility ? { visibility } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { destination: { contains: search, mode: "insensitive" } },
              { owner: { name: { contains: search, mode: "insensitive" } } },
              { owner: { email: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      destination: true,
      status: true,
      visibility: true,
      startDate: true,
      endDate: true,
      travelerCount: true,
      verifiedByAuthor: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      _count: {
        select: {
          itineraryItems: true,
          collaborators: true,
          citations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function getAdminTrip(tripId: string) {
  return prisma.trip.findUnique({
    where: { id: tripId },
    select: {
      id: true,
      name: true,
      destination: true,
      coverImageUrl: true,
      status: true,
      visibility: true,
      startDate: true,
      endDate: true,
      travelerCount: true,
      budgetTarget: true,
      currency: true,
      pace: true,
      travelStyle: true,
      verifiedByAuthor: true,
      createdAt: true,
      updatedAt: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      itineraryItems: {
        select: {
          id: true,
          day: true,
          title: true,
          startTime: true,
          endTime: true,
        },
        orderBy: [
          { day: "asc" },
          { sortOrder: "asc" },
        ],
        take: 20,
      },
      _count: {
        select: {
          itineraryItems: true,
          collaborators: true,
          citations: true,
          interactions: true,
        },
      },
    },
  });
}