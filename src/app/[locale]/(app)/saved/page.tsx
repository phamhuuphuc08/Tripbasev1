import {
  Bookmark,
  CalendarRange,
  MapPin,
  User,
  Users,
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

import { unsavePlanAction } from "@/features/marketplace/actions";

import { Link, redirect } from "@/i18n/navigation";

import { getSession } from "@/server/auth/session";
import { listSavedPlans } from "@/server/services/saved-plan.service";

const TRAVEL_STYLE_OPTIONS = [
  "FOOD",
  "SHOPPING",
  "CULTURE",
  "NATURE",
] as const;

export default async function SavedLibraryPage() {
  const session = await getSession();

  if (!session) {
    return redirect({
      href: "/login?callbackUrl=/saved",
      locale: undefined,
    });
  }

  const [
    savedPlans,
    t,
    format,
  ] = await Promise.all([
    listSavedPlans(
      session.userId,
    ),
    getTranslations(
      "saved",
    ),
    getFormatter(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="from-primary/10 via-primary/5 to-background flex flex-col gap-3 rounded-3xl border bg-gradient-to-br px-6 py-7 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-2xl">
            <Bookmark className="size-5" />
          </span>

          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("title")}
            </h1>

            <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-6">
              {t("description")}
            </p>
          </div>
        </div>
      </div>

      {savedPlans.length === 0 ? (
        <Card className="rounded-2xl border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
              <Bookmark className="size-6" />
            </span>

            <div className="flex flex-col gap-1">
              <h2 className="font-semibold">
                {t("emptyTitle")}
              </h2>

              <p className="text-muted-foreground max-w-md text-sm leading-6">
                {t("emptyDescription")}
              </p>
            </div>

            <Button
              render={
                <Link href="/explore" />
              }
              nativeButton={false}
              className="rounded-xl"
            >
              {t("exploreButton")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">
                {t("savedHeading")}
              </h2>

              <p className="text-muted-foreground mt-1 text-sm">
                {t(
                  "libraryCount",
                  {
                    count:
                      savedPlans.length,
                  },
                )}
              </p>
            </div>

            <Badge variant="outline">
              <Bookmark className="mr-1 size-3 fill-current" />

              {t(
                "savedCount",
                {
                  count:
                    savedPlans.length,
                },
              )}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {savedPlans.map(
              (plan) => {
                const dateRange =
                  plan.startDate &&
                  plan.endDate
                    ? format.dateTimeRange(
                        plan.startDate,
                        plan.endDate,
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        },
                      )
                    : null;

                return (
                  <Card
                    key={plan.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <div className="bg-muted relative aspect-[16/10] w-full overflow-hidden">
                      {plan.coverImageUrl ? (
                        <img
                          src={
                            plan.coverImageUrl
                          }
                          alt={
                            plan.name
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

                      <form
                        action={unsavePlanAction.bind(
                          null,
                          plan.id,
                        )}
                        className="absolute top-3 right-3"
                      >
                        <Button
                          type="submit"
                          variant="secondary"
                          size="icon"
                          aria-label={
                            t("unsave")
                          }
                          title={
                            t("unsave")
                          }
                          className="bg-background/90 shadow-sm backdrop-blur"
                        >
                          <Bookmark className="size-4 fill-current" />
                        </Button>
                      </form>
                    </div>

                    <CardHeader className="gap-2 px-4 pt-4 pb-0">
                      <CardTitle className="line-clamp-2 text-base leading-snug">
                        <Link
                          href={`/trips/${plan.id}`}
                          className="hover:underline"
                        >
                          {plan.name}
                        </Link>
                      </CardTitle>

                      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <MapPin className="text-primary size-3.5 shrink-0" />

                        <span className="line-clamp-1">
                          {
                            plan.destination
                          }
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col gap-4 px-4 pt-3 pb-4">
                      {dateRange && (
                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                          <CalendarRange className="size-3.5 shrink-0" />

                          <span>
                            {dateRange}
                          </span>
                        </div>
                      )}

                      <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                        <User className="size-3.5 shrink-0" />

                        <Link
                          href={`/creators/${plan.ownerId}`}
                          className="hover:text-foreground font-medium hover:underline"
                        >
                          {
                            plan.ownerName
                          }
                        </Link>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {t(
                            "activityCount",
                            {
                              count:
                                plan.itineraryItemCount,
                            },
                          )}
                        </Badge>

                        <Badge variant="outline">
                          <Users className="mr-1 size-3" />

                          {t(
                            "travelerCount",
                            {
                              count:
                                plan.travelerCount,
                            },
                          )}
                        </Badge>

                        {plan.copyplanScore >
                          0 && (
                          <Badge variant="outline">
                            {t(
                              "trustScore",
                              {
                                score:
                                  plan.copyplanScore,
                              },
                            )}
                          </Badge>
                        )}
                      </div>

                      {plan.travelStyle.length >
                        0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {plan.travelStyle.map(
                            (
                              style,
                            ) => (
                              <Badge
                                key={
                                  style
                                }
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

                      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-4">
                        <span className="text-muted-foreground text-xs">
                          {t(
                            "savedAt",
                            {
                              date:
                                format.dateTime(
                                  plan.savedAt,
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  },
                                ),
                            },
                          )}
                        </span>

                        <Button
                          render={
                            <Link
                              href={`/trips/${plan.id}`}
                            />
                          }
                          nativeButton={false}
                          variant="outline"
                          className="rounded-xl"
                        >
                          {t("viewPlan")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              },
            )}
          </div>
        </>
      )}
    </div>
  );
}
