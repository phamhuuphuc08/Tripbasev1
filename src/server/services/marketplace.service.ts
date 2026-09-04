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
  ownerName: string;
}

/**
 * Rule-based match rank, not AI: exact destination match first, then
 * prefix, then any substring (the DB query already filtered to substring
 * matches — this only decides display order within that set).
 */
function rankMatch(destination: string, query: string): number {
  const d = destination.toLowerCase();
  const q = query.toLowerCase();
  if (d === q) return 0;
  if (d.startsWith(q)) return 1;
  return 2;
}

export async function searchPublicTrips(
  rawQuery: string,
): Promise<TripSearchResult[]> {
  const query = rawQuery.trim();
  const trips = query
    ? await findPublicTripsByDestination(query)
    : await findRecentPublicTrips();

  const results = trips.map((trip) => ({
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    status: trip.status,
    verifiedByAuthor: trip.verifiedByAuthor,
    ownerName: trip.owner.name,
  }));

  if (!query) return results;

  return (
    results
      .map((trip, index) => ({
        trip,
        index,
        rank: rankMatch(trip.destination, query),
      }))
      // Stable sort by rank, keeping DB order (createdAt desc) within a rank.
      .sort((a, b) => a.rank - b.rank || a.index - b.index)
      .map(({ trip }) => trip)
  );
}
