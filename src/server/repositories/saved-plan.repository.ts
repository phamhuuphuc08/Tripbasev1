import {
  InteractionType,
  PlanVisibility,
} from "@prisma/client";

import { prisma } from "@/server/db/client";

export function findSavedPlan(
  userId: string,
  planId: string,
) {
  return prisma.interaction.findUnique({
    where: {
      planId_userId_type: {
        planId,
        userId,
        type: InteractionType.BOOKMARK,
      },
    },
  });
}

export function savePlan(
  userId: string,
  planId: string,
) {
  return prisma.interaction.upsert({
    where: {
      planId_userId_type: {
        planId,
        userId,
        type: InteractionType.BOOKMARK,
      },
    },

    update: {},

    create: {
      userId,
      planId,
      type: InteractionType.BOOKMARK,
    },
  });
}

export function removeSavedPlan(
  userId: string,
  planId: string,
) {
  return prisma.interaction.deleteMany({
    where: {
      userId,
      planId,
      type: InteractionType.BOOKMARK,
    },
  });
}

export function findSavedPlansByUser(
  userId: string,
) {
  return prisma.interaction.findMany({
    where: {
      userId,
      type: InteractionType.BOOKMARK,

      plan: {
        visibility: PlanVisibility.PUBLIC,
      },
    },

    include: {
      plan: {
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },

          planReputation: true,

          _count: {
            select: {
              itineraryItems: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });
}

export function countSavedPlansByUser(
  userId: string,
) {
  return prisma.interaction.count({
    where: {
      userId,
      type: InteractionType.BOOKMARK,
    },
  });
}