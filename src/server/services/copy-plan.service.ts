import {
  PlanStatus,
  PlanVisibility,
} from "@prisma/client";
import { prisma } from "@/server/db/client";

export class CopyPlanError extends Error {
  constructor(
    public code:
      | "PLAN_NOT_FOUND"
      | "PLAN_NOT_PUBLIC"
      | "DAY_NOT_FOUND"
      | "NOT_COPY_PLAN"
      | "FORBIDDEN"
      | "NOT_COMPLETED"
      | "INVALID_RATING"
      | "COPY_FAILED",
  ) {
    super(code);
    this.name = "CopyPlanError";
  }
}

/**
 * Sao chép toàn bộ Public Plan.
 */
export async function copyPlan(
  sourceTripId: string,
  copierUserId: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const source = await tx.trip.findUnique({
        where: {
          id: sourceTripId,
        },
        include: {
          itineraryItems: {
            orderBy: [
              {
                day: "asc",
              },
              {
                sortOrder: "asc",
              },
            ],
          },
        },
      });

      if (!source) {
        throw new CopyPlanError(
          "PLAN_NOT_FOUND",
        );
      }

      if (
        source.visibility !==
        PlanVisibility.PUBLIC
      ) {
        throw new CopyPlanError(
          "PLAN_NOT_PUBLIC",
        );
      }

      const copiedTrip =
        await tx.trip.create({
          data: {
            name: source.name,
            destination:
              source.destination,

            startDate:
              source.startDate,
            endDate:
              source.endDate,

            currency:
              source.currency,

            ownerId:
              copierUserId,

            /*
             * Bản copy trở thành
             * workspace riêng.
             */
            visibility:
              PlanVisibility.PRIVATE,

            status:
              PlanStatus.IDEA,

            verifiedByAuthor:
              false,

            travelerCount:
              source.travelerCount,

            budgetTarget:
              source.budgetTarget,

            pace:
              source.pace,

            travelStyle:
              source.travelStyle,

            /*
             * Giữ nguồn gốc
             * của plan.
             */
            forkedFromPlanId:
              source.id,
          },
        });

      /*
       * Sao chép toàn bộ itinerary.
       *
       * copiedFromItemId dùng
       * để tính Retention Rate.
       */
      if (
        source.itineraryItems.length > 0
      ) {
        await tx.itineraryItem.createMany({
          data:
            source.itineraryItems.map(
              (item) => ({
                tripId:
                  copiedTrip.id,

                copiedFromItemId:
                  item.id,

                day:
                  item.day,

                title:
                  item.title,

                startTime:
                  item.startTime,

                endTime:
                  item.endTime,

                placeId:
                  item.placeId,

                locationTagId:
                  item.locationTagId,

                notes:
                  item.notes,

                sortOrder:
                  item.sortOrder,
              }),
            ),
        });
      }

      /*
       * Ghi nhận CopyPlan.
       */
      await tx.planCopy.create({
        data: {
          planId:
            copiedTrip.id,

          originalPlanId:
            source.id,

          copierUserId,

          initialItemCount:
            source.itineraryItems.length,

          retentionRate:
            source.itineraryItems.length > 0
              ? 1
              : null,

          completed: false,
          postTripRating: null,
        },
      });

      return copiedTrip;
    });
  } catch (error) {
    if (
      error instanceof CopyPlanError
    ) {
      throw error;
    }

    throw new CopyPlanError(
      "COPY_FAILED",
    );
  }
}

/**
 * Sao chép riêng một ngày
 * của Public Plan.
 */
export async function copyPlanDay(
  sourceTripId: string,
  copierUserId: string,
  sourceDay: number,
) {
  if (
    !Number.isInteger(sourceDay) ||
    sourceDay < 1
  ) {
    throw new CopyPlanError(
      "DAY_NOT_FOUND",
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const source =
          await tx.trip.findUnique({
            where: {
              id: sourceTripId,
            },

            include: {
              itineraryItems: {
                where: {
                  day: sourceDay,
                },

                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          });

        if (!source) {
          throw new CopyPlanError(
            "PLAN_NOT_FOUND",
          );
        }

        if (
          source.visibility !==
          PlanVisibility.PUBLIC
        ) {
          throw new CopyPlanError(
            "PLAN_NOT_PUBLIC",
          );
        }

        if (
          source.itineraryItems.length === 0
        ) {
          throw new CopyPlanError(
            "DAY_NOT_FOUND",
          );
        }

        /*
         * Xác định ngày thực
         * của ngày được chọn.
         */
        let selectedDate:
          | Date
          | null = null;

        if (source.startDate) {
          selectedDate = new Date(
            Date.UTC(
              source.startDate.getUTCFullYear(),
              source.startDate.getUTCMonth(),
              source.startDate.getUTCDate() +
                sourceDay -
                1,
            ),
          );
        }

        const copiedTrip =
          await tx.trip.create({
            data: {
              name:
                `${source.name} · Ngày ${sourceDay}`,

              destination:
                source.destination,

              startDate:
                selectedDate,

              endDate:
                selectedDate,

              currency:
                source.currency,

              ownerId:
                copierUserId,

              visibility:
                PlanVisibility.PRIVATE,

              status:
                PlanStatus.IDEA,

              verifiedByAuthor:
                false,

              travelerCount:
                source.travelerCount,

              /*
               * Không lấy ngân sách
               * toàn Trip cho bản
               * copy một ngày.
               */
              budgetTarget:
                null,

              pace:
                source.pace,

              travelStyle:
                source.travelStyle,

              forkedFromPlanId:
                source.id,
            },
          });

        await tx.itineraryItem.createMany({
          data:
            source.itineraryItems.map(
              (item) => ({
                tripId:
                  copiedTrip.id,

                copiedFromItemId:
                  item.id,

                /*
                 * Ngày được chọn
                 * trở thành Ngày 1.
                 */
                day: 1,

                title:
                  item.title,

                startTime:
                  item.startTime,

                endTime:
                  item.endTime,

                placeId:
                  item.placeId,

                locationTagId:
                  item.locationTagId,

                notes:
                  item.notes,

                sortOrder:
                  item.sortOrder,
              }),
            ),
        });

        await tx.planCopy.create({
          data: {
            planId:
              copiedTrip.id,

            originalPlanId:
              source.id,

            copierUserId,

            initialItemCount:
              source.itineraryItems.length,

            retentionRate: 1,

            completed: false,
            postTripRating: null,
          },
        });

        return copiedTrip;
      },
    );
  } catch (error) {
    if (
      error instanceof CopyPlanError
    ) {
      throw error;
    }

    throw new CopyPlanError(
      "COPY_FAILED",
    );
  }
}

/**
 * Tính lại Retention Rate
 * của một Trip được tạo từ CopyPlan.
 *
 * retained original items
 * -----------------------
 * initial copied items
 */
export async function recalculateCopyPlanRetentionRate(
  copiedTripId: string,
) {
  const planCopy =
    await prisma.planCopy.findUnique({
      where: {
        planId:
          copiedTripId,
      },

      select: {
        id: true,
        initialItemCount:
          true,
      },
    });

  /*
   * Trip bình thường,
   * không phải CopyPlan.
   */
  if (!planCopy) {
    return null;
  }

  /*
   * Không có item ban đầu
   * thì chưa có Retention Rate.
   */
  if (
    planCopy.initialItemCount <= 0
  ) {
    await prisma.planCopy.update({
      where: {
        id: planCopy.id,
      },

      data: {
        retentionRate:
          null,
      },
    });

    return null;
  }

  /*
   * Activity do user tự thêm có
   * copiedFromItemId = null
   * nên không làm tăng retention.
   */
  const retainedItemCount =
    await prisma.itineraryItem.count({
      where: {
        tripId:
          copiedTripId,

        copiedFromItemId: {
          not: null,
        },
      },
    });

  const retentionRate =
    Math.max(
      0,
      Math.min(
        1,
        retainedItemCount /
          planCopy.initialItemCount,
      ),
    );

  await prisma.planCopy.update({
    where: {
      id: planCopy.id,
    },

    data: {
      retentionRate,
    },
  });

  return retentionRate;
}

/**
 * Đánh dấu một CopyPlan
 * đã được hoàn thành.
 *
 * Chỉ người đã copy / chủ sở hữu
 * Trip copy mới được thao tác.
 */
export async function completeCopyPlan(
  copiedTripId: string,
  userId: string,
) {
  const planCopy =
    await prisma.planCopy.findUnique({
      where: {
        planId:
          copiedTripId,
      },

      select: {
        id: true,
        copierUserId:
          true,
        completed:
          true,

        plan: {
          select: {
            id: true,
            ownerId: true,
          },
        },
      },
    });

  if (!planCopy) {
    throw new CopyPlanError(
      "NOT_COPY_PLAN",
    );
  }

  if (
    planCopy.copierUserId !== userId ||
    planCopy.plan.ownerId !== userId
  ) {
    throw new CopyPlanError(
      "FORBIDDEN",
    );
  }

  /*
   * Đã complete rồi thì trả lại
   * trạng thái hiện tại.
   * Không cần tạo lỗi.
   */
  if (planCopy.completed) {
    return prisma.planCopy.findUnique({
      where: {
        id: planCopy.id,
      },
    });
  }

  /*
   * Khi user đánh dấu CopyPlan
   * hoàn thành:
   *
   * - PlanCopy.completed = true
   * - Trip.status = COMPLETED
   */
  return prisma.$transaction(
    async (tx) => {
      await tx.trip.update({
        where: {
          id: copiedTripId,
        },

        data: {
          status:
            PlanStatus.COMPLETED,
        },
      });

      return tx.planCopy.update({
        where: {
          id: planCopy.id,
        },

        data: {
          completed: true,
        },
      });
    },
  );
}

/**
 * Đánh giá kế hoạch gốc
 * sau khi Trip copy đã hoàn thành.
 *
 * Rating: 1 → 5.
 */
export async function rateCopyPlan(
  copiedTripId: string,
  userId: string,
  rating: number,
) {
  /*
   * Chỉ cho phép:
   * 1, 2, 3, 4 hoặc 5.
   */
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new CopyPlanError(
      "INVALID_RATING",
    );
  }

  const planCopy =
    await prisma.planCopy.findUnique({
      where: {
        planId:
          copiedTripId,
      },

      select: {
        id: true,
        copierUserId:
          true,
        completed:
          true,

        plan: {
          select: {
            ownerId:
              true,
          },
        },
      },
    });

  if (!planCopy) {
    throw new CopyPlanError(
      "NOT_COPY_PLAN",
    );
  }

  if (
    planCopy.copierUserId !== userId ||
    planCopy.plan.ownerId !== userId
  ) {
    throw new CopyPlanError(
      "FORBIDDEN",
    );
  }

  /*
   * Chỉ được đánh giá
   * sau khi chuyến đi hoàn thành.
   */
  if (!planCopy.completed) {
    throw new CopyPlanError(
      "NOT_COMPLETED",
    );
  }

  /*
   * Cho phép cập nhật lại rating
   * nếu user đổi đánh giá.
   */
  return prisma.planCopy.update({
    where: {
      id: planCopy.id,
    },

    data: {
      postTripRating:
        rating,
    },
  });
}
/**
 * Sao chép nhiều ngày được chọn
 * từ một Public Plan.
 *
 * Ví dụ:
 * sourceDays = [1, 3, 4]
 *
 * Trip mới:
 * Ngày 1 <- Ngày 1 gốc
 * Ngày 2 <- Ngày 3 gốc
 * Ngày 3 <- Ngày 4 gốc
 */
export async function copyPlanDays(
  sourceTripId: string,
  copierUserId: string,
  sourceDays: number[],
) {
  /*
   * Chuẩn hóa:
   * - chỉ nhận số nguyên >= 1
   * - loại ngày trùng
   * - sắp xếp tăng dần
   */
  const normalizedDays = [
    ...new Set(
      sourceDays.filter(
        (day) =>
          Number.isInteger(day) &&
          day >= 1,
      ),
    ),
  ].sort((a, b) => a - b);

  if (normalizedDays.length === 0) {
    throw new CopyPlanError(
      "DAY_NOT_FOUND",
    );
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const source =
          await tx.trip.findUnique({
            where: {
              id: sourceTripId,
            },

            include: {
              itineraryItems: {
                where: {
                  day: {
                    in: normalizedDays,
                  },
                },

                orderBy: [
                  {
                    day: "asc",
                  },
                  {
                    sortOrder: "asc",
                  },
                ],
              },
            },
          });

        if (!source) {
          throw new CopyPlanError(
            "PLAN_NOT_FOUND",
          );
        }

        if (
          source.visibility !==
          PlanVisibility.PUBLIC
        ) {
          throw new CopyPlanError(
            "PLAN_NOT_PUBLIC",
          );
        }

        /*
         * Kiểm tra từng ngày được chọn
         * có itinerary hay không.
         */
        const foundDays = new Set(
          source.itineraryItems.map(
            (item) => item.day,
          ),
        );

        const hasMissingDay =
          normalizedDays.some(
            (day) =>
              !foundDays.has(day),
          );

        if (
          source.itineraryItems.length ===
            0 ||
          hasMissingDay
        ) {
          throw new CopyPlanError(
            "DAY_NOT_FOUND",
          );
        }

        /*
         * Map ngày nguồn sang ngày mới.
         *
         * [1, 3, 4]
         *
         * 1 -> 1
         * 3 -> 2
         * 4 -> 3
         */
        const dayMap = new Map(
          normalizedDays.map(
            (sourceDay, index) => [
              sourceDay,
              index + 1,
            ],
          ),
        );

        /*
         * Ngày bắt đầu của Trip mới
         * = ngày đầu tiên được chọn
         * trong Trip gốc.
         *
         * Các ngày trong Trip mới được
         * nén lại thành liên tiếp.
         */
        let selectedStartDate:
          | Date
          | null = null;

        let selectedEndDate:
          | Date
          | null = null;

        if (source.startDate) {
          const firstSourceDay =
            normalizedDays[0];

          selectedStartDate =
            new Date(
              Date.UTC(
                source.startDate.getUTCFullYear(),
                source.startDate.getUTCMonth(),
                source.startDate.getUTCDate() +
                  firstSourceDay -
                  1,
              ),
            );

          selectedEndDate =
            new Date(
              Date.UTC(
                selectedStartDate.getUTCFullYear(),
                selectedStartDate.getUTCMonth(),
                selectedStartDate.getUTCDate() +
                  normalizedDays.length -
                  1,
              ),
            );
        }

        const dayLabel =
          normalizedDays.join(", ");

        const copiedTrip =
          await tx.trip.create({
            data: {
              name:
                `${source.name} · Ngày ${dayLabel}`,

              destination:
                source.destination,

              startDate:
                selectedStartDate,

              endDate:
                selectedEndDate,

              currency:
                source.currency,

              ownerId:
                copierUserId,

              visibility:
                PlanVisibility.PRIVATE,

              status:
                PlanStatus.IDEA,

              verifiedByAuthor:
                false,

              travelerCount:
                source.travelerCount,

              /*
               * Không lấy ngân sách
               * toàn bộ Trip gốc.
               */
              budgetTarget:
                null,

              pace:
                source.pace,

              travelStyle:
                source.travelStyle,

              forkedFromPlanId:
                source.id,
            },
          });

        /*
         * Copy activity của tất cả
         * ngày đã chọn.
         */
        await tx.itineraryItem.createMany({
          data:
            source.itineraryItems.map(
              (item) => ({
                tripId:
                  copiedTrip.id,

                copiedFromItemId:
                  item.id,

                /*
                 * Remap ngày nguồn
                 * thành ngày liên tiếp.
                 */
                day:
                  dayMap.get(
                    item.day,
                  )!,

                title:
                  item.title,

                startTime:
                  item.startTime,

                endTime:
                  item.endTime,

                placeId:
                  item.placeId,

                locationTagId:
                  item.locationTagId,

                notes:
                  item.notes,

                sortOrder:
                  item.sortOrder,
              }),
            ),
        });

        /*
         * Retention của selected-days
         * cũng bắt đầu ở 100%.
         */
        await tx.planCopy.create({
          data: {
            planId:
              copiedTrip.id,

            originalPlanId:
              source.id,

            copierUserId,

            initialItemCount:
              source.itineraryItems
                .length,

            retentionRate: 1,

            completed: false,

            postTripRating: null,
          },
        });

        return copiedTrip;
      },
    );
  } catch (error) {
    if (
      error instanceof CopyPlanError
    ) {
      throw error;
    }

    throw new CopyPlanError(
      "COPY_FAILED",
    );
  }
}