// Fixed, app-level taxonomies for travel preferences — rule-based lookup
// values (same pattern as tag-tip/categories.ts), not free text. This is
// intentionally the full extent of "matching/suggestion" for now: just
// structured data collection. No matching or suggestion algorithm reads
// these yet — see docs/spec-dev-plan.md M09 for what's deferred.

export const TRAVEL_INTERESTS = [
  "BEACH",
  "MOUNTAIN",
  "CITY",
  "FOOD",
  "CULTURE",
  "ADVENTURE",
  "NIGHTLIFE",
  "RELAXATION",
  "PHOTOGRAPHY",
  "BUDGET_TRAVEL",
] as const;
export type TravelInterest = (typeof TRAVEL_INTERESTS)[number];

export function isTravelInterest(value: unknown): value is TravelInterest {
  return (
    typeof value === "string" &&
    (TRAVEL_INTERESTS as readonly string[]).includes(value)
  );
}

export const TRAVEL_STYLES = [
  "SOLO",
  "COUPLE",
  "FAMILY",
  "GROUP",
  "BACKPACKER",
] as const;
export type TravelStyle = (typeof TRAVEL_STYLES)[number];

export function toTravelStyle(value: string | null): TravelStyle | null {
  return (TRAVEL_STYLES as readonly string[]).includes(value ?? "")
    ? (value as TravelStyle)
    : null;
}

export const BUDGET_LEVELS = ["BUDGET", "MID_RANGE", "LUXURY"] as const;
export type BudgetLevel = (typeof BUDGET_LEVELS)[number];

export function toBudgetLevel(value: string | null): BudgetLevel | null {
  return (BUDGET_LEVELS as readonly string[]).includes(value ?? "")
    ? (value as BudgetLevel)
    : null;
}

/** Filters arbitrary DB strings down to known interest codes. */
export function toTravelInterests(values: string[]): TravelInterest[] {
  return values.filter(isTravelInterest);
}
