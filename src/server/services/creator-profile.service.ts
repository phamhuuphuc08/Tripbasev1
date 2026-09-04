import {
  type BudgetLevel,
  type TravelInterest,
  type TravelStyle,
  toBudgetLevel,
  toTravelInterests,
  toTravelStyle,
} from "@/features/profile/preferences";
import { countCommentsByUser } from "@/server/repositories/comment.repository";
import { getTagContributionStats } from "@/server/repositories/location-tag.repository";
import { countTripsByOwner } from "@/server/repositories/trip.repository";
import {
  findUserById,
  updateUserProfile,
} from "@/server/repositories/user.repository";
import { deleteAvatarIfLocal, saveAvatar } from "@/server/storage/avatar";

export class ProfileError extends Error {}

export interface CreatorProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  travelStyle: TravelStyle | null;
  budgetLevel: BudgetLevel | null;
  travelInterests: TravelInterest[];
  memberSince: Date;
  tripsCreated: number;
  locationTagsCreated: number;
  tagTrustPoints: number;
  commentsMade: number;
}

/**
 * Public-safe contribution summary for a creator's profile card (mục 9's
 * "reputation" surface, phase 1 — real counts only). This is deliberately
 * NOT the CopyPlan Score / weighted Cite Trust Score from mục 7-8: those
 * need the full Reputation Engine (M09, background scoring job) which
 * hasn't been built. `tagTrustPoints` here is a plain sum of the
 * `citeTrustScore` already stored on each of the user's tags.
 */
export async function getCreatorProfile(
  userId: string,
): Promise<CreatorProfile | null> {
  const user = await findUserById(userId);
  if (!user) return null;

  const [tripsCreated, tagStats, commentsMade] = await Promise.all([
    countTripsByOwner(userId),
    getTagContributionStats(userId),
    countCommentsByUser(userId),
  ]);

  return {
    id: user.id,
    name: user.name,
    image: user.image,
    bio: user.bio,
    travelStyle: toTravelStyle(user.travelStyle),
    budgetLevel: toBudgetLevel(user.budgetLevel),
    travelInterests: toTravelInterests(user.travelInterests),
    memberSince: user.createdAt,
    tripsCreated,
    locationTagsCreated: tagStats.count,
    tagTrustPoints: tagStats.trustPoints,
    commentsMade,
  };
}

export interface UpdateProfileInput {
  name: string;
  bio: string | null;
  travelStyle: TravelStyle | null;
  budgetLevel: BudgetLevel | null;
  travelInterests: TravelInterest[];
  avatarFile: File | null;
}

/**
 * Only the profile's own owner may edit it — `viewerId` is the logged-in
 * user making the request, `userId` is whose profile is being edited.
 */
export async function updateProfile(
  userId: string,
  viewerId: string,
  input: UpdateProfileInput,
): Promise<void> {
  if (userId !== viewerId) throw new ProfileError("FORBIDDEN");

  const current = await findUserById(userId);
  if (!current) throw new ProfileError("NOT_FOUND");

  let image: string | undefined;
  if (input.avatarFile && input.avatarFile.size > 0) {
    image = await saveAvatar(userId, input.avatarFile);
  }

  await updateUserProfile(userId, {
    name: input.name,
    bio: input.bio,
    travelStyle: input.travelStyle,
    budgetLevel: input.budgetLevel,
    travelInterests: input.travelInterests,
    ...(image ? { image } : {}),
  });

  // Best-effort cleanup, after the DB write succeeds — never block or fail
  // the profile update over a stray file on disk.
  if (image) {
    await deleteAvatarIfLocal(current.image);
  }
}
