import { Plus } from "lucide-react";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { listOwnedTrips } from "@/server/services/trip.service";

export default async function TripsPage() {
  const [session, locale] = await Promise.all([getSession(), getLocale()]);
  if (!session) {
    return redirect({ href: "/login?callbackUrl=/trips", locale });
  }

  const [trips, t, tStatus, tVisibility, format] = await Promise.all([
    listOwnedTrips(session.userId),
    getTranslations("trip.dashboard"),
    getTranslations("tripStatus"),
    getTranslations("tripVisibility"),
    getFormatter(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{t("heading")}</h1>
        <Button render={<Link href="/trips/new" />} nativeButton={false}>
          <Plus className="size-4" />
          {t("createButton")}
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-muted-foreground text-sm">{t("empty")}</p>
          <Button render={<Link href="/trips/new" />} nativeButton={false}>
            {t("emptyCta")}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => {
            const dateRange =
              trip.startDate && trip.endDate
                ? format.dateTimeRange(trip.startDate, trip.endDate, {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : null;

            return (
              <Link key={trip.id} href={`/trips/${trip.id}`}>
                <Card className="hover:border-primary/40 h-full gap-3 py-5 transition-colors">
                  <CardHeader>
                    <CardTitle className="text-base leading-snug">
                      {trip.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-1.5 text-sm">
                    <span>{trip.destination}</span>
                    {dateRange && (
                      <span className="text-muted-foreground">{dateRange}</span>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline">{tStatus(trip.status)}</Badge>
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
    </div>
  );
}
