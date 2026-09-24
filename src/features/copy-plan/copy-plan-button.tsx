"use client";

import { useActionState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  copyPlanAction,
  copyPlanDayAction,
  type CopyPlanActionState,
} from "@/features/copy-plan/actions";

const initialState: CopyPlanActionState = {};

function getErrorMessage(
  error: CopyPlanActionState["error"],
) {
  switch (error) {
    case "PLAN_NOT_FOUND":
      return "Không tìm thấy kế hoạch cần sao chép.";

    case "PLAN_NOT_PUBLIC":
      return "Kế hoạch này không cho phép sao chép.";

    case "DAY_NOT_FOUND":
      return "Ngày này không có lịch trình để sao chép.";

    case "COPY_FAILED":
      return "Không thể sao chép kế hoạch. Vui lòng thử lại.";

    default:
      return null;
  }
}

/**
 * Sao chép toàn bộ kế hoạch.
 */
export function CopyPlanButton({
  tripId,
}: {
  tripId: string;
}) {
  const action = copyPlanAction.bind(
    null,
    tripId,
  );

  const [state, formAction, pending] =
    useActionState(
      action,
      initialState,
    );

  const errorMessage =
    getErrorMessage(state.error);

  return (
    <div className="flex flex-col gap-2">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={pending}
          className="gap-2"
        >
          <Copy className="size-4" />

          {pending
            ? "Đang sao chép..."
            : "Sao chép kế hoạch"}
        </Button>
      </form>

      {errorMessage && (
        <p
          role="alert"
          className="text-destructive text-sm"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}

/**
 * Sao chép riêng một ngày.
 */
export function CopyPlanDayButton({
  tripId,
  day,
}: {
  tripId: string;
  day: number;
}) {
  const action = copyPlanDayAction.bind(
    null,
    tripId,
    day,
  );

  const [state, formAction, pending] =
    useActionState(
      action,
      initialState,
    );

  const errorMessage =
    getErrorMessage(state.error);

  return (
    <div className="flex flex-col gap-1">
      <form action={formAction}>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={pending}
          className="gap-1.5"
        >
          <Copy className="size-3.5" />

          {pending
            ? "Đang sao chép..."
            : `Sao chép ngày ${day}`}
        </Button>
      </form>

      {errorMessage && (
        <p
          role="alert"
          className="text-destructive text-xs"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}