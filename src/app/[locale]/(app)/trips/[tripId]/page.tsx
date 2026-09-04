import { CalendarRange, Lock, MapPin, User, X } from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { removeItineraryItemAction } from "@/features/itinerary/actions";
import { ItineraryItemForm } from "@/features/itinerary/itinerary-item-form";
import { removeTravelerAction } from "@/features/trip/actions";
import { TravelerForm } from "@/features/trip/traveler-form";
import { TripForm } from "@/features/trip/trip-form";
import { toTagCategory } from "@/features/tag-tip/categories";
import { getSession } from "@/server/auth/session";
import { listItineraryItems } from "@/server/services/itinerary.service";
import { listTagsForPicker } from "@/server/services/location-tag.service";
import { getTripDetail } from "@/server/services/trip.service";

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function toTimeLabel(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(11, 16);
}

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await getSession();
  const result = await getTripDetail(tripId, session?.userId);

  if (!result) notFound();

  const { trip, isOwner, requiresLogin } = result;
  const [t, tStatus, tForm, tTravelers, tItinerary, tCategory, format] =
    await Promise.all([
      getTranslations("tripDetail"),
      getTranslations("tripStatus"),
      getTranslations("trip.form"),
      getTranslations("trip.travelers"),
      getTranslations("itinerary"),
      getTranslations("tagCategory"),
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

  const [items, tagOptions] = await Promise.all([
    listItineraryItems(tripId),
    isOwner ? listTagsForPicker() : Promise.resolve([]),
  ]);

  const itemsByDay = new Map<number, typeof items>();
  for (const item of items) {
    const existing = itemsByDay.get(item.day) ?? [];
    existing.push(item);
    itemsByDay.set(item.day, existing);
  }
  const sortedDays = [...itemsByDay.keys()].sort((a, b) => a - b);
  const dayCount = sortedDays.length > 0 ? Math.max(...sortedDays) : 0;

  const dateRange =
    trip.startDate && trip.endDate
      ? format.dateTimeRange(trip.startDate, trip.endDate, {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tTravelers("heading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {trip.travelers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tTravelers("empty")}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trip.travelers.map((traveler) => (
                <li key={traveler.id}>
                  <Badge variant="secondary" className="gap-1.5 py-1 pr-1">
                    {traveler.name}
                    {traveler.ageGroup && (
                      <span className="text-muted-foreground">
                        ({traveler.ageGroup})
                      </span>
                    )}
                    {isOwner && (
                      <form
                        action={removeTravelerAction.bind(
                          null,
                          tripId,
                          traveler.id,
                        )}
                      >
                        <button
                          type="submit"
                          aria-label={tTravelers("removeButton")}
                          className="hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </form>
                    )}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          {isOwner && <TravelerForm tripId={tripId} />}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tItinerary("heading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {sortedDays.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tItinerary("empty")}
            </p>
          ) : (
            sortedDays.map((day) => (
              <div key={day} className="flex flex-col gap-2">
                <h3 className="text-sm font-medium">
                  {tItinerary("dayHeading", { day })}
                </h3>
                <ul className="flex flex-col gap-2">
                  {(itemsByDay.get(day) ?? []).map((item) => {
                    const startLabel = toTimeLabel(item.startTime);
                    const endLabel = toTimeLabel(item.endTime);
                    return (
                      <li
                        key={item.id}
                        className="border-border flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                      >
                        <div className="flex flex-col gap-0.5">
                          {(startLabel || endLabel) && (
                            <span className="text-muted-foreground text-xs">
                              {startLabel ?? "?"}
                              {endLabel ? ` – ${endLabel}` : ""}
                            </span>
                          )}
                          {item.locationTag && (
                            <span className="font-medium">
                              {tCategory(
                                toTagCategory(item.locationTag.category),
                              )}{" "}
                              {item.locationTag.title}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-muted-foreground">
                              {item.notes}
                            </span>
                          )}
                        </div>
                        {isOwner && (
                          <form
                            action={removeItineraryItemAction.bind(
                              null,
                              tripId,
                              item.id,
                            )}
                          >
                            <button
                              type="submit"
                              aria-label={tItinerary("removeButton")}
                              className="hover:bg-destructive/20 hover:text-destructive shrink-0 rounded-full p-1"
                            >
                              <X className="size-3.5" />
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}

          {isOwner && (
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">
                {tItinerary("addHeading")}
              </h3>
              <ItineraryItemForm
                tripId={tripId}
                dayCount={dayCount}
                tagOptions={tagOptions}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{tForm("editTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <TripForm
              mode="edit"
              defaultValues={{
                id: trip.id,
                name: trip.name,
                destination: trip.destination,
                startDate: toDateInputValue(trip.startDate),
                endDate: toDateInputValue(trip.endDate),
                visibility: trip.visibility,
                status: trip.status,
              }}
            />
            <Link
              href={`/trips/${trip.id}/delete`}
              className="text-destructive self-start text-sm underline"
            >
              {tForm("deleteLink")}
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
