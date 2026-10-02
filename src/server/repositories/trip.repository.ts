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

/**
 * Snapshot Reputation đã được
 * background scoring tính sẵn.
 *
 * Explore chỉ đọc dữ liệu này,
 * không tính score real-time.
 */
const planReputationSelect = {
  copyplanScore: true,
  eligibleCopyCount: true,
  adjustedCopyVolume: true,
  averageRetentionRate: true,
  completionRate: true,
  averagePostTripRating: true,
  diversityBonus: true,
  decay: true,
  lastCopyAt: true,
  lastUpdated: true,
} as const;

/**
 * Tìm Public Plan theo destination.
 *
 * DB ưu tiên CopyPlan Score cao trước.
 * Marketplace service sẽ tiếp tục
 * xếp exact / prefix / substring.
 */
export function findPublicTripsByDestination(
  query: string,
  take = 20,
) {
  return prisma.trip.findMany({
    where: {
      visibility:
        PlanVisibility.PUBLIC,

      destination: {
        contains:
          query,

        mode:
          "insensitive",
      },
    },

    include: {
      owner: {
        select:
          ownerSelect,
      },

      planReputation: {
        select:
          planReputationSelect,
      },
    },

    orderBy: [
      {
        planReputation: {
          copyplanScore:
            "desc",
        },
      },
      {
        createdAt:
          "desc",
      },
    ],

    take,
  });
}

/**
 * Public Plan cho Explore mặc định.
 *
 * Trước đây:
 * createdAt DESC
 *
 * M09:
 * CopyPlan Score DESC
 *
 * Nếu score bằng nhau thì
 * plan mới hơn đứng trước.
 */
export function findRecentPublicTrips(
  take = 6,
) {
  return prisma.trip.findMany({
    where: {
      visibility:
        PlanVisibility.PUBLIC,
    },

    include: {
      owner: {
        select:
          ownerSelect,
      },

      planReputation: {
        select:
          planReputationSelect,
      },
    },

    orderBy: [
      {
        planReputation: {
          copyplanScore:
            "desc",
        },
      },
      {
        createdAt:
          "desc",
      },
    ],

    take,
  });
}

export function findTripById(
  id: string,
) {
  return prisma.trip.findUnique({
    where: {
      id,
    },

    include: {
      owner: {
        select:
          ownerSelect,
      },

      travelers:
        true,

      /*
       * Nguồn của Trip được tạo
       * bằng CopyPlan.
       */
      forkedFrom: {
        select: {
          id:
            true,

          name:
            true,

          owner: {
            select:
              ownerSelect,
          },
        },
      },

      /*
       * Thông tin CopyPlan
       * của Trip hiện tại.
       */
      copyRecord: {
        select: {
          retentionRate:
            true,

          initialItemCount:
            true,

          completed:
            true,

          postTripRating:
            true,

          copiedAt:
            true,
        },
      },

      _count: {
        select: {
          itineraryItems:
            true,
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
      updatedAt:
        "desc",
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

export function createTrip(
  data: {
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
  },
) {
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

export function deleteTrip(
  id: string,
) {
  return prisma.trip.delete({
    where: {
      id,
    },
  });
}