import {
  PlanStatus,
  PlanVisibility,
  TravelPace,
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/server/db/client";

const ownerSelect = {
  id: true,
  name: true,
  image: true,
} as const;

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

export type ExploreRepositorySort =
  | "RELEVANCE"
  | "TRUST"
  | "POPULAR"
  | "RATING"
  | "NEWEST";

export interface ExploreRepositoryQuery {
  query?: string;
  destination?: string;
  travelStyles?: string[];
  budgetMin?: number;
  budgetMax?: number;
  pace?: TravelPace;
  status?: PlanStatus;
  startDateFrom?: Date;
  startDateTo?: Date;
  sort?: ExploreRepositorySort;
  skip?: number;
  take?: number;
}

function buildExploreWhere(
  options: ExploreRepositoryQuery = {},
): Prisma.TripWhereInput {
  const query = options.query?.trim() ?? "";
  const destination = options.destination?.trim() ?? "";
  const travelStyles = options.travelStyles?.filter(Boolean) ?? [];

  const budgetFilter: Prisma.DecimalNullableFilter<"Trip"> | undefined =
    options.budgetMin != null || options.budgetMax != null
      ? {
          ...(options.budgetMin != null ? { gte: options.budgetMin } : {}),
          ...(options.budgetMax != null ? { lte: options.budgetMax } : {}),
        }
      : undefined;

  const startDateFilter: Prisma.DateTimeNullableFilter<"Trip"> | undefined =
    options.startDateFrom || options.startDateTo
      ? {
          ...(options.startDateFrom ? { gte: options.startDateFrom } : {}),
          ...(options.startDateTo ? { lte: options.startDateTo } : {}),
        }
      : undefined;

  return {
    visibility: PlanVisibility.PUBLIC,
    itineraryItems: { some: {} },

    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { destination: { contains: query, mode: "insensitive" } },
            {
              owner: {
                name: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            },
          ],
        }
      : {}),

    ...(destination
      ? {
          destination: {
            contains: destination,
            mode: "insensitive",
          },
        }
      : {}),

    ...(travelStyles.length > 0
      ? {
          travelStyle: {
            hasSome: travelStyles,
          },
        }
      : {}),

    ...(budgetFilter ? { budgetTarget: budgetFilter } : {}),
    ...(options.pace ? { pace: options.pace } : {}),
    ...(options.status ? { status: options.status } : {}),
    ...(startDateFilter ? { startDate: startDateFilter } : {}),
  };
}

function buildExploreOrderBy(
  sort: ExploreRepositorySort = "TRUST",
): Prisma.TripOrderByWithRelationInput[] {
  switch (sort) {
    case "NEWEST":
      return [
        { createdAt: "desc" },
        { id: "desc" },
      ];

    case "POPULAR":
      return [
        {
          planReputation: {
            eligibleCopyCount: "desc",
          },
        },
        {
          planReputation: {
            copyplanScore: "desc",
          },
        },
        { createdAt: "desc" },
        { id: "desc" },
      ];

    case "RATING":
      return [
        {
          planReputation: {
            averagePostTripRating: "desc",
          },
        },
        {
          planReputation: {
            copyplanScore: "desc",
          },
        },
        { createdAt: "desc" },
        { id: "desc" },
      ];

    case "RELEVANCE":
    case "TRUST":
    default:
      return [
        {
          planReputation: {
            copyplanScore: "desc",
          },
        },
        { createdAt: "desc" },
        { id: "desc" },
      ];
  }
}

/**
 * M10.7 — DB pagination thật.
 * Repository áp dụng filter + sort + skip/take trực tiếp ở PostgreSQL.
 */
export function findExplorePublicTrips(
  options: ExploreRepositoryQuery = {},
) {
  const take = Math.min(Math.max(options.take ?? 12, 1), 48);
  const skip = Math.max(options.skip ?? 0, 0);

  return prisma.trip.findMany({
    where: buildExploreWhere(options),

    include: {
      owner: {
        select: ownerSelect,
      },
      planReputation: {
        select: planReputationSelect,
      },
      _count: {
        select: {
          itineraryItems: true,
        },
      },
    },

    orderBy: buildExploreOrderBy(options.sort),

    skip,
    take,
  });
}

export function countExplorePublicTrips(
  options: ExploreRepositoryQuery = {},
) {
  return prisma.trip.count({
    where: buildExploreWhere(options),
  });
}

/**
 * API cũ cho Home page.
 */
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
      planReputation: {
        select: planReputationSelect,
      },
      _count: {
        select: {
          itineraryItems: true,
        },
      },
    },

    orderBy: [
      {
        planReputation: {
          copyplanScore: "desc",
        },
      },
      {
        createdAt: "desc",
      },
    ],

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
      planReputation: {
        select: planReputationSelect,
      },
      _count: {
        select: {
          itineraryItems: true,
        },
      },
    },

    orderBy: [
      {
        planReputation: {
          copyplanScore: "desc",
        },
      },
      {
        createdAt: "desc",
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
        select: ownerSelect,
      },

      travelers: true,

      forkedFrom: {
        select: {
          id: true,
          name: true,
          owner: {
            select: ownerSelect,
          },
        },
      },

      copyRecord: {
        select: {
          retentionRate: true,
          initialItemCount: true,
          completed: true,
          postTripRating: true,
          copiedAt: true,
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

export function findTripsSharedWithUser(
  userId: string,
) {
  return prisma.trip.findMany({
    where: {
      collaborators: {
        some: {
          userId,
        },
      },
    },

    include: {
      collaborators: {
        where: {
          userId,
        },

        select: {
          role: true,
        },
      },

      owner: {
        select: ownerSelect,
      },
    },

    orderBy: {
      updatedAt: "desc",
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
