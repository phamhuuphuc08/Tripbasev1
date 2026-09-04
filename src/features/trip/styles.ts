// Fixed, app-level taxonomy for trip-level travel style tags (same "coerce
// at the boundary, no migration to add an option" pattern as
// tag-tip/categories.ts and profile/preferences.ts). This is per-trip
// ("what kind of trip is this"), distinct from the per-person
// User.travelInterests set in src/features/profile/preferences.ts — a
// trip's own style tags and its creator's general interests are different
// things, even where the codes happen to overlap (e.g. FOOD, CULTURE).

export const TRIP_STYLES = ["FOOD", "SHOPPING", "CULTURE", "NATURE"] as const;
export type TripStyle = (typeof TRIP_STYLES)[number];

export function toTripStyles(values: string[]): TripStyle[] {
  return values.filter((value): value is TripStyle =>
    (TRIP_STYLES as readonly string[]).includes(value),
  );
}
