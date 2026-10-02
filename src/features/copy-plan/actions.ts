"use server";

import { getLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getOrCreateDeviceHash } from "@/server/auth/device";
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

  if (!session) {
    const callbackUrl = `/trips/${sourceTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

  /*
   * Device ID thật không được lưu DB.
   * Chỉ lấy SHA-256 hash.
   */
  const deviceHash =
    await getOrCreateDeviceHash();

  let copiedTrip;

  try {
    copiedTrip = await copyPlan(
      sourceTripId,
      session.userId,
      deviceHash,
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
 * Sao chép riêng một ngày.
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

  const deviceHash =
    await getOrCreateDeviceHash();

  let copiedTrip;

  try {
    copiedTrip = await copyPlanDay(
      sourceTripId,
      session.userId,
      sourceDay,
      deviceHash,
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
 * Sao chép nhiều ngày được chọn.
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

  if (!session) {
    const callbackUrl = `/trips/${sourceTripId}`;

    return redirect({
      href: `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
      locale,
    });
  }

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

  if (sourceDays.length === 0) {
    return {
      error: "DAY_NOT_FOUND",
    };
  }

  const deviceHash =
    await getOrCreateDeviceHash();

  let copiedTrip;

  try {
    copiedTrip = await copyPlanDays(
      sourceTripId,
      session.userId,
      sourceDays,
      deviceHash,
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

  return redirect({
    href: `/trips/${copiedTripId}`,
    locale,
  });
}

/**
 * Đánh giá CopyPlan sau chuyến đi.
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

  return redirect({
    href: `/trips/${copiedTripId}`,
    locale,
  });
}