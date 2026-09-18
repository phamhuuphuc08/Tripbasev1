import type { ExpenseCategory } from "@/features/budget/categories";

// A fixed, readable palette (not the brand blue, so it stays legible next
// to it) — cycles if there were ever more categories than colors.
const SLICE_COLORS = [
  "oklch(0.65 0.19 25)",
  "oklch(0.7 0.16 145)",
  "oklch(0.62 0.2 300)",
  "oklch(0.75 0.17 80)",
  "oklch(0.6 0.18 220)",
  "oklch(0.68 0.19 350)",
  "oklch(0.55 0.12 250)",
  "oklch(0.8 0.15 100)",
];

export interface BudgetChartSlice {
  category: ExpenseCategory;
  total: number;
}

/**
 * A donut chart built from a single conic-gradient — no charting library.
 * Rule-based rendering only (percentages computed here), matching the
 * project's "no AI, no heavy new dependency for something CSS can do"
 * approach used elsewhere (Map Planner's own distance math, etc.).
 */
export function BudgetChart({
  slices,
  totalLabel,
  categoryLabel,
  formatAmount,
}: {
  slices: BudgetChartSlice[];
  totalLabel: string;
  categoryLabel: (category: ExpenseCategory) => string;
  formatAmount: (value: number) => string;
}) {
  const total = slices.reduce((sum, s) => sum + s.total, 0);
  if (total <= 0) return null;

  // Running cumulative total per slice, without mutating a shared variable
  // across iterations (each entry only reads slices before it).
  const stops = slices.map((slice, index) => {
    const before = slices
      .slice(0, index)
      .reduce((sum, s) => sum + s.total, 0);
    const start = (before / total) * 360;
    const end = ((before + slice.total) / total) * 360;
    const color = SLICE_COLORS[index % SLICE_COLORS.length];
    return `${color} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative size-28 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(", ")})` }}
      >
        <div className="bg-card absolute inset-3 flex flex-col items-center justify-center rounded-full text-center">
          <span className="text-[10px] leading-tight font-medium">
            {totalLabel}
          </span>
          <span className="text-xs leading-tight font-semibold">
            {formatAmount(total)}
          </span>
        </div>
      </div>
      <ul className="flex flex-1 flex-col gap-1 text-xs">
        {slices.map((slice, index) => (
          <li key={slice.category} className="flex items-center gap-1.5">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{
                backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
              }}
            />
            <span className="flex-1">{categoryLabel(slice.category)}</span>
            <span className="text-muted-foreground tabular-nums">
              {Math.round((slice.total / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
