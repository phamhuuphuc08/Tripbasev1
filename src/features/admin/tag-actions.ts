"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import { createAuditLog } from "@/server/admin/audit-log.service";
import {
  approveAdminTag,
  getAdminTag,
  listAdminTags,
  rejectAdminTag,
} from "@/server/admin/tag-admin.service";

export async function listAdminTagsAction(query = "") {
  await requireAdmin();
  return listAdminTags(query);
}

export async function getAdminTagAction(tagId: string) {
  await requireAdmin();
  return getAdminTag(tagId);
}

function revalidateTagAdmin() {
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/tags", "page");
  revalidatePath("/[locale]/admin/tags/[tagId]", "page");
  revalidatePath("/[locale]/admin/audit-logs", "page");
  revalidatePath("/[locale]/tags", "page");
}

export async function approveAdminTagAction(tagId: string) {
  const admin = await requireAdmin();
  const tag = await getAdminTag(tagId);

  await approveAdminTag(tagId);

  await createAuditLog({
    adminId: admin.id,
    action: "TAG_APPROVED",
    targetType: "LOCATION_TAG",
    targetId: tagId,
    description: `Đã duyệt Tag & Tip "${tag?.title || tagId}".`,
    metadata: { tagTitle: tag?.title || null },
  });

  revalidateTagAdmin();
}

export async function rejectAdminTagAction(tagId: string, reviewNote = "") {
  const admin = await requireAdmin();
  const tag = await getAdminTag(tagId);

  await rejectAdminTag(tagId, reviewNote);

  await createAuditLog({
    adminId: admin.id,
    action: "TAG_REJECTED",
    targetType: "LOCATION_TAG",
    targetId: tagId,
    description: reviewNote.trim() || `Đã từ chối Tag & Tip "${tag?.title || tagId}".`,
    metadata: { tagTitle: tag?.title || null, reviewNote: reviewNote.trim() || null },
  });

  revalidateTagAdmin();
}