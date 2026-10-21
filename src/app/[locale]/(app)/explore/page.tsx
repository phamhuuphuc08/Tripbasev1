import {
  Bookmark,
  CalendarDays,
  Clock3,
  Copy,
  Gauge,
  MapPin,
  Search,
  Star,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { toggleSavedPlanAction } from "@/features/marketplace/actions";

import { Link } from "@/i18n/navigation";

import { getSession } from "@/server/auth/session";

import {
  type ExploreSort,
  listExplorePlans,
} from "@/server/services/marketplace.service";

import {
  listSavedPlans,
} from "@/server/services/saved-plan.service";

type SearchParams = {
  q?: string;
  destination?: string;
  styles?: string;
  budgetMin?: string;
  budgetMax?: string;
  pace?: string;
  status?: string;
  startDateFrom?: string;
  startDateTo?: string;
  minDays?: string;
  maxDays?: string;
  sort?: string;
  page?: string;
};

const TRAVEL_STYLE_OPTIONS = [
  {
    value: "FOOD",
    label: "Ẩm thực",
  },
  {
    value: "SHOPPING",
    label: "Mua sắm",
  },
  {
    value: "CULTURE",
    label: "Văn hoá",
  },
  {
    value: "NATURE",
    label: "Thiên nhiên",
  },
] as const;

const PACE_OPTIONS = [
  {
    value: "",
    label: "Mọi nhịp độ",
  },
  {
    value: "RELAXED",
    label: "Thư giãn",
  },
  {
    value: "NORMAL",
    label: "Bình thường",
  },
  {
    value: "BUSY",
    label: "Dày lịch",
  },
] as const;

const STATUS_OPTIONS = [
  {
    value: "",
    label: "Mọi trạng thái",
  },
  {
    value: "IDEA",
    label: "Ý tưởng",
  },
  {
    value: "SCHEDULED",
    label: "Đã lên lịch",
  },
  {
    value: "COMPLETED",
    label: "Đã hoàn thành",
  },
] as const;

const SORT_OPTIONS: Array<{
  value: ExploreSort;
  label: string;
}> = [
  {
    value: "RELEVANCE",
    label: "Liên quan nhất",
  },
  {
    value: "TRUST",
    label: "Uy tín nhất",
  },
  {
    value: "POPULAR",
    label: "Phổ biến nhất",
  },
  {
    value: "RATING",
    label: "Đánh giá cao",
  },
  {
    value: "NEWEST",
    label: "Mới nhất",
  },
];

function toNumber(
  value: string | undefined,
): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : undefined;
}

function toPage(
  value: string | undefined,
): number {
  const number = Number(value);

  return Number.isInteger(number) &&
    number > 0
    ? number
    : 1;
}

function normalizeSort(
  value: string | undefined,
): ExploreSort | undefined {
  const allowed =
    new Set<ExploreSort>(
      SORT_OPTIONS.map(
        (item) => item.value,
      ),
    );

  return value &&
    allowed.has(
      value as ExploreSort,
    )
    ? (value as ExploreSort)
    : undefined;
}

function formatMoney(
  value: number | null,
): string {
  if (value == null) {
    return "Chưa đặt ngân sách";
  }

  return (
    new Intl.NumberFormat(
      "vi-VN",
      {
        maximumFractionDigits: 0,
      },
    ).format(value) + " ₫"
  );
}

function formatDateRange(
  startDate: Date | null,
  endDate: Date | null,
): string {
  if (
    !startDate &&
    !endDate
  ) {
    return "Chưa đặt ngày";
  }

  const formatter =
    new Intl.DateTimeFormat(
      "vi-VN",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );

  if (
    startDate &&
    endDate
  ) {
    return `${formatter.format(
      startDate,
    )} – ${formatter.format(
      endDate,
    )}`;
  }

  return formatter.format(
    startDate ??
      endDate!,
  );
}

function paceLabel(
  value: string,
): string {
  if (
    value === "RELAXED"
  ) {
    return "Thư giãn";
  }

  if (
    value === "BUSY"
  ) {
    return "Dày lịch";
  }

  return "Bình thường";
}

function buildPageHref(
  params: SearchParams,
  page: number,
): string {
  const query =
    new URLSearchParams();

  const entries: Array<
    [
      string,
      string | undefined,
    ]
  > = [
    ["q", params.q],
    [
      "destination",
      params.destination,
    ],
    [
      "styles",
      params.styles,
    ],
    [
      "budgetMin",
      params.budgetMin,
    ],
    [
      "budgetMax",
      params.budgetMax,
    ],
    [
      "pace",
      params.pace,
    ],
    [
      "status",
      params.status,
    ],
    [
      "startDateFrom",
      params.startDateFrom,
    ],
    [
      "startDateTo",
      params.startDateTo,
    ],
    [
      "minDays",
      params.minDays,
    ],
    [
      "maxDays",
      params.maxDays,
    ],
    [
      "sort",
      params.sort,
    ],
  ];

  for (
    const [key, value]
    of entries
  ) {
    if (
      value?.trim()
    ) {
      query.set(
        key,
        value,
      );
    }
  }

  query.set(
    "page",
    String(page),
  );

  return `/explore?${query.toString()}`;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [
    params,
    session,
  ] = await Promise.all([
    searchParams,
    getSession(),
  ]);

  const formKey =
    JSON.stringify(params);

  const travelStyles =
    params.styles
      ?.split(",")
      .map(
        (value) =>
          value.trim(),
      )
      .filter(Boolean) ??
    [];

  /*
   * Marketplace result.
   */
  const result =
    await listExplorePlans({
      query:
        params.q,

      destination:
        params.destination,

      travelStyles,

      budgetMin:
        toNumber(
          params.budgetMin,
        ),

      budgetMax:
        toNumber(
          params.budgetMax,
        ),

      pace:
        params.pace,

      status:
        params.status,

      startDateFrom:
        params.startDateFrom,

      startDateTo:
        params.startDateTo,

      minDays:
        toNumber(
          params.minDays,
        ),

      maxDays:
        toNumber(
          params.maxDays,
        ),

      sort:
        normalizeSort(
          params.sort,
        ),

      page:
        toPage(
          params.page,
        ),

      pageSize: 12,
    });

  /*
   * Lấy danh sách Bookmark của user hiện tại.
   *
   * Không đăng nhập:
   * savedPlans = []
   */
  const savedPlans =
    session
      ? await listSavedPlans(
          session.userId,
        )
      : [];

  /*
   * Set giúp check Bookmark O(1)
   * thay vì tìm trong array mỗi card.
   */
  const savedPlanIds =
    new Set(
      savedPlans.map(
        (plan) => plan.id,
      ),
    );

  /*
   * Dùng khi user chưa login
   * nhưng bấm Bookmark.
   *
   * Sau khi login quay lại
   * đúng Explore page hiện tại.
   */
  const currentExploreHref =
    buildPageHref(
      params,
      result.page,
    );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">
          Khám phá kế hoạch
        </h1>

        <p className="text-muted-foreground text-sm">
          Tìm kiếm các kế hoạch công khai theo điểm đến,
          tên chuyến đi hoặc người tạo. Kết quả được xếp
          hạng bằng Reputation snapshot.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Tìm kiếm & bộ lọc
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            key={formKey}
            method="get"
            className="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
          >
            <div className="relative md:col-span-2 lg:col-span-2">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />

              <Input
                name="q"
                defaultValue={
                  params.q ??
                  ""
                }
                placeholder="Tên chuyến đi, điểm đến hoặc người tạo..."
                className="pl-9"
              />
            </div>

            <Input
              name="destination"
              defaultValue={
                params.destination ??
                ""
              }
              placeholder="Điểm đến"
            />

            <select
              name="sort"
              defaultValue={
                normalizeSort(
                  params.sort,
                ) ??
                (
                  params.q
                    ? "RELEVANCE"
                    : "TRUST"
                )
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>

            <Input
              name="budgetMin"
              type="number"
              min="0"
              defaultValue={
                params.budgetMin ??
                ""
              }
              placeholder="Ngân sách từ"
            />

            <Input
              name="budgetMax"
              type="number"
              min="0"
              defaultValue={
                params.budgetMax ??
                ""
              }
              placeholder="Ngân sách đến"
            />

            <select
              name="pace"
              defaultValue={
                params.pace ??
                ""
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {PACE_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value ||
                      "all"
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>

            <select
              name="status"
              defaultValue={
                params.status ??
                ""
              }
              className="border-input bg-background h-9 rounded-md border px-3 text-sm"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value ||
                      "all"
                    }
                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>
                ),
              )}
            </select>

            <Input
              name="startDateFrom"
              type="date"
              defaultValue={
                params.startDateFrom ??
                ""
              }
            />

            <Input
              name="startDateTo"
              type="date"
              defaultValue={
                params.startDateTo ??
                ""
              }
            />

            <Input
              name="minDays"
              type="number"
              min="1"
              defaultValue={
                params.minDays ??
                ""
              }
              placeholder="Số ngày tối thiểu"
            />

            <Input
              name="maxDays"
              type="number"
              min="1"
              defaultValue={
                params.maxDays ??
                ""
              }
              placeholder="Số ngày tối đa"
            />

            <div className="md:col-span-2 lg:col-span-4">
              <p className="mb-2 text-sm font-medium">
                Phong cách du lịch
              </p>

              <div className="flex flex-wrap gap-3">
                {TRAVEL_STYLE_OPTIONS.map(
                  (style) => (
                    <label
                      key={
                        style.value
                      }
                      className="border-border flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        name="style"
                        value={
                          style.value
                        }
                        defaultChecked={
                          travelStyles.includes(
                            style.value,
                          )
                        }
                      />

                      {
                        style.label
                      }
                    </label>
                  ),
                )}
              </div>

              {travelStyles.length >
                0 && (
                <input
                  type="hidden"
                  name="styles"
                  value={
                    travelStyles.join(
                      ",",
                    )
                  }
                />
              )}
            </div>

            <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-4">
              <Button
                type="submit"
              >
                <Search className="size-4" />
                Tìm kiếm
              </Button>

              <Button
                variant="outline"
                render={
                  <Link href="/explore" />
                }
                nativeButton={
                  false
                }
              >
                Xóa bộ lọc
              </Button>

              {session && (
                <Button
                  variant="outline"
                  render={
                    <Link href="/saved" />
                  }
                  nativeButton={
                    false
                  }
                >
                  <Bookmark className="size-4" />
                  Đã lưu
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-medium">
            {result.total} kế hoạch phù hợp
          </h2>

          <p className="text-muted-foreground text-xs">
            Trang {result.page}/
            {result.totalPages}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session &&
            savedPlans.length >
              0 && (
              <Badge variant="outline">
                <Bookmark className="mr-1 size-3" />
                {savedPlans.length} đã lưu
              </Badge>
            )}

          <Badge variant="outline">
            Marketplace
          </Badge>
        </div>
      </div>

      {result.items.length ===
      0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="font-medium">
              Không tìm thấy kế hoạch phù hợp.
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              Thử thay đổi từ khóa hoặc nới lỏng bộ lọc.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {result.items.map(
            (trip) => {
              const isSaved =
                savedPlanIds.has(
                  trip.id,
                );

              const isOwnPlan =
                session?.userId ===
                trip.ownerId;

              return (
                <Card
                  key={
                    trip.id
                  }
                  className="flex h-full flex-col"
                >
                  <CardHeader className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 min-w-0 flex-1 text-base">
                        {
                          trip.name
                        }
                      </CardTitle>

                      <div className="flex shrink-0 items-center gap-1">
                        {/*
                         * Đã đăng nhập và
                         * không phải plan của mình.
                         */}
                        {session &&
                          !isOwnPlan && (
                          <form
                            action={async () => {
                              "use server";

                              await toggleSavedPlanAction(
                                trip.id,
                              );
                            }}
                          >
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              title={
                                isSaved
                                  ? "Bỏ lưu kế hoạch"
                                  : "Lưu kế hoạch"
                              }
                              aria-label={
                                isSaved
                                  ? "Bỏ lưu kế hoạch"
                                  : "Lưu kế hoạch"
                              }
                            >
                              <Bookmark
                                className={
                                  isSaved
                                    ? "size-4 fill-current"
                                    : "size-4"
                                }
                              />
                            </Button>
                          </form>
                        )}

                        {/*
                         * Chưa đăng nhập:
                         * bấm Bookmark -> Login.
                         */}
                        {!session && (
                          <Button
                            variant="ghost"
                            size="icon"
                            render={
                              <Link
                                href={`/login?callbackUrl=${encodeURIComponent(
                                  currentExploreHref,
                                )}`}
                              />
                            }
                            nativeButton={
                              false
                            }
                            title="Đăng nhập để lưu"
                            aria-label="Đăng nhập để lưu kế hoạch"
                          >
                            <Bookmark className="size-4" />
                          </Button>
                        )}

                        <Badge variant="secondary">
                          {trip.marketplaceRankScore.toFixed(
                            1,
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <MapPin className="size-3.5" />

                      <span className="line-clamp-1">
                        {
                          trip.destination
                        }
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="size-3.5" />

                        <span>
                          {formatDateRange(
                            trip.startDate,
                            trip.endDate,
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Clock3 className="size-3.5" />

                        <span>
                          {
                            trip.itineraryItemCount
                          }{" "}
                          hoạt động
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="size-3.5" />

                        <span>
                          {
                            trip.travelerCount
                          }{" "}
                          người
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Gauge className="size-3.5" />

                        <span>
                          {paceLabel(
                            trip.pace,
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground col-span-2 flex items-center gap-1.5">
                        <Wallet className="size-3.5" />

                        <span>
                          {formatMoney(
                            trip.budgetTarget,
                          )}
                        </span>
                      </div>
                    </div>

                    {trip.travelStyle
                      .length >
                      0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {trip.travelStyle.map(
                          (
                            style,
                          ) => (
                            <Badge
                              key={
                                style
                              }
                              variant="outline"
                            >
                              {
                                style
                              }
                            </Badge>
                          ),
                        )}
                      </div>
                    )}

                    <div className="border-border mt-auto grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                      <div>
                        <div className="font-semibold">
                          {trip.copyplanScore.toFixed(
                            1,
                          )}
                        </div>

                        <div className="text-muted-foreground">
                          CopyPlan
                        </div>
                      </div>

                      <div>
                        <div className="font-semibold">
                          {
                            trip.eligibleCopyCount
                          }
                        </div>

                        <div className="text-muted-foreground">
                          lượt copy
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-center gap-1 font-semibold">
                          <Star className="size-3" />

                          {trip.averagePostTripRating >
                          0
                            ? trip.averagePostTripRating.toFixed(
                                1,
                              )
                            : "—"}
                        </div>

                        <div className="text-muted-foreground">
                          đánh giá
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      Tạo bởi{" "}

                      <Link
                        href={`/creators/${trip.ownerId}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {
                          trip.ownerName
                        }
                      </Link>
                    </div>

                    {isSaved && (
                      <div className="text-primary flex items-center gap-1.5 text-xs">
                        <Bookmark className="size-3 fill-current" />
                        Đã lưu vào thư viện
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        render={
                          <Link
                            href={`/trips/${trip.id}`}
                          />
                        }
                        nativeButton={
                          false
                        }
                      >
                        Xem chi tiết
                      </Button>

                      <Button
                        className="flex-1"
                        render={
                          <Link
                            href={`/trips/${trip.id}#itinerary`}
                          />
                        }
                        nativeButton={
                          false
                        }
                      >
                        <Copy className="size-4" />
                        CopyPlan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            },
          )}
        </div>
      )}

      {result.totalPages >
        1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            disabled={
              !result.hasPreviousPage
            }
            render={
              result.hasPreviousPage
                ? (
                    <Link
                      href={buildPageHref(
                        params,
                        result.page -
                          1,
                      )}
                    />
                  )
                : undefined
            }
            nativeButton={
              !result.hasPreviousPage
            }
          >
            Trang trước
          </Button>

          <span className="text-muted-foreground px-2 text-sm">
            {result.page}/
            {result.totalPages}
          </span>

          <Button
            variant="outline"
            disabled={
              !result.hasNextPage
            }
            render={
              result.hasNextPage
                ? (
                    <Link
                      href={buildPageHref(
                        params,
                        result.page +
                          1,
                      )}
                    />
                  )
                : undefined
            }
            nativeButton={
              !result.hasNextPage
            }
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}