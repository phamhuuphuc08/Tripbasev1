"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/server/admin/admin-auth";
import {
  approveAdminTag,
  getAdminTag,
  listAdminTags,
  rejectAdminTag,
} from "@/server/admin/tag-admin.service";

export async function listAdminTagsAction(
  query = "",
) {
  await requireAdmin();

  return listAdminTags(query);
}

export async function getAdminTagAction(
  tagId: string,
) {
  await requireAdmin();

  return getAdminTag(tagId);
}

export async function approveAdminTagAction(
  tagId: string,
) {
  await requireAdmin();

  await approveAdminTag(tagId);

  revalidatePath(
    "/[locale]/admin/tags",
    "page",
  );

  revalidatePath(
    "/[locale]/tags",
    "page",
  );
}

export async function rejectAdminTagAction(
  tagId: string,
) {
  await requireAdmin();

  await rejectAdminTag(tagId);

  revalidatePath(
    "/[locale]/admin/tags",
    "page",
  );

  revalidatePath(
    "/[locale]/tags",
    "page",
  );
}