"use server";

import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";

import {
  completeCopyPlan,
  copyPlan,
  copyPlanDay,
  copyPlanDays,
  CopyPlanError,
  rateCopyPlan,
} from "@/server/services/copy-plan.service";

export interface CopyPlanActionState {
  error?:
    | "PLAN_NOT_FOUND"
    | "PLAN_NOT_PUBLIC"
    | "DAY_NOT_FOUND"
    | "NOT_COPY_PLAN"
    | "FORBIDDEN"
    | "NOT_COMPLETED"
    | "INVALID_RATING"
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

/**
 * Sao chép nhiều ngày được chọn
 * trong một lần.
 *
 * Ví dụ:
 *
 * Chọn:
 * - Ngày 1
 * - Ngày 3
 * - Ngày 4
 *
 * Form gửi:
 *
 * days=1
 * days=3
 * days=4
 *
 * Trip mới:
 *
 * Ngày 1 <- Ngày 1 gốc
 * Ngày 2 <- Ngày 3 gốc
 * Ngày 3 <- Ngày 4 gốc
 */
export async function copyPlanDaysAction(
  sourceTripId: string,
  _prevState: CopyPlanActionState,
  formData: FormData,
): Promise<CopyPlanActionState> {
  void _prevState;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  /*
   * Cần đăng nhập vì Trip copy
   * sẽ thuộc về user hiện tại.
   */
  if (!session) {
    const callbackUrl = `/trips/${sourceTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  /*
   * Checkbox nhiều ngày gửi nhiều
   * giá trị cùng tên "days".
   *
   * Ví dụ:
   *
   * days=1
   * days=3
   * days=4
   */
  const sourceDays = formData
    .getAll("days")
    .map((value) =>
      typeof value === "string"
        ? Number(value)
        : Number.NaN,
    )
    .filter(
      (day) =>
        Number.isInteger(day) &&
        day >= 1,
    );

  /*
   * Không chọn ngày nào.
   */
  if (sourceDays.length === 0) {
    return {
      error: "DAY_NOT_FOUND",
    };
  }

  let copiedTrip;

  try {
    copiedTrip = await copyPlanDays(
      sourceTripId,
      session.userId,
      sourceDays,
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
   * Copy thành công →
   * mở Trip mới.
   */
  return redirect({
    href: `/trips/${copiedTrip.id}`,
    locale,
  });
}

/**
 * Đánh dấu CopyPlan đã hoàn thành.
 */
export async function completeCopyPlanAction(
  copiedTripId: string,
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
   * Cần đăng nhập để xác định
   * chủ sở hữu của bản copy.
   */
  if (!session) {
    const callbackUrl = `/trips/${copiedTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  try {
    await completeCopyPlan(
      copiedTripId,
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
   * Reload Trip Detail để UI đọc:
   *
   * completed = true
   * status = COMPLETED
   */
  return redirect({
    href: `/trips/${copiedTripId}`,
    locale,
  });
}

/**
 * Đánh giá CopyPlan sau chuyến đi.
 *
 * Form gửi:
 *
 * rating = 1 | 2 | 3 | 4 | 5
 */
export async function rateCopyPlanAction(
  copiedTripId: string,
  _prevState: CopyPlanActionState,
  formData: FormData,
): Promise<CopyPlanActionState> {
  void _prevState;

  const [session, locale] = await Promise.all([
    getSession(),
    getLocale(),
  ]);

  if (!session) {
    const callbackUrl = `/trips/${copiedTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  const rawRating =
    formData.get("rating");

  const rating =
    typeof rawRating === "string"
      ? Number(rawRating)
      : Number.NaN;

  try {
    await rateCopyPlan(
      copiedTripId,
      session.userId,
      rating,
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
   * Reload lại Trip Detail
   * để hiển thị rating vừa lưu.
   */
  return redirect({
    href: `/trips/${copiedTripId}`,
    locale,
  });
}