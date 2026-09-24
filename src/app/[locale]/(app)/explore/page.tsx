import {
  BadgeCheck,
  CalendarRange,
  Compass,
  MapPin,
  Search,
  User,
} from "lucide-react";
import {
  getFormatter,
  getTranslations,
} from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { CopyPlanButton } from "@/features/copy-plan/copy-plan-button";
import { Link } from "@/i18n/navigation";

import {
  searchPublicTrips,
  type TripSearchResult,
} from "@/server/services/marketplace.service";

async function ExploreTripCard({
  trip,
}: {
  trip: TripSearchResult;
}) {
  const [t, tStatus, format] = await Promise.all([
    getTranslations("tripCard"),
    getTranslations("tripStatus"),
    getFormatter(),
  ]);

  const dateRange =
    trip.startDate && trip.endDate
      ? format.dateTimeRange(
          trip.startDate,
          trip.endDate,
          {
            day: "2-digit",
            month: "2-digit",
          },
        )
      : null;

  return (
    <Card className="flex h-full flex-col gap-3 py-5 transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">
            {trip.name}
          </CardTitle>

          {trip.verifiedByAuthor && (
            <Badge
              variant="secondary"
              className="bg-accent text-accent-foreground shrink-0 gap-1"
            >
              <BadgeCheck className="size-3" />
              {t("verified")}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1.5 text-sm">
          <span className="text-foreground/90 flex items-center gap-1.5">
            <MapPin className="text-primary size-3.5 shrink-0" />
            {trip.destination}
          </span>

          {dateRange && (
            <span className="text-muted-foreground flex items-center gap-1.5">
              <CalendarRange className="size-3.5 shrink-0" />
              {dateRange}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Badge variant="outline">
            {tStatus(
              trip.status as
                | "IDEA"
                | "SCHEDULED"
                | "COMPLETED",
            )}
          </Badge>

          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <User className="size-3" />

            {t.rich("by", {
              name: trip.ownerName,

              link: (chunks) => (
                <Link
                  href={`/creators/${trip.ownerId}`}
                  className="hover:text-foreground hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </div>

        <div className="mt-auto grid gap-2 border-t pt-4">
          <Button
            variant="outline"
            render={
              <Link href={`/trips/${trip.id}`} />
            }
            nativeButton={false}
            className="w-full"
          >
            Xem kế hoạch
          </Button>

          <CopyPlanButton tripId={trip.id} />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const { q } = await searchParams;

  const query = q?.trim() ?? "";

  const [results, t] = await Promise.all([
    searchPublicTrips(query),
    getTranslations("home"),
  ]);

  return (
    <main className="flex-1">
      <section className="from-primary/10 via-background to-background border-b bg-gradient-to-b">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-12">
          <div className="flex items-center gap-3">
            <span className="bg-primary text-primary-foreground flex size-11 items-center justify-center rounded-full">
              <Compass className="size-5" />
            </span>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {t("exploreWord")}
              </h1>

              <p className="text-muted-foreground text-sm">
                Khám phá và sao chép kế hoạch du lịch từ cộng đồng TripBase.
              </p>
            </div>
          </div>

          <form
            action="/explore"
            className="flex w-full max-w-xl gap-2"
          >
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

              <Input
                name="q"
                defaultValue={query}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAriaLabel")}
                className="h-11 rounded-full pl-9"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-full px-5"
            >
              {t("searchButton")}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-4xl flex-col gap-5 px-6 py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-3">
            <span className="text-primary text-2xl font-extrabold tracking-tight">
              {t("exploreWord")}
            </span>

            <span className="text-muted-foreground text-sm font-medium">
              {query
                ? t("matchHeading", {
                    query,
                  })
                : t("recentHeading")}
            </span>
          </div>

          <span className="text-muted-foreground text-xs">
            {results.length} kế hoạch
          </span>
        </div>

        {results.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Compass className="text-muted-foreground size-8" />

              <p className="text-muted-foreground text-sm">
                {t.rich("empty", {
                  query,

                  link: (chunks) => (
                    <Link
                      href="/register"
                      className="text-foreground underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((trip) => (
              <ExploreTripCard
                key={trip.id}
                trip={trip}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}