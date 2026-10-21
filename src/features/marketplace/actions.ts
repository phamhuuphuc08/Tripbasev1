"use server";

import { revalidatePath } from "next/cache";

import { getSession } from "@/server/auth/session";
import {
  bookmarkPlan,
  SavedPlanError,
  toggleSavedPlan,
  unbookmarkPlan,
} from "@/server/services/saved-plan.service";

export interface SavedPlanActionState {
  success?: boolean;
  saved?: boolean;

  error?:
    | "LOGIN_REQUIRED"
    | "PLAN_NOT_FOUND"
    | "PLAN_NOT_PUBLIC"
    | "CANNOT_SAVE_OWN_PLAN"
    | "SAVE_FAILED";
}

function revalidateSavedPlanPages(
  planId: string,
) {
  revalidatePath("/saved");
  revalidatePath("/explore");
  revalidatePath(`/trips/${planId}`);
}

/**
 * Lưu plan vào Saved Library.
 */
export async function savePlanAction(
  planId: string,
): Promise<SavedPlanActionState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "LOGIN_REQUIRED",
    };
  }

  if (!planId?.trim()) {
    return {
      error: "PLAN_NOT_FOUND",
    };
  }

  try {
    await bookmarkPlan(
      session.userId,
      planId,
    );

    revalidateSavedPlanPages(planId);

    return {
      success: true,
      saved: true,
    };
  } catch (error) {
    if (error instanceof SavedPlanError) {
      switch (error.code) {
        case "PLAN_NOT_FOUND":
          return {
            error: "PLAN_NOT_FOUND",
          };

        case "PLAN_NOT_PUBLIC":
          return {
            error: "PLAN_NOT_PUBLIC",
          };

        case "CANNOT_SAVE_OWN_PLAN":
          return {
            error: "CANNOT_SAVE_OWN_PLAN",
          };
      }
    }

    console.error(
      "[savePlanAction]",
      error,
    );

    return {
      error: "SAVE_FAILED",
    };
  }
}

/**
 * Bỏ plan khỏi Saved Library.
 */
export async function unsavePlanAction(
  planId: string,
): Promise<SavedPlanActionState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "LOGIN_REQUIRED",
    };
  }

  if (!planId?.trim()) {
    return {
      error: "PLAN_NOT_FOUND",
    };
  }

  try {
    await unbookmarkPlan(
      session.userId,
      planId,
    );

    revalidateSavedPlanPages(planId);

    return {
      success: true,
      saved: false,
    };
  } catch (error) {
    console.error(
      "[unsavePlanAction]",
      error,
    );

    return {
      error: "SAVE_FAILED",
    };
  }
}

/**
 * Toggle bookmark.
 *
 * Dùng cho nút bookmark trên Explore:
 *
 * chưa lưu -> lưu
 * đã lưu   -> bỏ lưu
 */
export async function toggleSavedPlanAction(
  planId: string,
): Promise<SavedPlanActionState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "LOGIN_REQUIRED",
    };
  }

  if (!planId?.trim()) {
    return {
      error: "PLAN_NOT_FOUND",
    };
  }

  try {
    const result =
      await toggleSavedPlan(
        session.userId,
        planId,
      );

    revalidateSavedPlanPages(planId);

    return {
      success: true,
      saved: result.saved,
    };
  } catch (error) {
    if (error instanceof SavedPlanError) {
      switch (error.code) {
        case "PLAN_NOT_FOUND":
          return {
            error: "PLAN_NOT_FOUND",
          };

        case "PLAN_NOT_PUBLIC":
          return {
            error: "PLAN_NOT_PUBLIC",
          };

        case "CANNOT_SAVE_OWN_PLAN":
          return {
            error: "CANNOT_SAVE_OWN_PLAN",
          };
      }
    }

    console.error(
      "[toggleSavedPlanAction]",
      error,
    );

    return {
      error: "SAVE_FAILED",
    };
  }
}