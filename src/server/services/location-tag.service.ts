import type { TagCategory } from "@/features/tag-tip/categories";
import {
  createLocationTag,
  findLocationTagsByCategory,
  searchLocationTags,
} from "@/server/repositories/location-tag.repository";
import { findPossibleDuplicate } from "@/server/services/tag-dedup.service";

export function searchTags(filter: { query?: string; category?: TagCategory }) {
  return searchLocationTags(filter);
}

export interface CreateTagInput {
  title: string;
  category: TagCategory;
  content: string | null;
  latitude: number | null;
  longitude: number | null;
}

export type CreateTagResult =
  | { status: "created"; tag: Awaited<ReturnType<typeof createLocationTag>> }
  | { status: "duplicate"; suggestion: { id: string; title: string } };

/**
 * mục 8.1 của spec: nếu tên gần giống 1 tag cùng category đã có, gợi ý dùng
 * lại thay vì tạo mới. `force: true` (user vẫn bấm "tạo mới" dù đã cảnh
 * báo) cho tạo nhưng gắn `possibleDuplicateOfId` để Reputation Engine sau
 * này không tính đây là nguồn độc lập khi tính Cross-plan Consistency.
 */
export async function createTagWithDedupCheck(
  ownerId: string,
  input: CreateTagInput,
  force = false,
): Promise<CreateTagResult> {
  const candidates = await findLocationTagsByCategory(input.category);
  const duplicate = findPossibleDuplicate(candidates, input.title);

  if (duplicate && !force) {
    return {
      status: "duplicate",
      suggestion: { id: duplicate.id, title: duplicate.title },
    };
  }

  const tag = await createLocationTag({
    ownerId,
    title: input.title,
    category: input.category,
    content: input.content,
    latitude: input.latitude,
    longitude: input.longitude,
    possibleDuplicateOfId: force && duplicate ? duplicate.id : null,
  });

  return { status: "created", tag };
}
