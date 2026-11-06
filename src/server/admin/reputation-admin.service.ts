import "server-only";

import { prisma } from "@/server/db/client";

export async function listAdminReputation(query = "") {
  const search = query.trim();

  const [creators, plans, tags, creatorCount, planCount, tagCount] =
    await Promise.all([
      prisma.creatorReputation.findMany({
        where: search
          ? {
              OR: [
                {
                  user: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  user: {
                    email: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
              ],
            }
          : undefined,

        select: {
          userId: true,
          copyplanScore: true,
          totalPlans: true,
          totalCopies: true,
          lastUpdated: true,

          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },

        orderBy: {
          copyplanScore: "desc",
        },

        take: 100,
      }),

      prisma.planReputation.findMany({
        where: search
          ? {
              OR: [
                {
                  plan: {
                    name: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  plan: {
                    destination: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                },
                {
                  plan: {
                    owner: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                },
              ],
            }
          : undefined,

        select: {
          planId: true,
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

          plan: {
            select: {
              id: true,
              name: true,
              destination: true,

              owner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },

        orderBy: {
          copyplanScore: "desc",
        },

        take: 100,
      }),

      prisma.locationTag.findMany({
        where: {
          approvalStatus: "APPROVED",

          ...(search
            ? {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    category: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    owner: {
                      name: {
                        contains: search,
                        mode: "insensitive",
                      },
                    },
                  },
                ],
              }
            : {}),
        },

        select: {
          id: true,
          title: true,
          category: true,
          citeTrustScore: true,
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
              citations: true,
              itineraryItems: true,
            },
          },
        },

        orderBy: {
          citeTrustScore: "desc",
        },

        take: 100,
      }),

      prisma.creatorReputation.count(),

      prisma.planReputation.count(),

      prisma.locationTag.count({
        where: {
          approvalStatus: "APPROVED",
        },
      }),
    ]);

  const averageCreatorScore =
    creators.length > 0
      ? creators.reduce(
          (sum, creator) =>
            sum +
            creator.copyplanScore,
          0,
        ) / creators.length
      : 0;

  const averagePlanScore =
    plans.length > 0
      ? plans.reduce(
          (sum, plan) =>
            sum +
            plan.copyplanScore,
          0,
        ) / plans.length
      : 0;

  const averageTagScore =
    tags.length > 0
      ? tags.reduce(
          (sum, tag) =>
            sum +
            tag.citeTrustScore,
          0,
        ) / tags.length
      : 0;

  return {
    creators,
    plans,
    tags,

    stats: {
      creatorCount,
      planCount,
      tagCount,
      averageCreatorScore,
      averagePlanScore,
      averageTagScore,
    },
  };
}
export type ReputationAlertLevel = "HIGH" | "MEDIUM";

export interface ReputationAlert {
  id: string;
  type: "CREATOR" | "PLAN" | "TAG";
  level: ReputationAlertLevel;
  title: string;
  description: string;
  score: number;
  href: string;
}

export async function getAdminReputationAlerts(): Promise<ReputationAlert[]> {
  const [creators, plans, tags] = await Promise.all([
    prisma.creatorReputation.findMany({
      select: {
        userId: true,
        copyplanScore: true,
        totalPlans: true,
        totalCopies: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        totalCopies: "desc",
      },
      take: 200,
    }),

    prisma.planReputation.findMany({
      select: {
        planId: true,
        copyplanScore: true,
        eligibleCopyCount: true,
        completionRate: true,
        averageRetentionRate: true,
        plan: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        eligibleCopyCount: "desc",
      },
      take: 200,
    }),

    prisma.locationTag.findMany({
      where: {
        approvalStatus: "APPROVED",
      },
      select: {
        id: true,
        title: true,
        citeTrustScore: true,
        _count: {
          select: {
            citations: true,
            itineraryItems: true,
          },
        },
      },
      orderBy: {
        citeTrustScore: "asc",
      },
      take: 200,
    }),
  ]);

  const alerts: ReputationAlert[] = [];

  for (const creator of creators) {
    if (creator.totalCopies < 3 || creator.copyplanScore >= 40) continue;

    const high =
      creator.copyplanScore < 20 &&
      creator.totalCopies >= 10;

    alerts.push({
      id: `creator-${creator.userId}`,
      type: "CREATOR",
      level: high ? "HIGH" : "MEDIUM",
      title: creator.user.name,
      description: `${creator.totalCopies} lượt sao chép nhưng CopyPlan Score chỉ ${creator.copyplanScore.toFixed(2)}.`,
      score: creator.copyplanScore,
      href: `/admin/reputation/creator/${creator.userId}`,
    });
  }

  for (const plan of plans) {
    if (
      plan.eligibleCopyCount < 3 ||
      plan.copyplanScore >= 40
    ) {
      continue;
    }

    const high =
      plan.copyplanScore < 20 &&
      plan.eligibleCopyCount >= 10;

    alerts.push({
      id: `plan-${plan.planId}`,
      type: "PLAN",
      level: high ? "HIGH" : "MEDIUM",
      title: plan.plan.name,
      description: `${plan.eligibleCopyCount} lượt Copy hợp lệ nhưng CopyPlan Score chỉ ${plan.copyplanScore.toFixed(2)}.`,
      score: plan.copyplanScore,
      href: `/admin/reputation/plan/${plan.planId}`,
    });
  }

  for (const tag of tags) {
    if (
      tag._count.citations < 3 ||
      tag.citeTrustScore >= 40
    ) {
      continue;
    }

    const high =
      tag.citeTrustScore < 20 &&
      tag._count.citations >= 10;

    alerts.push({
      id: `tag-${tag.id}`,
      type: "TAG",
      level: high ? "HIGH" : "MEDIUM",
      title: tag.title,
      description: `${tag._count.citations} trích dẫn nhưng Cite Trust Score chỉ ${tag.citeTrustScore.toFixed(2)}.`,
      score: tag.citeTrustScore,
      href: `/admin/reputation/tag/${tag.id}`,
    });
  }

  return alerts
    .sort((a, b) => {
      if (a.level !== b.level) {
        return a.level === "HIGH" ? -1 : 1;
      }

      return a.score - b.score;
    })
    .slice(0, 20);
}
export async function getAdminCreatorReputation(userId: string) {
  const [creator, plans] = await Promise.all([
    prisma.creatorReputation.findUnique({
      where: {
        userId,
      },
      select: {
        userId: true,
        copyplanScore: true,
        totalPlans: true,
        totalCopies: true,
        lastUpdated: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    }),

    prisma.planReputation.findMany({
      where: {
        plan: {
          owner: {
            id: userId,
          },
        },
      },
      select: {
        planId: true,
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
        plan: {
          select: {
            id: true,
            name: true,
            destination: true,
            status: true,
            visibility: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        lastUpdated: "desc",
      },
      take: 20,
    }),
  ]);

  if (!creator) {
    return null;
  }

  return {
    ...creator,
    plans,
  };
}
export async function getAdminPlanReputation(planId: string) {
  return prisma.planReputation.findFirst({
    where: {
      planId,
    },
    select: {
      planId: true,
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

      plan: {
        select: {
          id: true,
          name: true,
          destination: true,
          status: true,
          visibility: true,
          createdAt: true,

          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });
}
