import {
  recalculateAllLocationTagTrustScores,
  syncLocationTagCitationsFromItinerary,
} from "@/server/services/cite-trust.service";
import { PlanVisibility } from "@prisma/client";
import { prisma } from "@/server/db/client";


/**
 * Copy Volume bắt đầu bão hòa dần
 * khi số copy hiệu chỉnh tăng.
 *
 * Đây là tham số v1 để sau này
 * điều chỉnh bằng dữ liệu thực.
 */
const COPY_VOLUME_SCALE = 10;

/**
 * Không decay trong 30 ngày đầu.
 */
const DECAY_GRACE_DAYS = 30;

/**
 * Sau 180 ngày không có copy mới
 * thì đạt mức decay tối đa.
 */
const DECAY_MAX_DAYS = 180;

/**
 * Tối đa trừ 20% tổng score.
 */
const MAX_DECAY = 0.2;

/**
 * Các field cần dùng để tính
 * Reputation của CopyPlan.
 */
const reputationCopySelect = {
  id: true,
  planId: true,
  originalPlanId: true,

  copierUserId: true,
  copierDeviceHash: true,

  copiedAt: true,

  initialItemCount: true,
  retentionRate: true,

  completed: true,
  postTripRating: true,

  /*
   * Dữ liệu của Trip đã copy.
   *
   * Dùng cho Diversity Bonus.
   */
  plan: {
    select: {
      travelerCount: true,
      budgetTarget: true,
    },
  },
} as const;

/**
 * Giới hạn number trong khoảng 0 → 1.
 */
function clamp01(value: number) {
  return Math.max(
    0,
    Math.min(1, value),
  );
}

/**
 * Làm tròn để kết quả dễ đọc/debug.
 */
function round(
  value: number,
  digits = 4,
) {
  const factor =
    10 ** digits;

  return (
    Math.round(value * factor) /
    factor
  );
}

/**
 * Guardrail cho CopyPlan.
 *
 * 1. Self-copy không tính.
 * 2. Một user chỉ tính một lần.
 * 3. Một device chỉ tính một lần.
 *
 * Query được sort bản mới nhất trước,
 * nên khi trùng user/device,
 * bản mới nhất được giữ lại.
 */
function filterEligibleCopies<
  T extends {
    copierUserId: string;
    copierDeviceHash: string | null;
  },
>(
  copies: T[],
  originalOwnerId: string,
) {
  const seenUsers =
    new Set<string>();

  const seenDevices =
    new Set<string>();

  return copies.filter((copy) => {
    /*
     * Self-copy.
     */
    if (
      copy.copierUserId ===
      originalOwnerId
    ) {
      return false;
    }

    /*
     * Một user copy cùng plan
     * nhiều lần chỉ tính một lần.
     */
    if (
      seenUsers.has(
        copy.copierUserId,
      )
    ) {
      return false;
    }

    /*
     * Nhiều account cùng device
     * cũng chỉ tính một lần.
     *
     * null = dữ liệu cũ,
     * không dedupe theo device.
     */
    if (
      copy.copierDeviceHash &&
      seenDevices.has(
        copy.copierDeviceHash,
      )
    ) {
      return false;
    }

    seenUsers.add(
      copy.copierUserId,
    );

    if (
      copy.copierDeviceHash
    ) {
      seenDevices.add(
        copy.copierDeviceHash,
      );
    }

    return true;
  });
}

/**
 * Lấy các CopyPlan hợp lệ
 * của một plan gốc.
 */
export async function listEligiblePlanCopies(
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
    return [];
  }

  const copies =
    await prisma.planCopy.findMany({
      where: {
        originalPlanId,
      },

      select:
        reputationCopySelect,

      /*
       * Bản mới nhất trước.
       */
      orderBy: [
        {
          copiedAt: "desc",
        },
        {
          id: "desc",
        },
      ],
    });

  return filterEligibleCopies(
    copies,
    originalPlan.ownerId,
  );
}

/**
 * Kiểm tra một CopyPlan cụ thể
 * có hợp lệ để tính Reputation.
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
        id: true,
        originalPlanId: true,
      },
    });

  if (!planCopy) {
    return false;
  }

  const eligibleCopies =
    await listEligiblePlanCopies(
      planCopy.originalPlanId,
    );

  return eligibleCopies.some(
    (copy) =>
      copy.id ===
      planCopy.id,
  );
}

/**
 * Đếm CopyPlan hợp lệ.
 */
export async function countEligiblePlanCopies(
  originalPlanId: string,
) {
  const copies =
    await listEligiblePlanCopies(
      originalPlanId,
    );

  return copies.length;
}

/**
 * Xếp travelerCount thành nhóm.
 *
 * Diversity Bonus v1:
 * - 1 người
 * - 2–3
 * - 4–5
 * - 6+
 */
function getTravelerBucket(
  travelerCount: number,
) {
  if (travelerCount <= 1) {
    return "solo";
  }

  if (travelerCount <= 3) {
    return "small";
  }

  if (travelerCount <= 5) {
    return "medium";
  }

  return "large";
}

/**
 * Xếp budget thành nhóm.
 *
 * Đây là rule v1 theo VND.
 */
function getBudgetBucket(
  budget: number,
) {
  if (budget < 10_000_000) {
    return "under-10m";
  }

  if (budget < 30_000_000) {
    return "10m-30m";
  }

  if (budget < 60_000_000) {
    return "30m-60m";
  }

  return "60m-plus";
}

/**
 * Diversity Bonus v1.
 *
 * Spec có:
 * - ngân sách
 * - số người
 * - khu vực
 *
 * Hiện model CopyPlan chưa có
 * dữ liệu khu vực người dùng,
 * nên bản v1 dùng:
 *
 * - traveler diversity
 * - budget diversity
 *
 * Kết quả 0 → 1.
 */
function calculateDiversityBonus(
  copies: Awaited<
    ReturnType<
      typeof listEligiblePlanCopies
    >
  >,
) {
  if (copies.length <= 1) {
    return 0;
  }

  const travelerBuckets =
    new Set<string>();

  const budgetBuckets =
    new Set<string>();

  for (const copy of copies) {
    travelerBuckets.add(
      getTravelerBucket(
        copy.plan.travelerCount,
      ),
    );

    if (
      copy.plan.budgetTarget != null
    ) {
      budgetBuckets.add(
        getBudgetBucket(
          Number(
            copy.plan.budgetTarget,
          ),
        ),
      );
    }
  }

  /*
   * 4 nhóm tối đa.
   *
   * 1 nhóm = 0
   * 4 nhóm = 1
   */
  const travelerDiversity =
    clamp01(
      (travelerBuckets.size - 1) /
        3,
    );

  /*
   * Nếu chưa có dữ liệu budget,
   * diversity budget = 0.
   */
  const budgetDiversity =
    budgetBuckets.size > 0
      ? clamp01(
          (budgetBuckets.size - 1) /
            3,
        )
      : 0;

  return round(
    (
      travelerDiversity +
      budgetDiversity
    ) / 2,
  );
}

/**
 * Decay theo số ngày kể từ
 * lượt copy hợp lệ gần nhất.
 *
 * 0–30 ngày:
 * decay = 0
 *
 * 30–180 ngày:
 * tăng tuyến tính.
 *
 * >= 180 ngày:
 * decay = MAX_DECAY.
 */
function calculateDecay(
  lastCopyAt: Date | null,
  now = new Date(),
) {
  if (!lastCopyAt) {
    return 0;
  }

  const elapsedMs =
    now.getTime() -
    lastCopyAt.getTime();

  const elapsedDays =
    elapsedMs /
    (1000 * 60 * 60 * 24);

  if (
    elapsedDays <=
    DECAY_GRACE_DAYS
  ) {
    return 0;
  }

  const progress =
    (
      elapsedDays -
      DECAY_GRACE_DAYS
    ) /
    (
      DECAY_MAX_DAYS -
      DECAY_GRACE_DAYS
    );

  return round(
    clamp01(progress) *
      MAX_DECAY,
  );
}

/**
 * Tính toàn bộ CopyPlan metrics
 * cho một plan.
 */
export async function calculatePlanCopyMetrics(
  originalPlanId: string,
) {
  const copies =
    await listEligiblePlanCopies(
      originalPlanId,
    );

  const eligibleCopyCount =
    copies.length;

  /*
   * Không có copy hợp lệ.
   */
  if (eligibleCopyCount === 0) {
    return {
      originalPlanId,

      eligibleCopyCount: 0,

      adjustedCopyVolume: 0,

      averageRetentionRate: 0,

      completionRate: 0,

      completedCopyCount: 0,

      averagePostTripRating: 0,

      ratingCount: 0,

      diversityBonus: 0,

      decay: 0,

      lastCopyAt: null,
    };
  }

  /*
   * Retention Rate.
   *
   * retention = 0.8
   * → copy đó đóng góp 0.8
   * vào CopyVolume_hiệu_chỉnh.
   */
  const retentionValues =
    copies.map(
      (copy) =>
        copy.retentionRate ?? 0,
    );

  const adjustedCopyVolume =
    retentionValues.reduce(
      (sum, value) =>
        sum + value,
      0,
    );

  const averageRetentionRate =
    adjustedCopyVolume /
    eligibleCopyCount;

  /*
   * Completion Rate.
   */
  const completedCopies =
    copies.filter(
      (copy) =>
        copy.completed,
    );

  const completedCopyCount =
    completedCopies.length;

  const completionRate =
    completedCopyCount /
    eligibleCopyCount;

  /*
   * Post-trip Rating.
   *
   * Chỉ rating của copy đã completed.
   */
  const ratingValues =
    completedCopies
      .map(
        (copy) =>
          copy.postTripRating,
      )
      .filter(
        (
          rating,
        ): rating is number =>
          rating != null &&
          rating >= 1 &&
          rating <= 5,
      );

  const ratingCount =
    ratingValues.length;

  const averagePostTripRating =
    ratingCount > 0
      ? ratingValues.reduce(
          (sum, rating) =>
            sum + rating,
          0,
        ) / ratingCount
      : 0;

  /*
   * Query đã sort mới nhất trước.
   */
  const lastCopyAt =
    copies[0]?.copiedAt ??
    null;

  const diversityBonus =
    calculateDiversityBonus(
      copies,
    );

  const decay =
    calculateDecay(
      lastCopyAt,
    );

  return {
    originalPlanId,

    eligibleCopyCount,

    adjustedCopyVolume:
      round(
        adjustedCopyVolume,
      ),

    averageRetentionRate:
      round(
        averageRetentionRate,
      ),

    completionRate:
      round(
        completionRate,
      ),

    completedCopyCount,

    averagePostTripRating:
      round(
        averagePostTripRating,
      ),

    ratingCount,

    diversityBonus,

    decay,

    lastCopyAt,
  };
}

/**
 * Tính CopyPlan Score
 * cho một plan.
 *
 * Score cuối cùng: 0 → 100.
 *
 * Công thức spec:
 *
 * CopyVolume     × 0.40
 * Completion     × 0.25
 * Rating         × 0.25
 * Diversity      × 0.10
 * - Decay
 *
 * Retention được đưa vào
 * CopyVolume_hiệu_chỉnh.
 */
export async function calculateCopyPlanScore(
  originalPlanId: string,
) {
  const metrics =
    await calculatePlanCopyMetrics(
      originalPlanId,
    );

  /*
   * Copy Volume cần chuẩn hóa
   * về 0 → 1.
   *
   * Hàm saturation:
   *
   * 1 - e^(-volume / scale)
   *
   * Giúp score tăng nhanh lúc đầu
   * rồi chậm dần khi copy rất lớn.
   */
  const copyVolumeScore =
    metrics.adjustedCopyVolume > 0
      ? 1 -
        Math.exp(
          -metrics.adjustedCopyVolume /
            COPY_VOLUME_SCALE,
        )
      : 0;

  /*
   * Rating:
   *
   * 1–5 sao
   * → 0–1
   */
  const ratingScore =
    metrics.averagePostTripRating >
    0
      ? metrics.averagePostTripRating /
        5
      : 0;

  const rawScore =
    copyVolumeScore * 0.4 +
    metrics.completionRate *
      0.25 +
    ratingScore * 0.25 +
    metrics.diversityBonus *
      0.1 -
    metrics.decay;

  const normalizedScore =
    clamp01(rawScore);

  return {
    ...metrics,

    copyVolumeScore:
      round(
        copyVolumeScore,
      ),

    ratingScore:
      round(
        ratingScore,
      ),

    /*
     * 0 → 100.
     */
    copyPlanScore:
      round(
        normalizedScore * 100,
        2,
      ),
  };
}
/**
 * Tính lại Reputation của một plan
 * và lưu snapshot vào database.
 *
 * Hàm này không chạy mỗi lần user copy.
 * Background scoring job sẽ gọi định kỳ.
 */
export async function updatePlanReputation(
  originalPlanId: string,
) {
  /*
   * Chỉ plan PUBLIC mới tham gia
   * Reputation / Explore.
   */
  const plan =
    await prisma.trip.findUnique({
      where: {
        id: originalPlanId,
      },

      select: {
        id: true,
        visibility: true,
      },
    });

  if (!plan) {
    return null;
  }

  if (
    plan.visibility !==
    PlanVisibility.PUBLIC
  ) {
    return null;
  }

  /*
   * Tính score từ dữ liệu PlanCopy thật.
   */
  const result =
    await calculateCopyPlanScore(
      originalPlanId,
    );

  /*
   * Lưu snapshot.
   *
   * Nếu plan chưa có Reputation:
   * → create.
   *
   * Nếu đã có:
   * → update.
   */
  return prisma.planReputation.upsert({
    where: {
      planId:
        originalPlanId,
    },

    create: {
      planId:
        originalPlanId,

      copyplanScore:
        result.copyPlanScore,

      eligibleCopyCount:
        result.eligibleCopyCount,

      adjustedCopyVolume:
        result.adjustedCopyVolume,

      averageRetentionRate:
        result.averageRetentionRate,

      completionRate:
        result.completionRate,

      averagePostTripRating:
        result.averagePostTripRating,

      diversityBonus:
        result.diversityBonus,

      decay:
        result.decay,

      lastCopyAt:
        result.lastCopyAt,
    },

    update: {
      copyplanScore:
        result.copyPlanScore,

      eligibleCopyCount:
        result.eligibleCopyCount,

      adjustedCopyVolume:
        result.adjustedCopyVolume,

      averageRetentionRate:
        result.averageRetentionRate,

      completionRate:
        result.completionRate,

      averagePostTripRating:
        result.averagePostTripRating,

      diversityBonus:
        result.diversityBonus,

      decay:
        result.decay,

      lastCopyAt:
        result.lastCopyAt,
    },
  });
}

/**
 * Tính lại Reputation cho toàn bộ
 * Public Plan.
 *
 * Đây là lõi của background scoring job.
 *
 * Chạy tuần tự trong MVP để:
 * - tránh tạo quá nhiều query cùng lúc
 * - dễ debug
 * - dữ liệu hiện tại chưa lớn
 */
export async function recalculateAllPlanReputations() {
  const publicPlans =
    await prisma.trip.findMany({
      where: {
        visibility:
          PlanVisibility.PUBLIC,
      },

      select: {
        id: true,
      },

      orderBy: {
        createdAt:
          "asc",
      },
    });

  let updatedCount = 0;
  let failedCount = 0;

  const failures: Array<{
    planId: string;
    error: string;
  }> = [];

  for (const plan of publicPlans) {
    try {
      await updatePlanReputation(
        plan.id,
      );

      updatedCount += 1;
    } catch (error) {
      failedCount += 1;

      failures.push({
        planId:
          plan.id,

        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      });
    }
  }

  return {
    totalPlans:
      publicPlans.length,

    updatedCount,

    failedCount,

    failures,
  };
}
/**
 * Creator Reputation
 * ------------------
 *
 * Spec yêu cầu score của creator
 * được tổng hợp từ các Public Plan
 * mà creator sở hữu.
 *
 * Plan mới hơn có trọng số cao hơn
 * để creator phải duy trì chất lượng
 * theo thời gian.
 *
 * MVP:
 * - chỉ tính PUBLIC plan
 * - dùng snapshot PlanReputation
 * - score creator: 0 -> 100
 * - plan mới được ưu tiên bằng
 *   exponential time decay
 */

/**
 * Half-life cho trọng số của plan.
 *
 * Plan 180 ngày tuổi còn 50%
 * trọng số so với plan mới.
 *
 * Đây là rule MVP,
 * có thể tinh chỉnh sau.
 */
const CREATOR_PLAN_HALF_LIFE_DAYS =
  180;

/**
 * Tính trọng số theo độ mới
 * của một plan.
 *
 * age = 0 ngày
 * → weight = 1
 *
 * age = 180 ngày
 * → weight = 0.5
 *
 * age = 360 ngày
 * → weight = 0.25
 */
function calculateCreatorPlanWeight(
  createdAt: Date,
  now = new Date(),
) {
  const ageMs =
    Math.max(
      0,
      now.getTime() -
        createdAt.getTime(),
    );

  const ageDays =
    ageMs /
    (1000 * 60 * 60 * 24);

  return (
    0.5 **
    (
      ageDays /
      CREATOR_PLAN_HALF_LIFE_DAYS
    )
  );
}

/**
 * Tính Creator Reputation
 * nhưng chưa ghi DB.
 *
 * Chỉ đọc snapshot trong
 * plan_reputations.
 *
 * Không tính lại từng plan
 * trong hàm này.
 */
export async function calculateCreatorReputation(
  userId: string,
) {
  const plans =
    await prisma.trip.findMany({
      where: {
        ownerId:
          userId,

        visibility:
          PlanVisibility.PUBLIC,
      },

      select: {
        id:
          true,

        createdAt:
          true,

        planReputation: {
          select: {
            copyplanScore:
              true,

            eligibleCopyCount:
              true,
          },
        },
      },

      orderBy: {
        createdAt:
          "desc",
      },
    });

  const totalPlans =
    plans.length;

  /*
   * Creator không còn Public Plan.
   */
  if (totalPlans === 0) {
    return {
      userId,

      copyplanScore:
        0,

      totalPlans:
        0,

      totalCopies:
        0,
    };
  }

  let weightedScoreSum =
    0;

  let totalWeight =
    0;

  let totalCopies =
    0;

  const now =
    new Date();

  for (const plan of plans) {
    /*
     * Background Plan Scoring
     * phải chạy trước.
     *
     * Nếu plan chưa có snapshot,
     * score tạm coi là 0.
     */
    const score =
      plan.planReputation
        ?.copyplanScore ?? 0;

    const copies =
      plan.planReputation
        ?.eligibleCopyCount ?? 0;

    const weight =
      calculateCreatorPlanWeight(
        plan.createdAt,
        now,
      );

    weightedScoreSum +=
      score * weight;

    totalWeight +=
      weight;

    totalCopies +=
      copies;
  }

  const copyplanScore =
    totalWeight > 0
      ? weightedScoreSum /
        totalWeight
      : 0;

  return {
    userId,

    copyplanScore:
      round(
        copyplanScore,
        2,
      ),

    totalPlans,

    totalCopies,
  };
}

/**
 * Tính Creator Reputation
 * và lưu snapshot xuống DB.
 */
export async function updateCreatorReputation(
  userId: string,
) {
  /*
   * Kiểm tra user tồn tại.
   */
  const user =
    await prisma.user.findUnique({
      where: {
        id:
          userId,
      },

      select: {
        id:
          true,
      },
    });

  if (!user) {
    return null;
  }

  const result =
    await calculateCreatorReputation(
      userId,
    );

  return prisma.creatorReputation.upsert(
    {
      where: {
        userId,
      },

      create: {
        userId,

        copyplanScore:
          result.copyplanScore,

        totalPlans:
          result.totalPlans,

        totalCopies:
          result.totalCopies,
      },

      update: {
        copyplanScore:
          result.copyplanScore,

        totalPlans:
          result.totalPlans,

        totalCopies:
          result.totalCopies,
      },
    },
  );
}

/**
 * Tính lại Reputation
 * cho tất cả creator.
 *
 * Bao gồm:
 *
 * 1. User đang có Public Plan.
 * 2. User đã từng có
 *    CreatorReputation.
 *
 * Trường hợp 2 rất quan trọng:
 * nếu creator chuyển toàn bộ plan
 * sang PRIVATE thì score cũ cần
 * được reset về 0.
 */
export async function recalculateAllCreatorReputations() {
  const [
    publicPlanOwners,
    existingReputations,
  ] = await Promise.all([
    prisma.trip.findMany({
      where: {
        visibility:
          PlanVisibility.PUBLIC,
      },

      select: {
        ownerId:
          true,
      },

      distinct: [
        "ownerId",
      ],
    }),

    prisma.creatorReputation.findMany({
      select: {
        userId:
          true,
      },
    }),
  ]);

  const userIds =
    new Set<string>();

  for (
    const owner of
    publicPlanOwners
  ) {
    userIds.add(
      owner.ownerId,
    );
  }

  for (
    const reputation of
    existingReputations
  ) {
    userIds.add(
      reputation.userId,
    );
  }

  let updatedCount =
    0;

  let failedCount =
    0;

  const failures: Array<{
    userId: string;
    error: string;
  }> = [];

  for (const userId of userIds) {
    try {
      await updateCreatorReputation(
        userId,
      );

      updatedCount +=
        1;
    } catch (error) {
      failedCount +=
        1;

      failures.push({
        userId,

        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      });
    }
  }

  return {
    totalCreators:
      userIds.size,

    updatedCount,

    failedCount,

    failures,
  };
}

/**
 * Background Reputation Job v1.
 *
 * Thứ tự rất quan trọng:
 *
 * 1. Tính lại Plan Reputation.
 * 2. Creator đọc snapshot mới
 *    của các plan đó.
 *
 * Cite Trust Score sẽ được
 * nối vào bước 3 sau.
 */
export async function runReputationScoringJob() {
  /*
   * 1. Tính lại Plan Reputation.
   */
  const plans =
    await recalculateAllPlanReputations();

  /*
   * 2. Tính lại Creator Reputation.
   */
  const creators =
    await recalculateAllCreatorReputations();

  /*
   * 3. Đồng bộ Citation thật
   * từ itinerary.
   */
  const citations =
    await syncLocationTagCitationsFromItinerary();

  /*
   * 4. Tính Cite Trust Score
   * từ các Citation vừa đồng bộ.
   */
  const citeTrust =
    await recalculateAllLocationTagTrustScores();

  return {
    plans,
    creators,
    citations,
    citeTrust,
  };
}