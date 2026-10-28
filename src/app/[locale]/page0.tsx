import {
  BadgeCheck,
  Bookmark,
  CalendarRange,
  Compass,
  MapPin,
  MapPinned,
  Search,
  Tag,
  User,
  type LucideIcon,
} from "lucide-react";
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

type QuickLinkKey =
  "quickLinkTrips" | "quickLinkExplore" | "quickLinkTags" | "quickLinkSaved";

const QUICK_LINKS: {
  href: string;
  icon: LucideIcon;
  labelKey: QuickLinkKey;
}[] = [
  { href: "/trips", icon: MapPinned, labelKey: "quickLinkTrips" },
  { href: "/explore", icon: Compass, labelKey: "quickLinkExplore" },
  { href: "/tags", icon: Tag, labelKey: "quickLinkTags" },
  { href: "/saved", icon: Bookmark, labelKey: "quickLinkSaved" },
];

async function TripResultCard({ trip }: { trip: TripSearchResult }) {
  const [t, tStatus, tHome, format] = await Promise.all([
    getTranslations("tripCard"),
    getTranslations("tripStatus"),
    getTranslations("home"),
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
    <Card className="group hover:border-primary/40 hover:shadow-primary/5 relative h-full overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/trips/${trip.id}`}
        className="absolute inset-0 z-0"
        aria-label={trip.name}
      />

      <div className="bg-muted pointer-events-none relative z-10 aspect-[16/10] w-full overflow-hidden">
        {trip.coverImageUrl ? (
          <img
            src={trip.coverImageUrl}
            alt={trip.name}
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="from-muted to-muted/40 flex h-full w-full items-center justify-center bg-gradient-to-br">
            <div className="flex flex-col items-center gap-2">
              <MapPinned className="text-muted-foreground size-7" />
              <span className="text-muted-foreground text-xs">
                {tHome("noCover")}
              </span>
            </div>
          </div>
        )}

        {trip.verifiedByAuthor && (
          <Badge
            variant="secondary"
            className="bg-background/90 text-foreground absolute top-3 right-3 gap-1 shadow-sm backdrop-blur"
          >
            <BadgeCheck className="size-3" />
            {t("verified")}
          </Badge>
        )}
      </div>

      <CardHeader className="pointer-events-none relative z-10 px-4 pt-4 pb-0">
        <CardTitle className="line-clamp-2 text-base leading-snug">
          {trip.name}
        </CardTitle>
      </CardHeader>

      <CardContent className="pointer-events-none relative z-10 flex min-h-36 flex-col gap-2 px-4 pt-2 pb-4 text-sm">
        <span className="text-foreground/90 flex items-center gap-1.5">
          <MapPin className="text-primary size-3.5 shrink-0" />
          <span className="line-clamp-1">{trip.destination}</span>
        </span>

        {dateRange && (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <CalendarRange className="size-3.5 shrink-0" />
            {dateRange}
          </span>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <Badge variant="outline">
            {tStatus(trip.status as "IDEA" | "SCHEDULED" | "COMPLETED")}
          </Badge>

          <span className="text-muted-foreground flex min-w-0 items-center gap-1 text-xs">
            <User className="size-3 shrink-0" />

            {t.rich("by", {
              name: trip.ownerName,
              link: (chunks) => (
                <Link
                  href={`/creators/${trip.ownerId}`}
                  className="hover:text-foreground pointer-events-auto relative z-20 truncate hover:underline"
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
      <section className="from-primary/15 via-background to-background border-b bg-gradient-to-b">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-7 px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="flex max-w-2xl flex-col items-center gap-3">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {t("heroBadge")}
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Trip<span className="text-primary">Base</span>
            </h1>

            <p className="text-muted-foreground max-w-xl text-balance text-sm leading-6 sm:text-base">
              {t("subtitle")}
            </p>
          </div>

          <form
            action="/"
            className="bg-background flex w-full max-w-xl gap-2 rounded-2xl border p-2 shadow-sm"
          >
            <div className="relative flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />

              <Input
                name="q"
                defaultValue={query}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchAriaLabel")}
                className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-11 rounded-xl px-5"
            >
              {t("searchButton")}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="text-primary text-sm font-semibold">
              {t("quickLinksWord")}
            </span>

            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {t("quickLinksLabel")}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK_LINKS.map(({ href, icon: Icon, labelKey }) => (
            <Link
              key={href}
              href={href}
              className="group border-border/70 hover:border-primary/30 hover:bg-primary/5 flex items-center gap-3 rounded-2xl border p-4 transition-all"
            >
              <span className="bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
                <Icon className="size-5" />
              </span>

              <span className="text-sm font-medium">
                {t(labelKey)}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-primary text-sm font-semibold">
              {t("exploreWord")}
            </span>

            <h2 className="mt-1 text-2xl font-semibold tracking-tight">
              {query
                ? t("matchHeading", { query })
                : t("recentHeading")}
            </h2>
          </div>

          <Button
            variant="outline"
            render={<Link href="/explore" />}
            nativeButton={false}
          >
            <Compass className="size-4" />
            {t("exploreMore")}
          </Button>
        </div>

        {results.length === 0 ? (
          <div className="border-border/70 bg-muted/20 rounded-2xl border px-6 py-12 text-center">
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
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((trip) => (
              <TripResultCard
                key={trip.id}
                trip={trip}
              />
            ))}
          </div>
        )}
      </section>

      <section className="border-t">
        <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-12 sm:grid-cols-3 sm:px-6">
          <div className="rounded-2xl border p-5">
            <MapPinned className="text-primary size-6" />

            <h3 className="mt-4 font-semibold">
              {t("featurePlanTitle")}
            </h3>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {t("featurePlanDescription")}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <Compass className="text-primary size-6" />

            <h3 className="mt-4 font-semibold">
              {t("featureExploreTitle")}
            </h3>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {t("featureExploreDescription")}
            </p>
          </div>

          <div className="rounded-2xl border p-5">
            <Tag className="text-primary size-6" />

            <h3 className="mt-4 font-semibold">
              {t("featureShareTitle")}
            </h3>

            <p className="text-muted-foreground mt-2 text-sm leading-6">
              {t("featureShareDescription")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}