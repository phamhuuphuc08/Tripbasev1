"use server";

import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import {
  addChecklistItem,
  changeChecklistStatus,
  ChecklistError,
  editChecklistItem,
  removeChecklistItem,
} from "@/server/services/checklist.service";

export type ChecklistActionError =
  | "LOGIN_REQUIRED"
  | "TITLE_REQUIRED"
  | "INVALID_ASSIGNEE"
  | "TRIP_NOT_FOUND"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "INVALID_STATUS"
  | "SAVE_FAILED";

export interface ChecklistActionState {
  success?: boolean;
  error?: ChecklistActionError;
}

const itemSchema = z.object({
  title: z.string().trim().min(1),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

function mapError(code: ChecklistError["code"]): ChecklistActionError {
  switch (code) {
    case "TITLE_REQUIRED":
    case "INVALID_ASSIGNEE":
    case "TRIP_NOT_FOUND":
    case "NOT_FOUND":
    case "FORBIDDEN":
      return code;
    default:
      return "SAVE_FAILED";
  }
}

function parseDueDate(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeShareToken(shareToken: string | null) {
  const token = shareToken?.trim();
  return token || null;
}

function checklistHref(tripId: string, shareToken: string | null) {
  const token = normalizeShareToken(shareToken);
  return token
    ? `/trips/${tripId}?shareToken=${encodeURIComponent(token)}#checklist`
    : `/trips/${tripId}#checklist`;
}

export async function addChecklistItemAction(
  tripId: string,
  shareToken: string | null,
  _prevState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate")?.toString(),
    assignedToId: formData.get("assignedToId")?.toString(),
  });

  if (!parsed.success) return { error: "TITLE_REQUIRED" };

  try {
    await addChecklistItem(
      tripId,
      session.userId,
      {
        title: parsed.data.title,
        dueDate: parseDueDate(parsed.data.dueDate),
        assignedToId: parsed.data.assignedToId || null,
      },
      normalizeShareToken(shareToken),
    );
  } catch (error) {
    if (error instanceof ChecklistError) return { error: mapError(error.code) };
    console.error("Failed to add checklist item:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: checklistHref(tripId, shareToken), locale });
}

export async function editChecklistItemAction(
  tripId: string,
  itemId: string,
  shareToken: string | null,
  _prevState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate")?.toString(),
    assignedToId: formData.get("assignedToId")?.toString(),
  });

  if (!parsed.success) return { error: "TITLE_REQUIRED" };

  try {
    await editChecklistItem(
      itemId,
      session.userId,
      {
        title: parsed.data.title,
        dueDate: parseDueDate(parsed.data.dueDate),
        assignedToId: parsed.data.assignedToId || null,
      },
      normalizeShareToken(shareToken),
    );
  } catch (error) {
    if (error instanceof ChecklistError) return { error: mapError(error.code) };
    console.error("Failed to edit checklist item:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: checklistHref(tripId, shareToken), locale });
}

export async function changeChecklistStatusAction(
  tripId: string,
  itemId: string,
  status: "PENDING" | "DONE",
  shareToken: string | null,
  _prevState: ChecklistActionState,
  _formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  if (status !== "PENDING" && status !== "DONE") {
    return { error: "INVALID_STATUS" };
  }

  try {
    await changeChecklistStatus(
      itemId,
      session.userId,
      status,
      normalizeShareToken(shareToken),
    );
  } catch (error) {
    if (error instanceof ChecklistError) return { error: mapError(error.code) };
    console.error("Failed to change checklist status:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: checklistHref(tripId, shareToken), locale });
}

export async function removeChecklistItemAction(
  tripId: string,
  itemId: string,
  shareToken: string | null,
  _prevState: ChecklistActionState,
  _formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  try {
    await removeChecklistItem(
      itemId,
      session.userId,
      normalizeShareToken(shareToken),
    );
  } catch (error) {
    if (error instanceof ChecklistError) return { error: mapError(error.code) };
    console.error("Failed to remove checklist item:", error);
    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();
  return redirect({ href: checklistHref(tripId, shareToken), locale });
}