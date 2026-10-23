import {
  PlanStatus,
  TravelPace,
} from "@prisma/client";

import {
  countExplorePublicTrips,
  findExplorePublicTrips,
  findPublicTripsByDestination,
  findRecentPublicTrips,
  type ExploreRepositorySort,
} from "@/server/repositories/trip.repository";

export type ExploreSort =
  | "RELEVANCE"
  | "TRUST"
  | "POPULAR"
  | "RATING"
  | "NEWEST";

export interface TripSearchResult {
  id: string;
  name: string;
  destination: string;
  coverImageUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  verifiedByAuthor: boolean;
  createdAt: Date;

  travelerCount: number;
  budgetTarget: number | null;
  pace: string;
  travelStyle: string[];
  itineraryItemCount: number;

  ownerId: string;
  ownerName: string;
  ownerImage: string | null;

  copyplanScore: number;
  eligibleCopyCount: number;
  adjustedCopyVolume: number;
  averageRetentionRate: number;
  completionRate: number;
  averagePostTripRating: number;
  diversityBonus: number;
  decay: number;
  lastCopyAt: Date | null;

  marketplaceRankScore: number;
}

export interface ExploreQuery {
  query?: string;
  destination?: string;
  travelStyles?: string[];
  budgetMin?: number;
  budgetMax?: number;
  pace?: TravelPace | string;
  status?: PlanStatus | string;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  minDays?: number;
  maxDays?: number;
  sort?: ExploreSort;
  page?: number;
  pageSize?: number;
}

export interface ExploreResult {
  items: TripSearchResult[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeRate(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp(value <= 1 ? value * 100 : value, 0, 100);
}

function normalizeRating(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp((value / 5) * 100, 0, 100);
}

function normalizeCopyVolume(eligibleCopyCount: number): number {
  if (!Number.isFinite(eligibleCopyCount) || eligibleCopyCount <= 0) {
    return 0;
  }

  return clamp(
    100 * (1 - Math.exp(-eligibleCopyCount / 5)),
    0,
    100,
  );
}

/**
 * Điểm hiển thị Marketplace.
 * Ranking DB chính vẫn ưu tiên snapshot CopyPlan Score
 * để M10.7 có thể phân trang thật mà không load toàn bộ DB.
 */
function calculateMarketplaceRankScore(input: {
  copyplanScore: number;
  eligibleCopyCount: number;
  averageRetentionRate: number;
  completionRate: number;
  averagePostTripRating: number;
}): number {
  const copyplan = clamp(input.copyplanScore, 0, 100);
  const copyVolume = normalizeCopyVolume(input.eligibleCopyCount);
  const retention = normalizeRate(input.averageRetentionRate);
  const completion = normalizeRate(input.completionRate);
  const rating = normalizeRating(input.averagePostTripRating);

  return round2(
    0.65 * copyplan +
      0.1 * copyVolume +
      0.1 * retention +
      0.1 * completion +
      0.05 * rating,
  );
}

function rankTextMatch(
  trip: Pick<TripSearchResult, "name" | "destination" | "ownerName">,
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;

  const fields = [
    trip.destination,
    trip.name,
    trip.ownerName,
  ].map((value) => value.toLowerCase());

  if (fields.some((value) => value === q)) return 0;
  if (fields.some((value) => value.startsWith(q))) return 1;
  return 2;
}

function parseDate(
  value: Date | string | undefined,
): Date | undefined {
  if (!value) return undefined;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? undefined
      : value;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? undefined
    : parsed;
}

function parsePace(
  value: TravelPace | string | undefined,
): TravelPace | undefined {
  if (!value) return undefined;

  return Object.values(TravelPace).includes(value as TravelPace)
    ? (value as TravelPace)
    : undefined;
}

function parseStatus(
  value: PlanStatus | string | undefined,
): PlanStatus | undefined {
  if (!value) return undefined;

  return Object.values(PlanStatus).includes(value as PlanStatus)
    ? (value as PlanStatus)
    : undefined;
}

function normalizeSort(
  sort: ExploreSort | undefined,
  query: string,
): ExploreSort {
  if (
    sort === "RELEVANCE" ||
    sort === "TRUST" ||
    sort === "POPULAR" ||
    sort === "RATING" ||
    sort === "NEWEST"
  ) {
    return sort;
  }

  return query ? "RELEVANCE" : "TRUST";
}

function toRepositorySort(
  sort: ExploreSort,
): ExploreRepositorySort {
  return sort;
}

type MarketplaceTrip =
  Awaited<ReturnType<typeof findExplorePublicTrips>>[number];

function mapTripToSearchResult(
  trip: MarketplaceTrip,
): TripSearchResult {
  const base = {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    coverImageUrl: trip.coverImageUrl,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
    verifiedByAuthor: trip.verifiedByAuthor,
    createdAt: trip.createdAt,

    travelerCount: trip.travelerCount,
    budgetTarget:
      trip.budgetTarget == null
        ? null
        : Number(trip.budgetTarget),
    pace: trip.pace,
    travelStyle: trip.travelStyle,
    itineraryItemCount: trip._count.itineraryItems,

    ownerId: trip.owner.id,
    ownerName: trip.owner.name,
    ownerImage: trip.owner.image ?? null,

    copyplanScore: trip.planReputation?.copyplanScore ?? 0,
    eligibleCopyCount: trip.planReputation?.eligibleCopyCount ?? 0,
    adjustedCopyVolume: trip.planReputation?.adjustedCopyVolume ?? 0,
    averageRetentionRate: trip.planReputation?.averageRetentionRate ?? 0,
    completionRate: trip.planReputation?.completionRate ?? 0,
    averagePostTripRating:
      trip.planReputation?.averagePostTripRating ?? 0,
    diversityBonus: trip.planReputation?.diversityBonus ?? 0,
    decay: trip.planReputation?.decay ?? 0,
    lastCopyAt: trip.planReputation?.lastCopyAt ?? null,
  };

  return {
    ...base,
    marketplaceRankScore: calculateMarketplaceRankScore(base),
  };
}

function getTripDurationDays(
  trip: Pick<TripSearchResult, "startDate" | "endDate">,
): number | null {
  if (!trip.startDate || !trip.endDate) return null;

  const start = Date.UTC(
    trip.startDate.getUTCFullYear(),
    trip.startDate.getUTCMonth(),
    trip.startDate.getUTCDate(),
  );

  const end = Date.UTC(
    trip.endDate.getUTCFullYear(),
    trip.endDate.getUTCMonth(),
    trip.endDate.getUTCDate(),
  );

  return Math.max(
    1,
    Math.floor((end - start) / 86400000) + 1,
  );
}

function passesDurationFilter(
  trip: TripSearchResult,
  minDays?: number,
  maxDays?: number,
): boolean {
  if (minDays == null && maxDays == null) return true;

  const duration = getTripDurationDays(trip);
  if (duration == null) return false;
  if (minDays != null && duration < minDays) return false;
  if (maxDays != null && duration > maxDays) return false;

  return true;
}

/**
 * RELEVANCE chỉ tinh chỉnh thứ tự trong page hiện tại:
 * exact > prefix > substring.
 *
 * Các sort TRUST/POPULAR/RATING/NEWEST đã được DB sort trước khi paginate.
 */
function refineCurrentPageOrder(
  items: TripSearchResult[],
  sort: ExploreSort,
  query: string,
): TripSearchResult[] {
  if (sort !== "RELEVANCE" || !query) {
    return items;
  }

  return items
    .map((trip, index) => ({
      trip,
      index,
      textRank: rankTextMatch(trip, query),
    }))
    .sort(
      (a, b) =>
        a.textRank - b.textRank ||
        b.trip.copyplanScore - a.trip.copyplanScore ||
        a.index - b.index,
    )
    .map(({ trip }) => trip);
}

/**
 * M10.6 + M10.7
 *
 * - Sort DB-level:
 *   TRUST / POPULAR / RATING / NEWEST
 * - Search relevance:
 *   filter DB + exact/prefix refinement trong page hiện tại
 * - Pagination DB-level bằng skip/take
 * - total dùng COUNT riêng
 *
 * Lưu ý:
 * minDays/maxDays là derived field từ startDate/endDate.
 * Khi dùng filter này, cần scan các record đã qua DB filter để có total chính xác.
 * Không dùng minDays/maxDays thì pagination hoàn toàn DB-level.
 */
export async function listExplorePlans(
  input: ExploreQuery = {},
): Promise<ExploreResult> {
  const query = input.query?.trim() ?? "";
  const destination = input.destination?.trim() ?? "";
  const travelStyles =
    input.travelStyles?.map((value) => value.trim()).filter(Boolean) ?? [];

  const budgetMin =
    input.budgetMin != null && Number.isFinite(input.budgetMin)
      ? Math.max(input.budgetMin, 0)
      : undefined;

  const budgetMax =
    input.budgetMax != null && Number.isFinite(input.budgetMax)
      ? Math.max(input.budgetMax, 0)
      : undefined;

  const pace = parsePace(input.pace);
  const status = parseStatus(input.status);
  const startDateFrom = parseDate(input.startDateFrom);
  const startDateTo = parseDate(input.startDateTo);

  const minDays =
    input.minDays != null && Number.isFinite(input.minDays)
      ? Math.max(Math.floor(input.minDays), 1)
      : undefined;

  const maxDays =
    input.maxDays != null && Number.isFinite(input.maxDays)
      ? Math.max(Math.floor(input.maxDays), 1)
      : undefined;

  const requestedPage = Math.max(Math.floor(input.page ?? 1), 1);
  const pageSize = Math.min(
    Math.max(Math.floor(input.pageSize ?? 12), 1),
    48,
  );

  const sort = normalizeSort(input.sort, query);

  const repositoryInput = {
    query: query || undefined,
    destination: destination || undefined,
    travelStyles: travelStyles.length > 0 ? travelStyles : undefined,
    budgetMin,
    budgetMax,
    pace,
    status,
    startDateFrom,
    startDateTo,
    sort: toRepositorySort(sort),
  };

  /**
   * Derived duration filter:
   * Prisma không có field durationDays.
   * Chỉ ở case này mới cần scan tối đa 500 record đã lọc DB.
   */
  if (minDays != null || maxDays != null) {
    const raw = await findExplorePublicTrips({
      ...repositoryInput,
      skip: 0,
      take: 48,
    });

    /**
     * M10.7 guardrail:
     * Không giả vờ pagination chính xác nếu dataset duration-filter lớn.
     * Với MVP hiện tại, lấy từng batch 48 cho tới khi hết hoặc đủ 500.
     */
    const collected: MarketplaceTrip[] = [...raw];
    let offset = raw.length;

    while (raw.length === 48 && offset < 500) {
      const next = await findExplorePublicTrips({
        ...repositoryInput,
        skip: offset,
        take: Math.min(48, 500 - offset),
      });

      if (next.length === 0) break;

      collected.push(...next);
      offset += next.length;

      if (next.length < 48) break;
    }

    const filtered = collected
      .map(mapTripToSearchResult)
      .filter((trip) =>
        passesDurationFilter(trip, minDays, maxDays),
      );

    const total = filtered.length;
    const totalPages = Math.max(Math.ceil(total / pageSize), 1);
    const page = Math.min(requestedPage, totalPages);
    const start = (page - 1) * pageSize;

    const items = refineCurrentPageOrder(
      filtered.slice(start, start + pageSize),
      sort,
      query,
    );

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  const total = await countExplorePublicTrips(repositoryInput);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const page = Math.min(requestedPage, totalPages);
  const skip = (page - 1) * pageSize;

  const trips = await findExplorePublicTrips({
    ...repositoryInput,
    skip,
    take: pageSize,
  });

  const items = refineCurrentPageOrder(
    trips.map(mapTripToSearchResult),
    sort,
    query,
  );

  return {
    items,
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * API cũ cho Home.
 */
export async function searchPublicTrips(
  rawQuery: string,
): Promise<TripSearchResult[]> {
  const query = rawQuery.trim();

  const trips = query
    ? await findPublicTripsByDestination(query)
    : await findRecentPublicTrips();

  const results = trips.map((trip) =>
    mapTripToSearchResult(trip as MarketplaceTrip),
  );

  if (!query) {
    return results.sort(
      (a, b) =>
        b.copyplanScore - a.copyplanScore ||
        b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  return results
    .map((trip, index) => ({
      trip,
      index,
      rank: rankTextMatch(trip, query),
    }))
    .sort(
      (a, b) =>
        a.rank - b.rank ||
        b.trip.copyplanScore - a.trip.copyplanScore ||
        a.index - b.index,
    )
    .map(({ trip }) => trip);
}
