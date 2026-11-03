import { toTagCategory, type TagCategory } from "@/features/tag-tip/categories";

import { getAdminSettings } from "@/server/admin/settings.service";
import {
  createLocationTag,
  findAllLocationTagsForPicker,
  findLocationTagById,
  findLocationTagsByCategory,
  searchLocationTags,
} from "@/server/repositories/location-tag.repository";
import { prisma } from "@/server/db/client";
import { findPossibleDuplicate } from "@/server/services/tag-dedup.service";
import { assertCanCreateTag } from "@/server/services/user-restriction.service";

const OPENING_HOURS_RE = /^([01]\d|2[0-3]):([0-5]\d)-([01]\d|2[0-3]):([0-5]\d)$/;

export function searchTags(filter: { query?: string; category?: TagCategory }) {
  return searchLocationTags(filter);
}

export function getLocationTag(id: string) {
  return findLocationTagById(id);
}

/** Dùng cho picker khi thêm địa điểm vào itinerary. */
export async function listTagsForPicker() {
  const tags = await findAllLocationTagsForPicker();

  return tags.map((tag) => ({
    id: tag.id,
    title: tag.title,
    category: toTagCategory(tag.category),
    openingHours: tag.openingHours,
    latitude: tag.latitude,
    longitude: tag.longitude,
    citeTrustScore: tag.citeTrustScore,
    possibleDuplicateOfId: tag.possibleDuplicateOfId,
  }));
}

export interface CreateTagInput {
  title: string;
  category: TagCategory;
  content: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: string | null;
}

export type CreateTagResult =
  | { status: "created"; tag: Awaited<ReturnType<typeof createLocationTag>> }
  | { status: "duplicate"; suggestion: { id: string; title: string } };

export function normalizeOpeningHours(value: string | null | undefined): string | null {
  const normalized = value?.trim() ?? "";
  if (!normalized) return null;

  if (!OPENING_HOURS_RE.test(normalized)) {
    throw new Error("OPENING_HOURS_INVALID");
  }

  return normalized;
}

function getStartOfToday() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

/**
 * Rule-based dedup:
 * - tìm tag gần giống trong cùng category
 * - nếu phát hiện trùng và force=false -> gợi ý dùng tag cũ
 * - nếu force=true -> vẫn tạo nhưng gắn possibleDuplicateOfId
 */
export async function createTagWithDedupCheck(
  ownerId: string,
  input: CreateTagInput,
  force = false,
): Promise<CreateTagResult> {
  await assertCanCreateTag(ownerId);

  const settings = await getAdminSettings();

  const tagsCreatedToday = await prisma.locationTag.count({
    where: {
      ownerId,
      createdAt: { gte: getStartOfToday() },
    },
  });

  if (tagsCreatedToday >= settings.maxTagsPerDay) {
    throw new Error("TAG_DAILY_LIMIT_REACHED");
  }

  const title = input.title.trim();
  if (!title) throw new Error("TITLE_REQUIRED");

  const openingHours = normalizeOpeningHours(input.openingHours);
  const candidates = await findLocationTagsByCategory(input.category);
  const duplicate = findPossibleDuplicate(candidates, title);

  if (duplicate && !force) {
    return {
      status: "duplicate",
      suggestion: {
        id: duplicate.id,
        title: duplicate.title,
      },
    };
  }

  const tag = await createLocationTag({
    ownerId,
    title,
    category: input.category,
    content: input.content?.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    openingHours,
    possibleDuplicateOfId: force && duplicate ? duplicate.id : null,
    approvalStatus: settings.tagApprovalRequired ? "PENDING" : "APPROVED",
  });

  return { status: "created", tag };
}
