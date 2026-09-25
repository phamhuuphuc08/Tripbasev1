import { prisma } from "@/server/db/client";

/**
 * Kiểm tra một CopyPlan có hợp lệ
 * để được tính vào Reputation hay không.
 *
 * Quy tắc MVP:
 *
 * - User khác copy plan → hợp lệ.
 * - Chủ plan tự copy plan của mình
 *   → vẫn cho phép copy,
 *     nhưng KHÔNG tính vào Reputation.
 */
export async function isCopyEligibleForReputation(
  planCopyId: string,
) {
  const planCopy =
    await prisma.planCopy.findUnique({
      where: {
        id: planCopyId,
      },

      select: {
        copierUserId: true,

        originalPlan: {
          select: {
            ownerId: true,
          },
        },
      },
    });

  if (!planCopy) {
    return false;
  }

  return (
    planCopy.copierUserId !==
    planCopy.originalPlan.ownerId
  );
}

/**
 * Lấy các CopyPlan hợp lệ của một plan gốc.
 *
 * Self-copy bị loại khỏi kết quả.
 *
 * Hàm này sẽ được M09 dùng để tính:
 * - Copy Volume
 * - Retention Rate
 * - Completion Rate
 * - Post-trip Rating
 */
export async function listEligiblePlanCopies(
  originalPlanId: string,
) {
  /*
   * Cần biết owner của plan gốc
   * để loại những bản tự copy.
   */
  const originalPlan =
    await prisma.trip.findUnique({
      where: {
        id: originalPlanId,
      },

      select: {
        ownerId: true,
      },
    });

  if (!originalPlan) {
    return [];
  }

  return prisma.planCopy.findMany({
    where: {
      originalPlanId,

      /*
       * Guardrail:
       *
       * copierUserId === ownerId
       * → self-copy
       * → không tính reputation.
       */
      copierUserId: {
        not: originalPlan.ownerId,
      },
    },

    select: {
      id: true,
      planId: true,
      originalPlanId: true,
      copierUserId: true,
      copiedAt: true,

      initialItemCount: true,
      retentionRate: true,

      completed: true,
      postTripRating: true,
    },

    orderBy: {
      copiedAt: "desc",
    },
  });
}

/**
 * Đếm số CopyPlan hợp lệ.
 *
 * Đây là Copy Volume cơ bản
 * nhưng chưa áp dụng:
 *
 * - decay
 * - diversity bonus
 * - device fingerprint
 *
 * Các phần đó thuộc bước tính
 * Reputation Score của M09.
 */
export async function countEligiblePlanCopies(
  originalPlanId: string,
) {
  const originalPlan =
    await prisma.trip.findUnique({
      where: {
        id: originalPlanId,
      },

      select: {
        ownerId: true,
      },
    });

  if (!originalPlan) {
    return 0;
  }

  return prisma.planCopy.count({
    where: {
      originalPlanId,

      copierUserId: {
        not: originalPlan.ownerId,
      },
    },
  });
}