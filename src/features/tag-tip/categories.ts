/**
 * LocationTag.category is a free-text column in Prisma (mục 12 của spec),
 * nhưng UI cần một tập cố định để lookup/filter nhất quán — xem mục 4 "Tag
 * & Tip Library" và mục 8.1. Thêm category mới thì cập nhật cả object này
 * lẫn key dịch trong messages/{vi,en}.json (namespace `tagCategory`).
 */
export const TAG_CATEGORIES = [
  "RESTAURANT",
  "ATTRACTION",
  "HOTEL",
  "CAR_RENTAL",
  "TRANSPORT",
  "SIM",
  "OTHER",
] as const;

export type TagCategory = (typeof TAG_CATEGORIES)[number];

export function isTagCategory(value: unknown): value is TagCategory {
  return (
    typeof value === "string" &&
    (TAG_CATEGORIES as readonly string[]).includes(value)
  );
}

/** LocationTag.category is a nullable free-text column in Prisma — coerce
 * to our fixed UI set, falling back to OTHER for anything unexpected. */
export function toTagCategory(value: string | null | undefined): TagCategory {
  return isTagCategory(value) ? value : "OTHER";
}
