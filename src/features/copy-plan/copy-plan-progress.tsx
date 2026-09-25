"use client";

import { useActionState } from "react";

import {
  completeCopyPlanAction,
  rateCopyPlanAction,
  type CopyPlanActionState,
} from "@/features/copy-plan/actions";

interface CopyPlanProgressProps {
  tripId: string;
  retentionRate: number | null;
  completed: boolean;
  postTripRating: number | null;
  canManage: boolean;
}

const initialState: CopyPlanActionState = {};

function getErrorMessage(
  error: CopyPlanActionState["error"],
) {
  switch (error) {
    case "NOT_COPY_PLAN":
      return "Chuyến đi này không phải bản sao CopyPlan.";

    case "FORBIDDEN":
      return "Bạn không có quyền thực hiện thao tác này.";

    case "NOT_COMPLETED":
      return "Hãy hoàn thành chuyến đi trước khi đánh giá.";

    case "INVALID_RATING":
      return "Đánh giá phải từ 1 đến 5 sao.";

    case "PLAN_NOT_FOUND":
      return "Không tìm thấy kế hoạch.";

    case "PLAN_NOT_PUBLIC":
      return "Kế hoạch nguồn không còn công khai.";

    case "DAY_NOT_FOUND":
      return "Không tìm thấy ngày được chọn.";

    case "COPY_FAILED":
      return "Có lỗi xảy ra. Vui lòng thử lại.";

    default:
      return null;
  }
}

export function CopyPlanProgress({
  tripId,
  retentionRate,
  completed,
  postTripRating,
  canManage,
}: CopyPlanProgressProps) {
  const completeAction =
    completeCopyPlanAction.bind(
      null,
      tripId,
    );

  const rateAction =
    rateCopyPlanAction.bind(
      null,
      tripId,
    );

  const [
    completeState,
    completeFormAction,
  ] = useActionState(
    completeAction,
    initialState,
  );

  const [
    rateState,
    rateFormAction,
  ] = useActionState(
    rateAction,
    initialState,
  );

  const completeError =
    getErrorMessage(
      completeState.error,
    );

  const rateError =
    getErrorMessage(
      rateState.error,
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Retention Rate */}
      {retentionRate != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground text-sm">
            Giữ lại từ kế hoạch gốc
          </span>

          <span className="font-semibold">
            {Math.round(
              retentionRate * 100,
            )}
            %
          </span>
        </div>
      )}

      {/* Completion */}
      <div className="border-t pt-4">
        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-sm">
            Trạng thái CopyPlan
          </span>

          {completed ? (
            <div className="font-medium">
              ✓ Đã hoàn thành
            </div>
          ) : (
            <>
              <div className="font-medium">
                Chưa hoàn thành
              </div>

              {canManage && (
                <form
                  action={
                    completeFormAction
                  }
                >
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors"
                  >
                    Đánh dấu đã hoàn thành
                  </button>
                </form>
              )}
            </>
          )}

          {completeError && (
            <p className="text-destructive text-sm">
              {completeError}
            </p>
          )}
        </div>
      </div>

      {/* Post-trip Rating */}
      {completed && (
        <div className="border-t pt-4">
          <div className="flex flex-col gap-3">
            <span className="text-muted-foreground text-sm">
              Đánh giá kế hoạch gốc sau chuyến đi
            </span>

            {postTripRating != null && (
              <div className="text-sm">
                Đánh giá của bạn:{" "}
                <span className="font-semibold">
                  {postTripRating}/5 sao
                </span>
              </div>
            )}

            {canManage && (
              <form
                action={rateFormAction}
                className="flex flex-wrap gap-2"
              >
                {[1, 2, 3, 4, 5].map(
                  (rating) => {
                    const selected =
                      postTripRating != null &&
                      rating <= postTripRating;

                    return (
                      <button
                        key={rating}
                        type="submit"
                        name="rating"
                        value={rating}
                        title={`${rating} sao`}
                        className={[
                          "inline-flex h-10 w-10 items-center justify-center rounded-md border text-lg transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted",
                        ].join(" ")}
                      >
                        ★
                      </button>
                    );
                  },
                )}
              </form>
            )}

            {rateError && (
              <p className="text-destructive text-sm">
                {rateError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}