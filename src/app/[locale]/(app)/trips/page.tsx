import { Plus } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { listOwnedTrips, listSharedTrips } from "@/server/services/trip.service";

export default async function TripsPage() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);

  if (!session) {
    return redirect({
      href: "/login?callbackUrl=/trips",
      locale,
    });
  }

  const [
    trips,
    sharedTrips,
    t,
    tStatus,
    tVisibility,
    format,
  ] = await Promise.all([
    listOwnedTrips(session.userId),
    listSharedTrips(session.userId),
    getTranslations("trip.dashboard"),
    getTranslations("tripStatus"),
    getTranslations("tripVisibility"),
    getFormatter(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("heading")}
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            {t("description")}
          </p>
        </div>

        <Button
          render={<Link href="/trips/new" />}
          nativeButton={false}
        >
          <Plus className="size-4" />
          {t("createButton")}
        </Button>
      </div>

      {trips.length === 0 && sharedTrips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground text-sm">
            {t("empty")}
          </p>

          <Button
            render={<Link href="/trips/new" />}
            nativeButton={false}
          >
            {t("emptyCta")}
          </Button>
        </div>
      ) : (
        <>
          {trips.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => {
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
                  <Link
                    key={trip.id}
                    href={`/trips/${trip.id}`}
                  >
                    <Card className="group hover:border-primary/40 h-full overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                      <div className="bg-muted relative h-56 w-full overflow-hidden">
                        {trip.coverImageUrl ? (
                          <img
                            src={trip.coverImageUrl}
                            alt={trip.name}
                            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="from-muted to-muted/40 flex h-full w-full items-center justify-center bg-gradient-to-br">
                            <span className="text-muted-foreground text-xs">
                              {t("noCover")}
                            </span>
                          </div>
                        )}
                      </div>

                      <CardHeader className="px-4 pt-4 pb-0">
                        <CardTitle className="line-clamp-2 text-base leading-snug">
                          {trip.name}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="flex min-h-28 flex-col gap-1.5 px-4 pt-2 pb-4 text-sm">
                        <span className="text-muted-foreground line-clamp-1">
                          {trip.destination}
                        </span>

                        {dateRange && (
                          <span className="text-muted-foreground text-xs">
                            {dateRange}
                          </span>
                        )}

                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                          <Badge variant="outline">
                            {tStatus(trip.status)}
                          </Badge>

                          <Badge variant="outline">
                            {tVisibility(trip.visibility)}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}

          {sharedTrips.length > 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold">
                  {t("sharedHeading")}
                </h2>

                <p className="text-muted-foreground mt-1 text-sm">
                  {t("sharedDescription")}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sharedTrips.map((trip) => {
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

                  const collaboratorRole =
                    trip.collaborators[0]?.role;

                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                    >
                      <Card className="group hover:border-primary/40 h-full overflow-hidden rounded-2xl border-border/70 py-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                        <div className="bg-muted relative h-56 w-full overflow-hidden">
                          {trip.coverImageUrl ? (
                            <img
                              src={trip.coverImageUrl}
                              alt={trip.name}
                              className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.02]"
                            />
                          ) : (
                            <div className="from-muted to-muted/40 flex h-full w-full items-center justify-center bg-gradient-to-br">
                              <span className="text-muted-foreground text-xs">
                                {t("noCover")}
                              </span>
                            </div>
                          )}
                        </div>

                        <CardHeader className="px-4 pt-4 pb-0">
                          <CardTitle className="line-clamp-2 text-base leading-snug">
                            {trip.name}
                          </CardTitle>
                        </CardHeader>

                        <CardContent className="flex min-h-32 flex-col gap-1.5 px-4 pt-2 pb-4 text-sm">
                          <span className="text-muted-foreground line-clamp-1">
                            {trip.destination}
                          </span>

                          {dateRange && (
                            <span className="text-muted-foreground text-xs">
                              {dateRange}
                            </span>
                          )}

                          <span className="text-muted-foreground text-xs">
                            {t("sharedBy", {
                              name: trip.owner.name,
                            })}
                          </span>

                          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                            <Badge variant="outline">
                              {tStatus(trip.status)}
                            </Badge>

                            <Badge variant="secondary">
                              {collaboratorRole === "EDITOR"
                                ? t("roleEditor")
                                : t("roleViewer")}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}