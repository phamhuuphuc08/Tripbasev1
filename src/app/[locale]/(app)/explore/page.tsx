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
import { getFormatter, getTranslations } from "next-intl/server";

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
import { listSavedPlans } from "@/server/services/saved-plan.service";

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
  "FOOD",
  "SHOPPING",
  "CULTURE",
  "NATURE",
] as const;

const PACE_OPTIONS = [
  "",
  "RELAXED",
  "NORMAL",
  "BUSY",
] as const;

const STATUS_OPTIONS = [
  "",
  "IDEA",
  "SCHEDULED",
  "COMPLETED",
] as const;

const SORT_OPTIONS: ExploreSort[] = [
  "RELEVANCE",
  "TRUST",
  "POPULAR",
  "RATING",
  "NEWEST",
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
  return value &&
    SORT_OPTIONS.includes(
      value as ExploreSort,
    )
    ? (value as ExploreSort)
    : undefined;
}

function buildPageHref(
  params: SearchParams,
  page: number,
): string {
  const query =
    new URLSearchParams();

  const entries: Array<
    [string, string | undefined]
  > = [
    ["q", params.q],
    ["destination", params.destination],
    ["styles", params.styles],
    ["budgetMin", params.budgetMin],
    ["budgetMax", params.budgetMax],
    ["pace", params.pace],
    ["status", params.status],
    ["startDateFrom", params.startDateFrom],
    ["startDateTo", params.startDateTo],
    ["minDays", params.minDays],
    ["maxDays", params.maxDays],
    ["sort", params.sort],
  ];

  for (const [key, value] of entries) {
    if (value?.trim()) {
      query.set(key, value);
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
    t,
    format,
  ] = await Promise.all([
    searchParams,
    getSession(),
    getTranslations("explore"),
    getFormatter(),
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

  const savedPlans =
    session
      ? await listSavedPlans(
          session.userId,
        )
      : [];

  const savedPlanIds =
    new Set(
      savedPlans.map(
        (plan) =>
          plan.id,
      ),
    );

  const currentExploreHref =
    buildPageHref(
      params,
      result.page,
    );

  const formatMoney = (
    value: number | null,
  ) =>
    value == null
      ? t("budgetUnset")
      : format.number(
          value,
          {
            style: "currency",
            currency: "VND",
            maximumFractionDigits: 0,
          },
        );

  const formatDateRange = (
    startDate: Date | null,
    endDate: Date | null,
  ) => {
    if (
      !startDate &&
      !endDate
    ) {
      return t("dateUnset");
    }

    if (
      startDate &&
      endDate
    ) {
      return format.dateTimeRange(
        startDate,
        endDate,
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      );
    }

    return format.dateTime(
      startDate ??
        endDate!,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    );
  };

  const paceLabel = (
    value: string,
  ) => {
    if (value === "RELAXED") {
      return t("paceRelaxed");
    }

    if (value === "BUSY") {
      return t("paceBusy");
    }

    return t("paceNormal");
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-3 rounded-3xl border bg-gradient-to-br px-6 py-7 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Search className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("heading")}
            </h1>

            <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-6">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border-border/70 shadow-sm">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="text-primary size-4" />
            {t("filtersHeading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-5">
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
                placeholder={
                  t("searchPlaceholder")
                }
                className="h-10 rounded-xl pl-9"
              />
            </div>

            <Input
              name="destination"
              defaultValue={
                params.destination ??
                ""
              }
              placeholder={
                t("destinationPlaceholder")
              }
              className="h-10 rounded-xl"
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
              className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <option
                    key={option}
                    value={option}
                  >
                    {t(
                      `sort.${option}`,
                    )}
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
              placeholder={
                t("budgetMinPlaceholder")
              }
              className="h-10 rounded-xl"
            />

            <Input
              name="budgetMax"
              type="number"
              min="0"
              defaultValue={
                params.budgetMax ??
                ""
              }
              placeholder={
                t("budgetMaxPlaceholder")
              }
              className="h-10 rounded-xl"
            />

            <select
              name="pace"
              defaultValue={
                params.pace ??
                ""
              }
              className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
            >
              {PACE_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option ||
                      "all"
                    }
                    value={option}
                  >
                    {option
                      ? t(
                          `pace.${option}`,
                        )
                      : t(
                          "paceAll",
                        )}
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
              className="border-input bg-background h-10 rounded-xl border px-3 text-sm"
            >
              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option ||
                      "all"
                    }
                    value={option}
                  >
                    {option
                      ? t(
                          `status.${option}`,
                        )
                      : t(
                          "statusAll",
                        )}
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
              className="h-10 rounded-xl"
            />

            <Input
              name="startDateTo"
              type="date"
              defaultValue={
                params.startDateTo ??
                ""
              }
              className="h-10 rounded-xl"
            />

            <Input
              name="minDays"
              type="number"
              min="1"
              defaultValue={
                params.minDays ??
                ""
              }
              placeholder={
                t("minDaysPlaceholder")
              }
              className="h-10 rounded-xl"
            />

            <Input
              name="maxDays"
              type="number"
              min="1"
              defaultValue={
                params.maxDays ??
                ""
              }
              placeholder={
                t("maxDaysPlaceholder")
              }
              className="h-10 rounded-xl"
            />

            <div className="md:col-span-2 lg:col-span-4">
              <p className="mb-2 text-sm font-medium">
                {t("travelStyleHeading")}
              </p>

              <div className="flex flex-wrap gap-3">
                {TRAVEL_STYLE_OPTIONS.map(
                  (style) => (
                    <label
                      key={style}
                      className="border-border hover:border-primary/40 hover:bg-primary/5 flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        name="style"
                        value={style}
                        defaultChecked={
                          travelStyles.includes(
                            style,
                          )
                        }
                      />

                      {t(
                        `style.${style}`,
                      )}
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
                className="rounded-xl"
              >
                <Search className="size-4" />
                {t("searchButton")}
              </Button>

              <Button
                variant="outline"
                render={
                  <Link href="/explore" />
                }
                nativeButton={false}
                className="rounded-xl"
              >
                {t("clearFilters")}
              </Button>

              {session && (
                <Button
                  variant="outline"
                  render={
                    <Link href="/saved" />
                  }
                  nativeButton={false}
                  className="rounded-xl"
                >
                  <Bookmark className="size-4" />
                  {t("savedButton")}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/20 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">
            {t(
              "resultsCount",
              {
                count:
                  result.total,
              },
            )}
          </h2>

          <p className="text-muted-foreground text-xs">
            {t(
              "pageCount",
              {
                page:
                  result.page,
                total:
                  result.totalPages,
              },
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {session &&
            savedPlans.length >
              0 && (
              <Badge variant="outline">
                <Bookmark className="mr-1 size-3" />

                {t(
                  "savedCount",
                  {
                    count:
                      savedPlans.length,
                  },
                )}
              </Badge>
          )}

          <Badge variant="outline">
            {t("marketplace")}
          </Badge>
        </div>
      </div>

      {result.items.length ===
      0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-16 text-center">
            <Search className="text-muted-foreground mx-auto size-7" />

            <p className="mt-4 font-medium">
              {t("emptyTitle")}
            </p>

            <p className="text-muted-foreground mt-1 text-sm">
              {t("emptyDescription")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                  key={trip.id}
                  className="group relative flex h-full flex-col overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
                    {trip.coverImageUrl ? (
                      <img
                        src={
                          trip.coverImageUrl
                        }
                        alt={
                          trip.name
                        }
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="from-muted to-muted/40 flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br">
                        <MapPin className="text-muted-foreground size-7" />

                        <span className="text-muted-foreground text-xs">
                          {t("noCover")}
                        </span>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      {!isOwnPlan && (
                        <>
                          {session ? (
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
                                variant="secondary"
                                size="icon"
                                title={
                                  isSaved
                                    ? t("unsave")
                                    : t("save")
                                }
                                aria-label={
                                  isSaved
                                    ? t("unsave")
                                    : t("save")
                                }
                                className="bg-background/90 shadow-sm backdrop-blur"
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
                          ) : (
                            <Button
                              variant="secondary"
                              size="icon"
                              render={
                                <Link
                                  href={`/login?callbackUrl=${encodeURIComponent(
                                    currentExploreHref,
                                  )}`}
                                />
                              }
                              nativeButton={false}
                              title={
                                t("loginToSave")
                              }
                              aria-label={
                                t("loginToSave")
                              }
                              className="bg-background/90 shadow-sm backdrop-blur"
                            >
                              <Bookmark className="size-4" />
                            </Button>
                          )}
                        </>
                      )}

                      <Badge
                        variant="secondary"
                        className="bg-background/90 shadow-sm backdrop-blur"
                      >
                        {trip.marketplaceRankScore.toFixed(
                          1,
                        )}
                      </Badge>
                    </div>
                  </div>

                  <CardHeader className="gap-2 px-4 pt-4 pb-0">
                    <CardTitle className="line-clamp-2 text-base leading-snug">
                      {trip.name}
                    </CardTitle>

                    <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                      <MapPin className="text-primary size-3.5 shrink-0" />

                      <span className="line-clamp-1">
                        {trip.destination}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-4">
                    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div className="text-muted-foreground flex items-start gap-1.5">
                        <CalendarDays className="mt-0.5 size-3.5 shrink-0" />

                        <span>
                          {formatDateRange(
                            trip.startDate,
                            trip.endDate,
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Clock3 className="size-3.5 shrink-0" />

                        <span>
                          {t(
                            "activityCount",
                            {
                              count:
                                trip.itineraryItemCount,
                            },
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="size-3.5 shrink-0" />

                        <span>
                          {t(
                            "travelerCount",
                            {
                              count:
                                trip.travelerCount,
                            },
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground flex items-center gap-1.5">
                        <Gauge className="size-3.5 shrink-0" />

                        <span>
                          {paceLabel(
                            trip.pace,
                          )}
                        </span>
                      </div>

                      <div className="text-muted-foreground col-span-2 flex items-center gap-1.5">
                        <Wallet className="size-3.5 shrink-0" />

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
                          (style) => (
                            <Badge
                              key={style}
                              variant="outline"
                              className="rounded-full"
                            >
                              {TRAVEL_STYLE_OPTIONS.includes(
                                style as typeof TRAVEL_STYLE_OPTIONS[number],
                              )
                                ? t(
                                    `style.${style as typeof TRAVEL_STYLE_OPTIONS[number]}`,
                                  )
                                : style}
                            </Badge>
                          ),
                        )}
                      </div>
                    )}

                    <div className="bg-muted/40 grid grid-cols-3 gap-2 rounded-xl px-2 py-3 text-center text-xs">
                      <div>
                        <div className="font-semibold">
                          {trip.copyplanScore.toFixed(
                            1,
                          )}
                        </div>

                        <div className="text-muted-foreground mt-0.5">
                          {t("copyPlanScore")}
                        </div>
                      </div>

                      <div className="border-border border-x">
                        <div className="font-semibold">
                          {trip.eligibleCopyCount}
                        </div>

                        <div className="text-muted-foreground mt-0.5">
                          {t("copyCount")}
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

                        <div className="text-muted-foreground mt-0.5">
                          {t("rating")}
                        </div>
                      </div>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      {t("createdBy")}{" "}

                      <Link
                        href={`/creators/${trip.ownerId}`}
                        className="text-foreground font-medium hover:underline"
                      >
                        {trip.ownerName}
                      </Link>
                    </div>

                    {isSaved && (
                      <div className="text-primary flex items-center gap-1.5 text-xs font-medium">
                        <Bookmark className="size-3 fill-current" />
                        {t("savedToLibrary")}
                      </div>
                    )}

                    <div className="mt-auto flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        className="flex-1 rounded-xl"
                        render={
                          <Link
                            href={`/trips/${trip.id}`}
                          />
                        }
                        nativeButton={false}
                      >
                        {t("viewDetails")}
                      </Button>

                      <Button
                        className="flex-1 rounded-xl"
                        render={
                          <Link
                            href={`/trips/${trip.id}#itinerary`}
                          />
                        }
                        nativeButton={false}
                      >
                        <Copy className="size-4" />
                        {t("copyPlan")}
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
        <div className="flex items-center justify-center gap-2 pt-2">
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
            className="rounded-xl"
          >
            {t("previousPage")}
          </Button>

          <span className="text-muted-foreground px-2 text-sm">
            {t(
              "pageShort",
              {
                page:
                  result.page,
                total:
                  result.totalPages,
              },
            )}
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
            className="rounded-xl"
          >
            {t("nextPage")}
          </Button>
        </div>
      )}
    </div>
  );
}