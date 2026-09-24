import {
  PlanVisibility,
  type PlanStatus,
  type TravelPace,
} from "@prisma/client";
import { prisma } from "@/server/db/client";

const ownerSelect = {
  id: true,
  name: true,
} as const;

export function findPublicTripsByDestination(
  query: string,
  take = 20,
) {
  return prisma.trip.findMany({
    where: {
      visibility: PlanVisibility.PUBLIC,
      destination: {
        contains: query,
        mode: "insensitive",
      },
    },
    include: {
      owner: {
        select: ownerSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
  });
}

export function findRecentPublicTrips(
  take = 6,
) {
  return prisma.trip.findMany({
    where: {
      visibility: PlanVisibility.PUBLIC,
    },
    include: {
      owner: {
        select: ownerSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take,
  });
}

export function findTripById(id: string) {
  return prisma.trip.findUnique({
    where: {
      id,
    },

    include: {
      owner: {
        select: ownerSelect,
      },

      travelers: true,

      /*
       * Nguồn của Trip được tạo bằng CopyPlan.
       */
      forkedFrom: {
        select: {
          id: true,
          name: true,

          owner: {
            select: ownerSelect,
          },
        },
      },

      /*
       * Thông tin CopyPlan của Trip hiện tại.
       *
       * Dùng để hiển thị:
       * - Retention Rate
       * - số activity ban đầu được copy
       */
      copyRecord: {
        select: {
          retentionRate: true,
          initialItemCount: true,
        },
      },

      _count: {
        select: {
          itineraryItems: true,
        },
      },
    },
  });
}

export function findTripsByOwner(
  ownerId: string,
) {
  return prisma.trip.findMany({
    where: {
      ownerId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export function countTripsByOwner(
  ownerId: string,
) {
  return prisma.trip.count({
    where: {
      ownerId,
    },
  });
}

export function createTrip(data: {
  ownerId: string;
  name: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  visibility: PlanVisibility;
  travelerCount: number;
  budgetTarget: number | null;
  pace: TravelPace;
  travelStyle: string[];
}) {
  return prisma.trip.create({
    data,
  });
}

export function updateTrip(
  id: string,
  data: {
    name: string;
    destination: string;
    startDate: Date | null;
    endDate: Date | null;
    visibility: PlanVisibility;
    status: PlanStatus;
    travelerCount: number;
    budgetTarget: number | null;
    pace: TravelPace;
    travelStyle: string[];
  },
) {
  return prisma.trip.update({
    where: {
      id,
    },
    data,
  });
}

export function deleteTrip(id: string) {
  return prisma.trip.delete({
    where: {
      id,
    },
  });
}