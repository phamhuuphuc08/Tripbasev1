import { BadgeCheck, CalendarRange, MapPin, Search, User } from "lucide-react";
import { getTranslations, getFormatter } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import {
  searchPublicTrips,
  type TripSearchResult,
} from "@/server/services/marketplace.service";

async function TripResultCard({ trip }: { trip: TripSearchResult }) {
  const [t, tStatus, format] = await Promise.all([
    getTranslations("tripCard"),
    getTranslations("tripStatus"),
    getFormatter(),
  ]);

  const dateRange =
    trip.startDate && trip.endDate
      ? format.dateTimeRange(trip.startDate, trip.endDate, {
          day: "2-digit",
          month: "2-digit",
        })
      : null;

  return (
    <Card className="hover:border-primary/40 hover:shadow-primary/5 relative h-full gap-3 py-5 transition-all hover:shadow-md">
      {/* Stretched-link: covers the whole card so it's clickable anywhere,
          while sitting beneath the owner name below (pointer-events:none on
          that content, re-enabled just on the name) so the name can still
          be its own link — nesting an <a> inside <a> isn't valid HTML. */}
      <Link
        href={`/trips/${trip.id}`}
        className="absolute inset-0 z-0"
        aria-label={trip.name}
      />
      <CardHeader className="pointer-events-none relative z-10">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{trip.name}</CardTitle>
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
      <CardContent className="pointer-events-none relative z-10 flex flex-col gap-1.5 text-sm">
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
        <div className="mt-2 flex items-center justify-between">
          <Badge variant="outline">
            {tStatus(trip.status as "IDEA" | "SCHEDULED" | "COMPLETED")}
          </Badge>
          <span className="text-muted-foreground flex items-center gap-1 text-xs">
            <User className="size-3" />
            {t.rich("by", {
              name: trip.ownerName,
              link: (chunks) => (
                <Link
                  href={`/creators/${trip.ownerId}`}
                  className="hover:text-foreground pointer-events-auto relative z-20 hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const [results, t] = await Promise.all([
    searchPublicTrips(query),
    getTranslations("home"),
  ]);

  return (
    <main className="flex-1">
      <div className="from-primary/10 via-background to-background border-b bg-gradient-to-b">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Trip<span className="text-primary">Base</span>
            </h1>
            <p className="text-muted-foreground max-w-lg text-balance">
              {t("subtitle")}
            </p>
          </div>

          <form action="/" className="flex w-full max-w-md gap-2">
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
            <Button type="submit" size="lg" className="h-11 rounded-full px-5">
              {t("searchButton")}
            </Button>
          </form>
        </div>
      </div>

      <section className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-10">
        <h2 className="text-muted-foreground text-sm font-medium">
          {query ? t("matchHeading", { query }) : t("recentHeading")}
        </h2>

        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.rich("empty", {
              query,
              link: (chunks) => (
                <Link href="/register" className="text-foreground underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((trip) => (
              <TripResultCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
