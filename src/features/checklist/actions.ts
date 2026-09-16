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

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

export async function addChecklistItemAction(
  tripId: string,
  _prevState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate")?.toString(),
    assignedToId: formData.get("assignedToId")?.toString(),
  });

  if (!parsed.success) {
    return { error: "TITLE_REQUIRED" };
  }

  try {
    await addChecklistItem(
      tripId,
      session.userId,
      {
        title: parsed.data.title,
        dueDate: parseDueDate(parsed.data.dueDate),
        assignedToId:
          parsed.data.assignedToId || null,
      },
    );
  } catch (error) {
    if (error instanceof ChecklistError) {
      return {
        error: mapError(error.code),
      };
    }

    console.error(
      "Failed to add checklist item:",
      error,
    );

    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}#checklist`,
    locale,
  });
}

export async function editChecklistItemAction(
  tripId: string,
  itemId: string,
  _prevState: ChecklistActionState,
  formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  const parsed = itemSchema.safeParse({
    title: formData.get("title"),
    dueDate: formData.get("dueDate")?.toString(),
    assignedToId: formData
      .get("assignedToId")
      ?.toString(),
  });

  if (!parsed.success) {
    return { error: "TITLE_REQUIRED" };
  }

  try {
    await editChecklistItem(
      itemId,
      session.userId,
      {
        title: parsed.data.title,
        dueDate: parseDueDate(
          parsed.data.dueDate,
        ),
        assignedToId:
          parsed.data.assignedToId || null,
      },
    );
  } catch (error) {
    if (error instanceof ChecklistError) {
      return {
        error: mapError(error.code),
      };
    }

    console.error(
      "Failed to edit checklist item:",
      error,
    );

    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}#checklist`,
    locale,
  });
}

export async function changeChecklistStatusAction(
  tripId: string,
  itemId: string,
  status: "PENDING" | "DONE",
  _prevState: ChecklistActionState,
  _formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  if (
    status !== "PENDING" &&
    status !== "DONE"
  ) {
    return {
      error: "INVALID_STATUS",
    };
  }

  try {
    await changeChecklistStatus(
      itemId,
      session.userId,
      status,
    );
  } catch (error) {
    if (error instanceof ChecklistError) {
      return {
        error: mapError(error.code),
      };
    }

    console.error(
      "Failed to change checklist status:",
      error,
    );

    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}#checklist`,
    locale,
  });
}

export async function removeChecklistItemAction(
  tripId: string,
  itemId: string,
  _prevState: ChecklistActionState,
  _formData: FormData,
): Promise<ChecklistActionState> {
  const session = await getSession();

  if (!session) {
    return { error: "LOGIN_REQUIRED" };
  }

  try {
    await removeChecklistItem(
      itemId,
      session.userId,
    );
  } catch (error) {
    if (error instanceof ChecklistError) {
      return {
        error: mapError(error.code),
      };
    }

    console.error(
      "Failed to remove checklist item:",
      error,
    );

    return { error: "SAVE_FAILED" };
  }

  const locale = await getLocale();

  return redirect({
    href: `/trips/${tripId}#checklist`,
    locale,
  });
}