"use server";

import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";

import {
  copyPlan,
  copyPlanDay,
  CopyPlanError,
} from "@/server/services/copy-plan.service";

export interface CopyPlanActionState {
  error?:
    | "PLAN_NOT_FOUND"
    | "PLAN_NOT_PUBLIC"
    | "DAY_NOT_FOUND"
    | "COPY_FAILED";
}

/**
 * Sao chép toàn bộ kế hoạch.
 */
export async function copyPlanAction(
  sourceTripId: string,
  _prevState: CopyPlanActionState,
  _formData: FormData,
): Promise<CopyPlanActionState> {
  void _prevState;
  void _formData;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  /*
   * CopyPlan cần đăng nhập vì Trip mới
   * phải thuộc về một user cụ thể.
   */
  if (!session) {
    const callbackUrl = `/trips/${sourceTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  let copiedTrip;

  try {
    copiedTrip = await copyPlan(
      sourceTripId,
      session.userId,
    );
  } catch (error) {
    if (error instanceof CopyPlanError) {
      return {
        error: error.code,
      };
    }

    return {
      error: "COPY_FAILED",
    };
  }

  /*
   * Copy thành công → mở workspace mới.
   */
  return redirect({
    href: `/trips/${copiedTrip.id}`,
    locale,
  });
}

/**
 * Sao chép riêng một ngày của kế hoạch.
 *
 * Ví dụ:
 * sourceDay = 2
 *
 * Nội dung ngày 2 của Trip gốc
 * sẽ trở thành ngày 1 của Trip mới.
 */
export async function copyPlanDayAction(
  sourceTripId: string,
  sourceDay: number,
  _prevState: CopyPlanActionState,
  _formData: FormData,
): Promise<CopyPlanActionState> {
  void _prevState;
  void _formData;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  if (!session) {
    const callbackUrl = `/trips/${sourceTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  let copiedTrip;

  try {
    copiedTrip = await copyPlanDay(
      sourceTripId,
      session.userId,
      sourceDay,
    );
  } catch (error) {
    if (error instanceof CopyPlanError) {
      return {
        error: error.code,
      };
    }

    return {
      error: "COPY_FAILED",
    };
  }

  return redirect({
    href: `/trips/${copiedTrip.id}`,
    locale,
  });
}