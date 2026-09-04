import { Clock, MapPin } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { listTripItinerary } from "@/server/services/itinerary.service";

export async function ItineraryTimeline({ tripId }: { tripId: string }) {
  const [items, t, format] = await Promise.all([
    listTripItinerary(tripId),
    getTranslations("itinerary.timeline"),
    getFormatter(),
  ]);

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
        {t("empty")}
      </div>
    );
  }

  const grouped = items.reduce<Record<number, typeof items>>((groups, item) => {
    (groups[item.day] ??= []).push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([day, dayItems]) => (
        <div key={day} className="space-y-3">
          <h3 className="font-semibold">{t("day", { day })}</h3>

          <div className="border-l-2 pl-4">
            {dayItems.map((item) => {
              const start = item.startTime
                ? format.dateTime(item.startTime, { hour: "2-digit", minute: "2-digit" })
                : null;

              const end = item.endTime
                ? format.dateTime(item.endTime, { hour: "2-digit", minute: "2-digit" })
                : null;

              return (
                <div key={item.id} className="relative pb-6 last:pb-0">
                  <span className="bg-primary absolute -left-[21px] top-1.5 size-2.5 rounded-full" />

                  <div className="rounded-lg border p-4">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-medium">{item.title}</h4>

                      {(start || end) && (
                        <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
                          <Clock className="size-3.5" />
                          {start ?? "—"}{end ? ` - ${end}` : ""}
                        </span>
                      )}
                    </div>

                    {item.place && (
                      <p className="text-muted-foreground mt-2 flex items-center gap-1 text-sm">
                        <MapPin className="size-3.5" />
                        {item.place.name}
                      </p>
                    )}

                    {item.notes && (
                      <p className="text-muted-foreground mt-2 text-sm">{item.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}