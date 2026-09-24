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
             * Giữ nguồn gốc của plan.
             */
            forkedFromPlanId:
              source.id,
          },
        });

      /*
       * Sao chép toàn bộ itinerary.
       *
       * copiedFromItemId lưu ID
       * của item trong plan gốc.
       */
      if (
        source.itineraryItems
          .length > 0
      ) {
        await tx.itineraryItem.createMany(
          {
            data:
              source.itineraryItems.map(
                (item) => ({
                  tripId:
                    copiedTrip.id,

                  /*
                   * Quan trọng cho
                   * Retention Rate.
                   */
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
          },
        );
      }

      /*
       * Ghi nhận CopyPlan.
       *
       * initialItemCount là số
       * hoạt động được copy ban đầu.
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

          /*
           * Nếu có itinerary thì
           * ban đầu retention = 100%.
           *
           * Nếu plan không có item
           * thì chưa có tỷ lệ để tính.
           */
          retentionRate:
            source.itineraryItems
              .length > 0
              ? 1
              : null,
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
 *
 * Ví dụ:
 *
 * Trip gốc:
 * Ngày 1
 * Ngày 2 ← copy
 * Ngày 3
 *
 * Trip mới:
 * Ngày 1 ← nội dung Ngày 2 cũ
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
          source.itineraryItems
            .length === 0
        ) {
          throw new CopyPlanError(
            "DAY_NOT_FOUND",
          );
        }

        /*
         * Xác định ngày thực của
         * sourceDay.
         *
         * Ví dụ:
         * startDate = 06/09
         * sourceDay = 2
         * selectedDate = 07/09
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
               * toàn trip cho bản
               * copy một ngày.
               */
              budgetTarget:
                null,

              pace:
                source.pace,

              travelStyle:
                source.travelStyle,

              /*
               * Giữ nguồn plan gốc.
               */
              forkedFromPlanId:
                source.id,
            },
          });

        /*
         * Copy các activity
         * của ngày được chọn.
         */
        await tx.itineraryItem.createMany(
          {
            data:
              source.itineraryItems.map(
                (item) => ({
                  tripId:
                    copiedTrip.id,

                  /*
                   * Lưu nguồn item
                   * để tính retention.
                   */
                  copiedFromItemId:
                    item.id,

                  /*
                   * Ngày được chọn
                   * trở thành Ngày 1
                   * của Trip mới.
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
          },
        );

        /*
         * Đối với copy từng ngày:
         *
         * Ví dụ ngày 2 có 4 activity:
         *
         * initialItemCount = 4
         * retentionRate = 4 / 4 = 100%
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
 * Công thức MVP:
 *
 * số item gốc còn lại
 * --------------------
 * số item được copy ban đầu
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
   * thì Retention Rate
   * không xác định.
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
   * Chỉ đếm item còn giữ
   * dấu vết từ plan gốc.
   *
   * Activity do user thêm mới
   * có copiedFromItemId = null
   * nên không làm tăng retention.
   */
  const retainedItemCount =
    await prisma.itineraryItem.count(
      {
        where: {
          tripId:
            copiedTripId,

          copiedFromItemId: {
            not: null,
          },
        },
      },
    );

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