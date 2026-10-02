import {
  type BudgetLevel,
  type TravelInterest,
  type TravelStyle,
  toBudgetLevel,
  toTravelInterests,
  toTravelStyle,
} from "@/features/profile/preferences";

import { countCommentsByUser } from "@/server/repositories/comment.repository";
import { findCreatorReputationByUserId } from "@/server/repositories/creator-reputation.repository";
import { getTagContributionStats } from "@/server/repositories/location-tag.repository";
import { countTripsByOwner } from "@/server/repositories/trip.repository";

import {
  findUserById,
  updateUserProfile,
} from "@/server/repositories/user.repository";

import {
  deleteAvatarIfLocal,
  saveAvatar,
} from "@/server/storage/avatar";

export class ProfileError extends Error {}

export interface CreatorProfile {
  id: string;
  name: string;

  image: string | null;
  bio: string | null;

  travelStyle:
    | TravelStyle
    | null;

  budgetLevel:
    | BudgetLevel
    | null;

  travelInterests:
    TravelInterest[];

  memberSince: Date;

  /*
   * Contribution stats.
   */
  tripsCreated: number;
  locationTagsCreated: number;
  tagTrustPoints: number;
  commentsMade: number;

  /*
   * M09 Creator Reputation.
   *
   * Đây là snapshot từ
   * creator_reputations.
   */
  copyplanScore: number;

  reputationTotalPlans:
    number;

  reputationTotalCopies:
    number;

  reputationLastUpdated:
    Date | null;
}

/**
 * Public Creator Profile.
 *
 * Contribution count và Reputation
 * đều chỉ đọc dữ liệu đã lưu.
 *
 * Không tính CopyPlan Score real-time
 * khi mở trang profile.
 */
export async function getCreatorProfile(
  userId: string,
): Promise<
  CreatorProfile | null
> {
  const user =
    await findUserById(
      userId,
    );

  if (!user) {
    return null;
  }

  const [
    tripsCreated,
    tagStats,
    commentsMade,
    reputation,
  ] = await Promise.all([
    countTripsByOwner(
      userId,
    ),

    getTagContributionStats(
      userId,
    ),

    countCommentsByUser(
      userId,
    ),

    findCreatorReputationByUserId(
      userId,
    ),
  ]);

  return {
    id:
      user.id,

    name:
      user.name,

    image:
      user.image,

    bio:
      user.bio,

    travelStyle:
      toTravelStyle(
        user.travelStyle,
      ),

    budgetLevel:
      toBudgetLevel(
        user.budgetLevel,
      ),

    travelInterests:
      toTravelInterests(
        user.travelInterests,
      ),

    memberSince:
      user.createdAt,

    tripsCreated,

    locationTagsCreated:
      tagStats.count,

    tagTrustPoints:
      tagStats.trustPoints,

    commentsMade,

    /*
     * Chưa có snapshot
     * → hiển thị score 0.
     */
    copyplanScore:
      reputation
        ?.copyplanScore ?? 0,

    reputationTotalPlans:
      reputation
        ?.totalPlans ?? 0,

    reputationTotalCopies:
      reputation
        ?.totalCopies ?? 0,

    reputationLastUpdated:
      reputation
        ?.lastUpdated ?? null,
  };
}

export interface UpdateProfileInput {
  name: string;

  bio:
    | string
    | null;

  travelStyle:
    | TravelStyle
    | null;

  budgetLevel:
    | BudgetLevel
    | null;

  travelInterests:
    TravelInterest[];

  avatarFile:
    | File
    | null;
}

/**
 * Chỉ chính chủ mới được
 * chỉnh sửa profile.
 */
export async function updateProfile(
  userId: string,
  viewerId: string,
  input: UpdateProfileInput,
): Promise<void> {
  if (
    userId !== viewerId
  ) {
    throw new ProfileError(
      "FORBIDDEN",
    );
  }

  const current =
    await findUserById(
      userId,
    );

  if (!current) {
    throw new ProfileError(
      "NOT_FOUND",
    );
  }

  let image:
    | string
    | undefined;

  if (
    input.avatarFile &&
    input.avatarFile.size > 0
  ) {
    image =
      await saveAvatar(
        userId,
        input.avatarFile,
      );
  }

  await updateUserProfile(
    userId,
    {
      name:
        input.name,

      bio:
        input.bio,

      travelStyle:
        input.travelStyle,

      budgetLevel:
        input.budgetLevel,

      travelInterests:
        input.travelInterests,

      ...(image
        ? {
            image,
          }
        : {}),
    },
  );

  /*
   * Best-effort cleanup.
   *
   * Không để việc xóa avatar cũ
   * làm fail update profile.
   */
  if (image) {
    await deleteAvatarIfLocal(
      current.image,
    );
  }
}