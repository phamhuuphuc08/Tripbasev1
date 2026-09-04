import { countCommentsByUser } from "@/server/repositories/comment.repository";
import { getTagContributionStats } from "@/server/repositories/location-tag.repository";
import { countTripsByOwner } from "@/server/repositories/trip.repository";
import { findUserById } from "@/server/repositories/user.repository";

export interface CreatorProfile {
  id: string;
  name: string;
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
    memberSince: user.createdAt,
    tripsCreated,
    locationTagsCreated: tagStats.count,
    tagTrustPoints: tagStats.trustPoints,
    commentsMade,
  };
}
