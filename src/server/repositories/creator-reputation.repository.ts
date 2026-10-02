import { prisma } from "@/server/db/client";

/**
 * Đọc snapshot Creator Reputation
 * đã được background scoring lưu trong DB.
 */
export function findCreatorReputationByUserId(userId: string) {
  return prisma.creatorReputation.findUnique({
    where: {
      userId,
    },
    select: {
      copyplanScore: true,
      totalPlans: true,
      totalCopies: true,
      lastUpdated: true,
    },
  });
}