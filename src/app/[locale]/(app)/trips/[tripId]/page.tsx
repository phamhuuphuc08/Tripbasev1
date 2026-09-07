import {
  CalendarRange,
  Clapperboard,
  Gauge,
  Lock,
  MapPin,
  Play,
  TriangleAlert,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { removeExpenseAction } from "@/features/budget/actions";
import { toExpenseCategory } from "@/features/budget/categories";
import { ExpenseForm } from "@/features/budget/expense-form";
import { removeItineraryItemAction } from "@/features/itinerary/actions";
import { ItineraryItemForm } from "@/features/itinerary/itinerary-item-form";
import { detectBacktrack } from "@/features/map/geo";
import { TripMapLoader } from "@/features/map/trip-map-loader";
import { removeStorySlideAction } from "@/features/story/actions";
import { StorySlideForm } from "@/features/story/story-slide-form";
import { STORY_THEME_GRADIENT } from "@/features/story/themes";
import { removeTravelerAction } from "@/features/trip/actions";
import { toTripStyles } from "@/features/trip/styles";
import { TravelerForm } from "@/features/trip/traveler-form";
import { TripForm } from "@/features/trip/trip-form";
import { toTagCategory } from "@/features/tag-tip/categories";
import { getSession } from "@/server/auth/session";
import {
  computeBudgetSummary,
  listExpenses,
} from "@/server/services/budget.service";
import { listItineraryItems } from "@/server/services/itinerary.service";
import { listTagsForPicker } from "@/server/services/location-tag.service";
import { listStorySlides } from "@/server/services/story.service";
import { getTripDetail } from "@/server/services/trip.service";

function toDateInputValue(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

function toTimeLabel(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(11, 16);
}

const PACE_KEY = {
  RELAXED: "paceRelaxed",
  NORMAL: "paceNormal",
  BUSY: "paceBusy",
} as const;

const STYLE_KEY = {
  FOOD: "styleFood",
  SHOPPING: "styleShopping",
  CULTURE: "styleCulture",
  NATURE: "styleNature",
} as const;

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
  const [
    t,
    tStatus,
    tForm,
    tTravelers,
    tItinerary,
    tCategory,
    tMap,
    tBudget,
    tExpenseCategory,
    tStory,
    format,
  ] = await Promise.all([
    getTranslations("tripDetail"),
    getTranslations("tripStatus"),
    getTranslations("trip.form"),
    getTranslations("trip.travelers"),
    getTranslations("itinerary"),
    getTranslations("tagCategory"),
    getTranslations("map"),
    getTranslations("budget"),
    getTranslations("expenseCategory"),
    getTranslations("story"),
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

  const [items, tagOptions, expenses, budgetSummary, storySlides] =
    await Promise.all([
      listItineraryItems(tripId),
      isOwner ? listTagsForPicker() : Promise.resolve([]),
      listExpenses(tripId),
      computeBudgetSummary(tripId),
      listStorySlides(tripId),
    ]);

  const itemsByDay = new Map<number, typeof items>();
  for (const item of items) {
    const existing = itemsByDay.get(item.day) ?? [];
    existing.push(item);
    itemsByDay.set(item.day, existing);
  }
  const sortedDays = [...itemsByDay.keys()].sort((a, b) => a - b);
  const dayCount = sortedDays.length > 0 ? Math.max(...sortedDays) : 0;

  // Map Planner (M03): only items whose linked tag has coordinates can be
  // plotted — coordinates are optional on LocationTag, so most seed/demo
  // data won't have any until someone fills them in on /tags.
  const mapMarkers = items
    .filter(
      (item) =>
        item.locationTag?.latitude != null &&
        item.locationTag?.longitude != null,
    )
    .map((item) => ({
      id: item.id,
      latitude: item.locationTag!.latitude!,
      longitude: item.locationTag!.longitude!,
      title: item.locationTag!.title,
      category: toTagCategory(item.locationTag!.category),
      citeTrustScore: item.locationTag!.citeTrustScore,
      day: item.day,
      time: toTimeLabel(item.startTime),
    }));

  // Rule-based "đi vòng" check (mục 4/6a, không AI) — so quãng đường thực
  // tế trong ngày với thứ tự "gần nhau trước". Chỉ áp dụng cho ngày có ≥3
  // điểm có toạ độ.
  const backtrackDays = sortedDays.filter((day) =>
    detectBacktrack(
      mapMarkers
        .filter((marker) => marker.day === day)
        .map(({ latitude, longitude }) => ({ latitude, longitude })),
    ),
  );

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
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          <span className="flex items-center gap-1.5">
            <Users className="size-3.5" />
            {trip.travelerCount}
          </span>
          <span className="flex items-center gap-1.5">
            <Gauge className="size-3.5" />
            {tForm(PACE_KEY[trip.pace])}
          </span>
          {trip.budgetTarget != null && (
            <span className="flex items-center gap-1.5">
              <Wallet className="size-3.5" />
              {format.number(Number(trip.budgetTarget))} VND
            </span>
          )}
        </div>
        {toTripStyles(trip.travelStyle).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toTripStyles(trip.travelStyle).map((style) => (
              <Badge key={style} variant="outline">
                {tForm(STYLE_KEY[style])}
              </Badge>
            ))}
          </div>
        )}
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <User className="size-3" />
          {t.rich("meta", {
            owner: trip.owner.name,
            count: trip._count.itineraryItems,
            link: (chunks) => (
              <Link
                href={`/creators/${trip.owner.id}`}
                className="hover:text-foreground hover:underline"
              >
                {chunks}
              </Link>
            ),
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
                          aria-label={tTravelers("removeButtonNamed", {
                            name: traveler.name,
                          })}
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
                          {item.title && (
                            <span className="font-medium">{item.title}</span>
                          )}
                          {item.locationTag && (
                            <span
                              className={
                                item.title
                                  ? "text-muted-foreground text-xs"
                                  : "font-medium"
                              }
                            >
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
                              aria-label={tItinerary("removeButtonNamed", {
                                name:
                                  item.title ??
                                  item.locationTag?.title ??
                                  tItinerary("dayHeading", { day }),
                              })}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tMap("heading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {mapMarkers.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tMap("empty")}</p>
          ) : (
            <>
              <TripMapLoader markers={mapMarkers} />
              {backtrackDays.map((day) => (
                <p
                  key={day}
                  className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400"
                >
                  <TriangleAlert className="size-3.5 shrink-0" />
                  {tMap("backtrackWarning", { day })}
                </p>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{tBudget("heading")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">
                {tBudget("totalSpentLabel")}
              </span>
              <span className="font-medium">
                {format.number(budgetSummary.totalSpent)} VND
              </span>
            </div>
            {budgetSummary.budgetTarget != null ? (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">
                  {(budgetSummary.remaining ?? 0) < 0
                    ? tBudget("overBudgetLabel")
                    : tBudget("remainingLabel")}
                </span>
                <span
                  className={
                    (budgetSummary.remaining ?? 0) < 0
                      ? "text-destructive font-medium"
                      : "font-medium"
                  }
                >
                  {format.number(Math.abs(budgetSummary.remaining ?? 0))} VND
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                {tBudget("noTargetHint")}
              </p>
            )}
          </div>

          {budgetSummary.byCategory.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-muted-foreground text-xs font-medium">
                {tBudget("byCategoryHeading")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {budgetSummary.byCategory.map(({ category, total }) => (
                  <li key={category}>
                    <Badge variant="outline">
                      {tExpenseCategory(toExpenseCategory(category))}:{" "}
                      {format.number(total)} VND
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {budgetSummary.bySplitMember.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-muted-foreground text-xs font-medium">
                {tBudget("splitHeading")}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {budgetSummary.bySplitMember.map(({ name, owed }) => (
                  <li key={name}>
                    <Badge variant="secondary">
                      {name}: {format.number(Math.round(owed))} VND
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tBudget("expenseListEmpty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <li
                  key={expense.id}
                  className="border-border flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {tExpenseCategory(expense.category)} ·{" "}
                      {format.number(expense.amount)} VND
                    </span>
                    {expense.note && (
                      <span className="text-muted-foreground">
                        {expense.note}
                      </span>
                    )}
                    {expense.splitBetween.length > 0 && (
                      <span className="text-muted-foreground text-xs">
                        {expense.splitBetween.join(", ")}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <form
                      action={removeExpenseAction.bind(
                        null,
                        tripId,
                        expense.id,
                      )}
                    >
                      <button
                        type="submit"
                        aria-label={tBudget("removeButtonNamed", {
                          name: `${tExpenseCategory(expense.category)} ${format.number(expense.amount)} VND`,
                        })}
                        className="hover:bg-destructive/20 hover:text-destructive shrink-0 rounded-full p-1"
                      >
                        <X className="size-3.5" />
                      </button>
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isOwner && (
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">
                {tBudget("addHeading")}
              </h3>
              <ExpenseForm
                tripId={tripId}
                travelerNames={trip.travelers.map((traveler) => traveler.name)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clapperboard className="size-4" />
            {tStory("heading")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">{tStory("subtitle")}</p>

          {storySlides.length === 0 ? (
            <p className="text-muted-foreground text-sm">{tStory("empty")}</p>
          ) : (
            <>
              <Button
                render={<Link href={`/trips/${tripId}/story`} />}
                nativeButton={false}
                className="self-start"
              >
                <Play className="size-4" />
                {tStory("viewButton", { count: storySlides.length })}
              </Button>
              <ul className="flex flex-wrap gap-2">
                {storySlides.map((slide) => (
                  <li key={slide.id} className="relative">
                    <span
                      className={`flex h-24 w-16 flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br bg-cover bg-center p-1.5 text-[10px] text-white ${
                        slide.photo ? "" : STORY_THEME_GRADIENT[slide.theme]
                      }`}
                      style={
                        slide.photo
                          ? { backgroundImage: `url(${slide.photo})` }
                          : undefined
                      }
                    >
                      <span className="line-clamp-4 drop-shadow">
                        {slide.caption}
                      </span>
                    </span>
                    {isOwner && (
                      <form
                        action={removeStorySlideAction.bind(
                          null,
                          tripId,
                          slide.id,
                        )}
                      >
                        <button
                          type="submit"
                          aria-label={tStory("removeButtonNamed", {
                            name: slide.caption.slice(0, 24),
                          })}
                          className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                        >
                          <X className="size-3" />
                        </button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}

          {isOwner && (
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">
                {tStory("addHeading")}
              </h3>
              <StorySlideForm tripId={tripId} dayCount={dayCount} />
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
                travelerCount: trip.travelerCount,
                budgetTarget: trip.budgetTarget?.toString() ?? "",
                pace: trip.pace,
                travelStyle: toTripStyles(trip.travelStyle),
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
