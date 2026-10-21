import { prisma } from "@/server/db/client";

const CITE_VOLUME_SCALE = 5;
const CREATOR_DIVERSITY_SCALE = 3;
const MAX_NEGATIVE_SIGNAL_PENALTY = 25;

export type LocationTagNegativeSignal = "CLOSED" | "PRICE_MISMATCH" | "OTHER";

export class CiteTrustError extends Error {}

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function round2(value: number): number { return Math.round(value * 100) / 100; }

/**
 * Đồng bộ bảng Citation từ itinerary thật.
 *
 * Mỗi cặp:
 *
 * plan + LocationTag
 *
 * chỉ được coi là 1 citation.
 *
 * Nếu tag là possible_duplicate_of,
 * citation sẽ được tính cho tag gốc để
 * tránh chia nhỏ uy tín thành nhiều tag.
 *
 * Hiện ItineraryItem không lưu user đã tạo activity,
 * nên citerUserId dùng owner của Trip.
 */
export async function syncLocationTagCitationsFromItinerary() {
  const items =
    await prisma.itineraryItem.findMany({
      where: {
        locationTagId: {
          not: null,
        },
      },

      select: {
        trip: {
          select: {
            id: true,
            ownerId: true,
          },
        },

        locationTag: {
          select: {
            id: true,
            ownerId: true,

            possibleDuplicateOf: {
              select: {
                id: true,
                ownerId: true,
              },
            },
          },
        },
      },
    });

  type DesiredCitation = {
    planId: string;
    locationTagId: string;
    citerUserId: string;
    ownerIdOfTag: string;
    isSelfCite: boolean;
  };

  const desired =
    new Map<
      string,
      DesiredCitation
    >();

  for (const item of items) {
    if (!item.locationTag) {
      continue;
    }

    /*
     * Nếu đây là duplicate,
     * dùng tag gốc làm nguồn uy tín.
     */
    const canonicalTag =
      item.locationTag
        .possibleDuplicateOf ??
      item.locationTag;

    const planId =
      item.trip.id;

    const locationTagId =
      canonicalTag.id;

    const citerUserId =
      item.trip.ownerId;

    const ownerIdOfTag =
      canonicalTag.ownerId;

    const key =
      `${planId}:${locationTagId}`;

    desired.set(key, {
      planId,
      locationTagId,
      citerUserId,
      ownerIdOfTag,

      isSelfCite:
        citerUserId ===
        ownerIdOfTag,
    });
  }

  const existing =
    await prisma.citation.findMany({
      where: {
        locationTagId: {
          not: null,
        },
      },

      select: {
        id: true,
        planId: true,
        locationTagId: true,
        citerUserId: true,
        ownerIdOfTag: true,
        isSelfCite: true,
        verifiedVisit: true,
        negativeSignalType: true,
      },
    });

  const existingByKey =
    new Map<
      string,
      typeof existing
    >();

  for (const citation of existing) {
    if (!citation.locationTagId) {
      continue;
    }

    const key =
      `${citation.planId}:${citation.locationTagId}`;

    const rows =
      existingByKey.get(key) ?? [];

    rows.push(citation);

    existingByKey.set(
      key,
      rows,
    );
  }

  let createdCount = 0;
  let updatedCount = 0;
  let deletedCount = 0;

  /*
   * Create / update citation cần tồn tại.
   */
  for (
    const [
      key,
      citation,
    ] of desired
  ) {
    const rows =
      existingByKey.get(key) ??
      [];

    /*
     * Nếu dữ liệu cũ có duplicate,
     * ưu tiên giữ citation đã được
     * Verified Visit.
     *
     * Điều này tránh background sync
     * vô tình xoá mất trạng thái đã ghé.
     */
    const keeper =
      rows.find((row) => row.negativeSignalType !== null) ??
      rows.find((row) => row.verifiedVisit) ??
      rows[0];

    if (!keeper) {
      await prisma.citation.create({
        data: {
          planId:
            citation.planId,

          locationTagId:
            citation.locationTagId,

          placeId:
            null,

          citerUserId:
            citation.citerUserId,

          ownerIdOfTag:
            citation.ownerIdOfTag,

          isSelfCite:
            citation.isSelfCite,

          verifiedVisit:
            false,
        },
      });

      createdCount += 1;
      continue;
    }

    /*
     * Giữ verifiedVisit hiện tại.
     *
     * Background sync không được reset
     * xác nhận "đã ghé".
     */
    await prisma.citation.update({
      where: {
        id:
          keeper.id,
      },

      data: {
        planId:
          citation.planId,

        locationTagId:
          citation.locationTagId,

        citerUserId:
          citation.citerUserId,

        ownerIdOfTag:
          citation.ownerIdOfTag,

        isSelfCite:
          citation.isSelfCite,
      },
    });

    updatedCount += 1;

    /*
     * Nếu DB từng có nhiều citation
     * cùng plan + tag thì giữ 1 bản.
     */
    const duplicateIds =
      rows
        .filter(
          (row) =>
            row.id !==
            keeper.id,
        )
        .map(
          (row) =>
            row.id,
        );

    if (
      duplicateIds.length >
      0
    ) {
      const result =
        await prisma.citation.deleteMany({
          where: {
            id: {
              in:
                duplicateIds,
            },
          },
        });

      deletedCount +=
        result.count;
    }
  }

  /*
   * Citation tag không còn xuất hiện
   * trong itinerary → xoá.
   */
  const staleIds =
    existing
      .filter((citation) => {
        if (
          !citation.locationTagId
        ) {
          return false;
        }

        const key =
          `${citation.planId}:${citation.locationTagId}`;

        return !desired.has(
          key,
        );
      })
      .map(
        (citation) =>
          citation.id,
      );

  if (
    staleIds.length >
    0
  ) {
    const result =
      await prisma.citation.deleteMany({
        where: {
          id: {
            in:
              staleIds,
          },
        },
      });

    deletedCount +=
      result.count;
  }

  return {
    sourceItemCount:
      items.length,

    desiredCitationCount:
      desired.size,

    createdCount,

    updatedCount,

    deletedCount,
  };
}

/**
 * Tính Cite Trust Score cho 1 LocationTag.
 *
 * Spec không quy định công thức số chính xác,
 * nên đây là công thức MVP rule-based:
 *
 * 35% Cite Volume
 * 30% Cite Quality
 * 20% Verified Visit
 * 15% Cross-plan Consistency
 *
 * Negative Signal: trừ tối đa 25 điểm,
 * dựa trên tỷ lệ negative signal / verified visit.
 */
export async function calculateLocationTagCiteTrustScore(
  locationTagId: string,
) {
  const tag =
    await prisma.locationTag.findUnique({
      where: {
        id:
          locationTagId,
      },

      select: {
        id: true,
        title: true,

        possibleDuplicateOfId:
          true,

        citations: {
          where: {
            isSelfCite:
              false,
          },

          select: {
            planId:
              true,

            verifiedVisit:
              true,

            negativeSignalType:
              true,

            plan: {
              select: {
                ownerId:
                  true,

                planReputation: {
                  select: {
                    copyplanScore:
                      true,
                  },
                },

                owner: {
                  select: {
                    creatorReputation: {
                      select: {
                        copyplanScore:
                          true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

  if (!tag) {
    throw new Error(
      "LOCATION_TAG_NOT_FOUND",
    );
  }

  /*
   * Duplicate không phải nguồn độc lập.
   */
  if (
    tag.possibleDuplicateOfId
  ) {
    return {
      locationTagId:
        tag.id,

      title:
        tag.title,

      eligibleCiteCount:
        0,

      distinctCreatorCount:
        0,

      verifiedVisitCount:
        0,

      citeVolumeScore:
        0,

      citeQualityScore:
        0,

      verifiedVisitRate:
        0,

      crossPlanConsistency:
        0,

      negativeSignalCount:
        0,

      negativeSignalRate:
        0,

      negativeSignalPenalty:
        0,

      citeTrustScore:
        0,
    };
  }

  /*
   * Guardrail:
   *
   * chỉ 1 citation / plan.
   */
  const citationByPlan =
    new Map<
      string,
      (typeof tag.citations)[number]
    >();

  for (
    const citation of
      tag.citations
  ) {
    const previous =
      citationByPlan.get(
        citation.planId,
      );

    /*
     * Nếu dữ liệu cũ có duplicate,
     * ưu tiên bản đã verified.
     */
    if (
      !previous ||
      (
        citation
          .verifiedVisit &&
        !previous
          .verifiedVisit
      )
    ) {
      citationByPlan.set(
        citation.planId,
        citation,
      );
    }
  }

  const citations =
    Array.from(
      citationByPlan.values(),
    );

  const eligibleCiteCount =
    citations.length;

  const verifiedVisitCount =
    citations.filter(
      (citation) =>
        citation
          .verifiedVisit,
    ).length;

  const negativeSignalCount =
    citations.filter(
      (citation) =>
        citation.verifiedVisit &&
        citation.negativeSignalType !== null,
    ).length;

  const negativeSignalRate =
    verifiedVisitCount === 0
      ? 0
      : negativeSignalCount / verifiedVisitCount;

  const negativeSignalPenalty =
    MAX_NEGATIVE_SIGNAL_PENALTY * negativeSignalRate;

  const creatorIds =
    new Set(
      citations.map(
        (citation) =>
          citation.plan
            .ownerId,
      ),
    );

  const distinctCreatorCount =
    creatorIds.size;

  /*
   * Saturating score:
   *
   * 1 cite tăng điểm,
   * nhưng spam thêm vô hạn
   * không tăng tuyến tính mãi.
   */
  const citeVolumeScore =
    eligibleCiteCount ===
    0
      ? 0
      : 1 -
        Math.exp(
          -eligibleCiteCount /
            CITE_VOLUME_SCALE,
        );

  /*
   * Ưu tiên score của chính Plan.
   *
   * Nếu Plan chưa có score,
   * fallback sang Creator Reputation.
   */
  const qualityWeights =
    citations.map(
      (citation) => {
        const planScore =
          citation.plan
            .planReputation
            ?.copyplanScore ??
          0;

        const creatorScore =
          citation.plan
            .owner
            .creatorReputation
            ?.copyplanScore ??
          0;

        const sourceScore =
          planScore > 0
            ? planScore
            : creatorScore;

        return clamp01(
          sourceScore /
            100,
        );
      },
    );

  const citeQualityScore =
    qualityWeights.length ===
    0
      ? 0
      : qualityWeights.reduce(
          (
            total,
            value,
          ) =>
            total + value,
          0,
        ) /
        qualityWeights.length;

  const verifiedVisitRate =
    eligibleCiteCount ===
    0
      ? 0
      : verifiedVisitCount /
        eligibleCiteCount;

  /*
   * 1 creator chưa tạo
   * cross-plan consistency.
   *
   * Từ creator thứ 2 trở đi
   * mới bắt đầu tăng điểm.
   */
  const crossPlanConsistency =
    distinctCreatorCount <=
    1
      ? 0
      : 1 -
        Math.exp(
          -(
            distinctCreatorCount -
            1
          ) /
            CREATOR_DIVERSITY_SCALE,
        );

  const rawScore =
    100 *
    (
      citeVolumeScore *
        0.35 +
      citeQualityScore *
        0.3 +
      verifiedVisitRate *
        0.2 +
      crossPlanConsistency *
        0.15
    );

  const citeTrustScore =
    round2(
      Math.max(
        0,
        Math.min(
          100,
          rawScore - negativeSignalPenalty,
        ),
      ),
    );

  return {
    locationTagId:
      tag.id,

    title:
      tag.title,

    eligibleCiteCount,

    distinctCreatorCount,

    verifiedVisitCount,

    citeVolumeScore:
      round2(
        citeVolumeScore,
      ),

    citeQualityScore:
      round2(
        citeQualityScore,
      ),

    verifiedVisitRate:
      round2(
        verifiedVisitRate,
      ),

    crossPlanConsistency:
      round2(
        crossPlanConsistency,
      ),

    negativeSignalCount,

    negativeSignalRate:
      round2(negativeSignalRate),

    negativeSignalPenalty:
      round2(negativeSignalPenalty),

    citeTrustScore,
  };
}

/**
 * Tính và persist Cite Trust Score
 * cho 1 LocationTag.
 */
export async function updateLocationTagCiteTrustScore(
  locationTagId: string,
) {
  const result =
    await calculateLocationTagCiteTrustScore(
      locationTagId,
    );

  await prisma.locationTag.update({
    where: {
      id:
        locationTagId,
    },

    data: {
      citeTrustScore:
        result.citeTrustScore,
    },
  });

  return result;
}

/**
 * Background calculation cho toàn bộ
 * LocationTag gốc.
 */
export async function recalculateAllLocationTagTrustScores() {
  /*
   * possibleDuplicateOf không được xem
   * là nguồn độc lập.
   */
  const tags =
    await prisma.locationTag.findMany({
      where: {
        possibleDuplicateOfId:
          null,
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
    locationTagId: string;
    error: string;
  }> = [];

  for (const tag of tags) {
    try {
      await updateLocationTagCiteTrustScore(
        tag.id,
      );

      updatedCount += 1;
    } catch (error) {
      failedCount += 1;

      failures.push({
        locationTagId:
          tag.id,

        error:
          error instanceof Error
            ? error.message
            : "UNKNOWN_ERROR",
      });
    }
  }

  /*
   * Tag duplicate không có score độc lập.
   *
   * Reset score seed cũ để tránh hiển thị
   * uy tín giả từ dữ liệu demo.
   */
  const duplicateReset =
    await prisma.locationTag.updateMany({
      where: {
        possibleDuplicateOfId: {
          not: null,
        },
      },

      data: {
        citeTrustScore:
          0,
      },
    });

  return {
    totalTags:
      tags.length,

    updatedCount,

    failedCount,

    duplicateTagsReset:
      duplicateReset.count,

    failures,
  };
}

/**
 * M09.9.7 - Verified Visit
 *
 * Đánh dấu một LocationTag trong Trip
 * là đã ghé thực tế / hủy xác nhận.
 *
 * Guardrails:
 *
 * - Chỉ owner của Trip được xác nhận.
 * - Trip phải COMPLETED.
 * - LocationTag phải thực sự nằm trong itinerary.
 * - possible_duplicate_of luôn quy về canonical tag.
 * - Chỉ giữ 1 Citation cho mỗi plan + canonical tag.
 * - Self-cite vẫn được lưu trạng thái visit,
 *   nhưng Cite Trust Score không tính self-cite.
 *
 * Reputation Engine vẫn có thể chạy background.
 * Hàm này không ép recalculation toàn hệ thống.
 */
export async function setLocationTagVerifiedVisit(
  planId: string,
  locationTagId: string,
  userId: string,
  verifiedVisit: boolean,
) {
  if (!planId) {
    throw new CiteTrustError(
      "PLAN_ID_REQUIRED",
    );
  }

  if (!locationTagId) {
    throw new CiteTrustError(
      "LOCATION_TAG_ID_REQUIRED",
    );
  }

  if (!userId) {
    throw new CiteTrustError(
      "USER_ID_REQUIRED",
    );
  }

  const [trip, selectedTag] =
    await Promise.all([
      prisma.trip.findUnique({
        where: {
          id:
            planId,
        },

        select: {
          id: true,
          ownerId: true,
          status: true,
        },
      }),

      prisma.locationTag.findUnique({
        where: {
          id:
            locationTagId,
        },

        select: {
          id: true,
          ownerId: true,

          possibleDuplicateOfId:
            true,

          possibleDuplicateOf: {
            select: {
              id: true,
              ownerId: true,
            },
          },
        },
      }),
    ]);

  /*
   * Trip phải tồn tại.
   */
  if (!trip) {
    throw new CiteTrustError(
      "TRIP_NOT_FOUND",
    );
  }

  /*
   * Chỉ owner Trip mới được tự xác nhận
   * mình đã ghé location trong Trip đó.
   */
  if (
    trip.ownerId !==
    userId
  ) {
    throw new CiteTrustError(
      "FORBIDDEN",
    );
  }

  /*
   * Không cho verify visit khi Trip
   * vẫn đang PLANNING / ACTIVE.
   */
  if (
    trip.status !==
    "COMPLETED"
  ) {
    throw new CiteTrustError(
      "TRIP_NOT_COMPLETED",
    );
  }

  /*
   * LocationTag phải tồn tại.
   */
  if (!selectedTag) {
    throw new CiteTrustError(
      "LOCATION_TAG_NOT_FOUND",
    );
  }

  /*
   * Nếu tag là possible duplicate,
   * toàn bộ citation / trust phải quy
   * về tag gốc.
   */
  const canonicalTag =
    selectedTag
      .possibleDuplicateOf ??
    selectedTag;

  /*
   * Xác nhận location thật sự thuộc Trip.
   *
   * Chấp nhận:
   *
   * 1. itinerary dùng chính selectedTag
   *
   * 2. caller gửi canonical tag nhưng
   *    itinerary đang dùng duplicate
   *    của canonical tag đó.
   */
  const itineraryItem =
    await prisma.itineraryItem.findFirst({
      where: {
        tripId:
          planId,

        OR: [
          {
            locationTagId:
              selectedTag.id,
          },

          {
            locationTag: {
              possibleDuplicateOfId:
                canonicalTag.id,
            },
          },
        ],
      },

      select: {
        id: true,
      },
    });

  if (!itineraryItem) {
    throw new CiteTrustError(
      "TAG_NOT_IN_PLAN",
    );
  }

  /*
   * Self-cite vẫn lưu Citation để dữ liệu
   * lịch sử Trip chính xác.
   *
   * calculateLocationTagCiteTrustScore()
   * đã loại isSelfCite = true khỏi score.
   */
  const isSelfCite =
    userId ===
    canonicalTag.ownerId;

  /*
   * Transaction:
   *
   * - update/create Citation
   * - dọn duplicate Citation cũ
   *
   * Sau transaction chỉ còn tối đa
   * 1 Citation cho:
   *
   * plan + canonical LocationTag.
   */
  const citation =
    await prisma.$transaction(
      async (tx) => {
        const existingRows =
          await tx.citation.findMany({
            where: {
              planId,

              locationTagId:
                canonicalTag.id,
            },

            select: {
              id: true,
              verifiedVisit: true,
              negativeSignalType: true,
            },

            orderBy: {
              id:
                "asc",
            },
          });

        /*
         * Nếu dữ liệu cũ có duplicate,
         * ưu tiên giữ Citation đã verified.
         */
        const keeper =
          existingRows.find((row) => row.negativeSignalType !== null) ??
          existingRows.find((row) => row.verifiedVisit) ??
          existingRows[0];

        if (keeper) {
          const result =
            await tx.citation.update({
              where: {
                id:
                  keeper.id,
              },

              data: {
                citerUserId:
                  userId,

                ownerIdOfTag:
                  canonicalTag.ownerId,

                isSelfCite,

                verifiedVisit,

                ...(!verifiedVisit
                  ? { negativeSignalType: null, negativeSignalNote: null, negativeSignalAt: null }
                  : {}),
              },

              select: {
                id: true,
                planId: true,
                locationTagId: true,
                citerUserId: true,
                ownerIdOfTag: true,
                isSelfCite: true,
                verifiedVisit: true,
              },
            });

          /*
           * Xóa Citation duplicate cũ.
           */
          const duplicateIds =
            existingRows
              .filter(
                (row) =>
                  row.id !==
                  keeper.id,
              )
              .map(
                (row) =>
                  row.id,
              );

          if (
            duplicateIds.length >
            0
          ) {
            await tx.citation.deleteMany({
              where: {
                id: {
                  in:
                    duplicateIds,
                },
              },
            });
          }

          return result;
        }

        /*
         * Nếu Citation sync chưa chạy,
         * Verified Visit có thể tạo
         * Citation hợp lệ ngay tại đây.
         */
        return tx.citation.create({
          data: {
            planId,

            locationTagId:
              canonicalTag.id,

            placeId:
              null,

            citerUserId:
              userId,

            ownerIdOfTag:
              canonicalTag.ownerId,

            isSelfCite,

            verifiedVisit,
          },

          select: {
            id: true,
            planId: true,
            locationTagId: true,
            citerUserId: true,
            ownerIdOfTag: true,
            isSelfCite: true,
            verifiedVisit: true,
          },
        });
      },
    );

  return {
    ...citation,

    requestedLocationTagId:
      selectedTag.id,

    canonicalLocationTagId:
      canonicalTag.id,

    wasCanonicalized:
      selectedTag.id !==
      canonicalTag.id,
  };
}
/**
 * M09.9.8 - Negative Signal
 * Chỉ owner của Trip COMPLETED và đã verified visit
 * mới được ghi phản hồi xấu cho LocationTag trong Trip.
 */
export async function setLocationTagNegativeSignal(
  planId: string,
  locationTagId: string,
  userId: string,
  negativeSignalType: LocationTagNegativeSignal | null,
  note?: string | null,
) {
  if (!planId) throw new CiteTrustError("PLAN_ID_REQUIRED");
  if (!locationTagId) throw new CiteTrustError("LOCATION_TAG_ID_REQUIRED");
  if (!userId) throw new CiteTrustError("USER_ID_REQUIRED");

  const [trip, selectedTag] = await Promise.all([
    prisma.trip.findUnique({ where: { id: planId }, select: { id: true, ownerId: true, status: true } }),
    prisma.locationTag.findUnique({
      where: { id: locationTagId },
      select: { id: true, ownerId: true, possibleDuplicateOf: { select: { id: true, ownerId: true } } },
    }),
  ]);

  if (!trip) throw new CiteTrustError("TRIP_NOT_FOUND");
  if (trip.ownerId !== userId) throw new CiteTrustError("FORBIDDEN");
  if (trip.status !== "COMPLETED") throw new CiteTrustError("TRIP_NOT_COMPLETED");
  if (!selectedTag) throw new CiteTrustError("LOCATION_TAG_NOT_FOUND");

  const canonicalTag = selectedTag.possibleDuplicateOf ?? selectedTag;
  const itineraryItem = await prisma.itineraryItem.findFirst({
    where: {
      tripId: planId,
      OR: [
        { locationTagId: selectedTag.id },
        { locationTag: { possibleDuplicateOfId: canonicalTag.id } },
      ],
    },
    select: { id: true },
  });

  if (!itineraryItem) throw new CiteTrustError("TAG_NOT_IN_PLAN");

  const citation = await prisma.citation.findFirst({
    where: { planId, locationTagId: canonicalTag.id },
    select: { id: true, verifiedVisit: true },
  });

  if (!citation) throw new CiteTrustError("CITATION_NOT_FOUND");
  if (!citation.verifiedVisit) throw new CiteTrustError("VISIT_NOT_VERIFIED");

  const normalizedNote = note?.trim() || null;
  const updated = await prisma.citation.update({
    where: { id: citation.id },
    data: {
      negativeSignalType,
      negativeSignalNote: negativeSignalType ? normalizedNote : null,
      negativeSignalAt: negativeSignalType ? new Date() : null,
    },
    select: {
      id: true, planId: true, locationTagId: true, verifiedVisit: true,
      negativeSignalType: true, negativeSignalNote: true, negativeSignalAt: true,
    },
  });

  const trust = await updateLocationTagCiteTrustScore(canonicalTag.id);
  return {
    ...updated,
    requestedLocationTagId: selectedTag.id,
    canonicalLocationTagId: canonicalTag.id,
    wasCanonicalized: selectedTag.id !== canonicalTag.id,
    citeTrustScore: trust.citeTrustScore,
    negativeSignalCount: trust.negativeSignalCount,
    negativeSignalRate: trust.negativeSignalRate,
    negativeSignalPenalty: trust.negativeSignalPenalty,
  };
}

export async function getTripVerifiedVisits(
  tripId: string,
): Promise<Map<string, boolean>> {
  if (!tripId) return new Map();

  const citations = await prisma.citation.findMany({
    where: {
      planId: tripId,
      locationTagId: {
        not: null,
      },
    },
    select: {
      locationTagId: true,
      verifiedVisit: true,
    },
  });

  const result = new Map<string, boolean>();

  for (const citation of citations) {
    if (!citation.locationTagId) continue;

    result.set(
      citation.locationTagId,
      citation.verifiedVisit,
    );
  }

  return result;
}
export async function getTripNegativeSignals(
  tripId: string,
): Promise<Map<string, {
  type: LocationTagNegativeSignal | null;
  note: string | null;
}>> {
  if (!tripId) return new Map();

  const items = await prisma.itineraryItem.findMany({
    where: {
      tripId,
      locationTagId: { not: null },
    },
    select: {
      locationTagId: true,
      locationTag: {
        select: {
          id: true,
          possibleDuplicateOfId: true,
        },
      },
    },
  });

  const citations = await prisma.citation.findMany({
    where: {
      planId: tripId,
      locationTagId: { not: null },
    },
    select: {
      locationTagId: true,
      negativeSignalType: true,
      negativeSignalNote: true,
    },
  });

  const citationByTag = new Map(
    citations
      .filter((citation) => citation.locationTagId)
      .map((citation) => [
        citation.locationTagId!,
        {
          type: citation.negativeSignalType,
          note: citation.negativeSignalNote,
        },
      ]),
  );

  const result = new Map<string, {
    type: LocationTagNegativeSignal | null;
    note: string | null;
  }>();

  for (const item of items) {
    if (!item.locationTagId || !item.locationTag) continue;

    const canonicalId =
      item.locationTag.possibleDuplicateOfId ??
      item.locationTag.id;

    result.set(
      item.locationTagId,
      citationByTag.get(canonicalId) ?? {
        type: null,
        note: null,
      },
    );
  }

  return result;
}