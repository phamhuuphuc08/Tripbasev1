import {
  findPublicTripsByDestination,
  findRecentPublicTrips,
} from "@/server/repositories/trip.repository";

export interface TripSearchResult {
  id: string;
  name: string;
  destination: string;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  verifiedByAuthor: boolean;

  ownerId: string;
  ownerName: string;

  copyplanScore: number;
  eligibleCopyCount: number;
  averageRetentionRate: number;
  completionRate: number;
  averagePostTripRating: number;
}

/**
 * Rule-based destination rank.
 *
 * 0 = exact
 * 1 = prefix
 * 2 = substring
 */
function rankMatch(
  destination: string,
  query: string,
): number {
  const d =
    destination.toLowerCase();

  const q =
    query.toLowerCase();

  if (d === q) {
    return 0;
  }

  if (d.startsWith(q)) {
    return 1;
  }

  return 2;
}

/**
 * Chuyển Trip từ repository
 * sang dữ liệu dành cho Explore.
 *
 * Plan chưa được scoring:
 * reputation = null
 *
 * → toàn bộ metric hiển thị = 0.
 */
function mapTripToSearchResult(
  trip: Awaited<
    ReturnType<
      typeof findRecentPublicTrips
    >
  >[number],
): TripSearchResult {
  return {
    id:
      trip.id,

    name:
      trip.name,

    destination:
      trip.destination,

    startDate:
      trip.startDate,

    endDate:
      trip.endDate,

    status:
      trip.status,

    verifiedByAuthor:
      trip.verifiedByAuthor,

    ownerId:
      trip.owner.id,

    ownerName:
      trip.owner.name,

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
}

/**
 * Explore / Marketplace.
 *
 * Không tính Reputation real-time.
 * Chỉ đọc snapshot đã được background
 * scoring lưu trong plan_reputations.
 */
export async function searchPublicTrips(
  rawQuery: string,
): Promise<TripSearchResult[]> {
  const query =
    rawQuery.trim();

  const trips =
    query
      ? await findPublicTripsByDestination(
          query,
        )
      : await findRecentPublicTrips();

  const results =
    trips.map(
      mapTripToSearchResult,
    );

  /*
   * Không tìm kiếm destination:
   *
   * Explore mặc định xếp
   * CopyPlan Score cao nhất trước.
   */
  if (!query) {
    return results.sort(
      (a, b) =>
        b.copyplanScore -
        a.copyplanScore,
    );
  }

  /*
   * Có query:
   *
   * Ưu tiên:
   *
   * 1. Destination exact
   * 2. Destination prefix
   * 3. Destination substring
   *
   * Trong cùng một nhóm:
   * CopyPlan Score cao hơn trước.
   */
  return results
    .map(
      (trip, index) => ({
        trip,
        index,

        rank:
          rankMatch(
            trip.destination,
            query,
          ),
      }),
    )
    .sort(
      (a, b) =>
        a.rank -
          b.rank ||
        b.trip.copyplanScore -
          a.trip.copyplanScore ||
        a.index -
          b.index,
    )
    .map(
      ({ trip }) =>
        trip,
    );
}