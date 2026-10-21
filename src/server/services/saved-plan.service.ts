import { PlanVisibility } from "@prisma/client";

import {
  findSavedPlan,
  findSavedPlansByUser,
  removeSavedPlan,
  savePlan,
} from "@/server/repositories/saved-plan.repository";
import { findTripById } from "@/server/repositories/trip.repository";

export class SavedPlanError extends Error {
  constructor(
    public code:
      | "PLAN_NOT_FOUND"
      | "PLAN_NOT_PUBLIC"
      | "CANNOT_SAVE_OWN_PLAN",
  ) {
    super(code);
    this.name = "SavedPlanError";
  }
}

/**
 * Danh sách plan đã bookmark của một user.
 *
 * Repository hiện chỉ trả về PUBLIC plan,
 * phù hợp với Saved Library của Marketplace.
 */
export async function listSavedPlans(
  userId: string,
) {
  const savedItems =
    await findSavedPlansByUser(userId);

  return savedItems.map((saved) => {
    const trip = saved.plan;

    return {
      savedId: saved.id,
      savedAt: saved.createdAt,

      id: trip.id,
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate,
      endDate: trip.endDate,
      status: trip.status,
      verifiedByAuthor:
        trip.verifiedByAuthor,

      travelerCount:
        trip.travelerCount,

      budgetTarget:
        trip.budgetTarget == null
          ? null
          : Number(trip.budgetTarget),

      pace: trip.pace,
      travelStyle:
        trip.travelStyle,

      itineraryItemCount:
        trip._count.itineraryItems,

      ownerId:
        trip.owner.id,
      ownerName:
        trip.owner.name,
      ownerImage:
        trip.owner.image ?? null,

      copyplanScore:
        trip.planReputation
          ?.copyplanScore ?? 0,

      eligibleCopyCount:
        trip.planReputation
          ?.eligibleCopyCount ?? 0,

      averageRetentionRate:
        trip.planReputation
          ?.averageRetentionRate ?? 0,

      completionRate:
        trip.planReputation
          ?.completionRate ?? 0,

      averagePostTripRating:
        trip.planReputation
          ?.averagePostTripRating ?? 0,
    };
  });
}

/**
 * Kiểm tra user đã bookmark plan chưa.
 */
export async function isPlanSaved(
  userId: string,
  planId: string,
) {
  if (!userId || !planId) {
    return false;
  }

  const saved =
    await findSavedPlan(
      userId,
      planId,
    );

  return saved !== null;
}

/**
 * Bookmark một plan Marketplace.
 *
 * Hiện tại Saved Library chỉ dành cho PUBLIC plan.
 */
export async function bookmarkPlan(
  userId: string,
  planId: string,
) {
  const trip =
    await findTripById(planId);

  if (!trip) {
    throw new SavedPlanError(
      "PLAN_NOT_FOUND",
    );
  }

  if (
    trip.visibility !==
    PlanVisibility.PUBLIC
  ) {
    throw new SavedPlanError(
      "PLAN_NOT_PUBLIC",
    );
  }

  /*
   * Không bắt buộc phải chặn owner lưu plan của mình.
   *
   * Tuy nhiên với Marketplace, bookmark thường dùng
   * để lưu plan của người khác.
   *
   * Nếu bạn muốn cho phép owner bookmark plan của mình,
   * chỉ cần bỏ block này.
   */
  if (trip.ownerId === userId) {
    throw new SavedPlanError(
      "CANNOT_SAVE_OWN_PLAN",
    );
  }

  return savePlan(
    userId,
    planId,
  );
}

/**
 * Bỏ bookmark.
 *
 * deleteMany trong repository giúp thao tác idempotent:
 * gọi lại nhiều lần cũng không gây lỗi.
 */
export async function unbookmarkPlan(
  userId: string,
  planId: string,
) {
  if (!userId || !planId) {
    return {
      count: 0,
    };
  }

  return removeSavedPlan(
    userId,
    planId,
  );
}

/**
 * Toggle bookmark.
 *
 * Hữu ích cho nút Bookmark trên Explore:
 * - chưa lưu -> save
 * - đã lưu -> remove
 */
export async function toggleSavedPlan(
  userId: string,
  planId: string,
) {
  const existing =
    await findSavedPlan(
      userId,
      planId,
    );

  if (existing) {
    await removeSavedPlan(
      userId,
      planId,
    );

    return {
      saved: false as const,
    };
  }

  await bookmarkPlan(
    userId,
    planId,
  );

  return {
    saved: true as const,
  };
}