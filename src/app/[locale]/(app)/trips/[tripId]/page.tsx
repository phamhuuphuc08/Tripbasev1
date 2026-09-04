import { CalendarRange, Lock, MapPin, User } from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";
import { getTripDetail } from "@/server/services/trip.service";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await getSession();
  const result = await getTripDetail(tripId, session?.userId);

  if (!result) notFound();

  const { trip, requiresLogin } = result;
  const [t, tStatus, format] = await Promise.all([
    getTranslations("tripDetail"),
    getTranslations("tripStatus"),
    getFormatter(),
  ]);

  if (requiresLogin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Lock className="size-5" />
        </span>
        <h1 className="text-xl font-semibold">{trip.name}</h1>
        <p className="text-muted-foreground text-sm">
          {t("gateDescription", { destination: trip.destination })}
        </p>
        <Button
          render={<Link href={`/login?callbackUrl=/trips/${trip.id}`} />}
          nativeButton={false}
        >
          {t("loginCta")}
        </Button>
      </div>
    );
  }

  const dateRange =
    trip.startDate && trip.endDate
      ? format.dateTimeRange(trip.startDate, trip.endDate, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-12">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{trip.name}</h1>
        <Badge variant="outline">
          {tStatus(trip.status as "IDEA" | "SCHEDULED" | "COMPLETED")}
        </Badge>
      </div>
      <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <MapPin className="text-primary size-3.5" />
        {trip.destination}
      </p>
      {dateRange && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <CalendarRange className="size-3.5" />
          {dateRange}
        </p>
      )}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <User className="size-3" />
        {t("meta", {
          owner: trip.owner.name,
          count: trip._count.itineraryItems,
        })}
      </p>
      <p className="text-muted-foreground mt-6 text-xs">
        {t.rich("modulesNote", {
          module: (chunks) => <code>{chunks}</code>,
        })}
      </p>
    </div>
  );
}
