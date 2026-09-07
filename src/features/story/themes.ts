// Fixed gradient palette for Trip Story slides — same app-level union,
// coerce-at-the-boundary pattern used across the app (ExpenseCategory,
// TripStyle, TravelInterest). No AI-generated art here: the owner just
// picks a vibe, we supply the gradient.

export const STORY_THEMES = [
  "SUNSET",
  "OCEAN",
  "FOREST",
  "NIGHT",
  "CANDY",
] as const;
export type StoryTheme = (typeof STORY_THEMES)[number];

export function toStoryTheme(value: string | null): StoryTheme {
  return (STORY_THEMES as readonly string[]).includes(value ?? "")
    ? (value as StoryTheme)
    : "SUNSET";
}

/** Tailwind gradient classes per theme — used behind slides with no photo. */
export const STORY_THEME_GRADIENT: Record<StoryTheme, string> = {
  SUNSET: "from-orange-400 via-rose-500 to-purple-600",
  OCEAN: "from-cyan-400 via-sky-500 to-blue-700",
  FOREST: "from-lime-400 via-emerald-500 to-teal-700",
  NIGHT: "from-slate-700 via-indigo-800 to-slate-950",
  CANDY: "from-pink-400 via-fuchsia-500 to-purple-600",
};

/** Small solid-color swatch shown in the theme picker. */
export const STORY_THEME_SWATCH: Record<StoryTheme, string> = {
  SUNSET: "bg-gradient-to-br from-orange-400 to-purple-600",
  OCEAN: "bg-gradient-to-br from-cyan-400 to-blue-700",
  FOREST: "bg-gradient-to-br from-lime-400 to-teal-700",
  NIGHT: "bg-gradient-to-br from-slate-700 to-slate-950",
  CANDY: "bg-gradient-to-br from-pink-400 to-purple-600",
};
