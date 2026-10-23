import {
  CalendarRange,
  Clapperboard,
  Gauge,
  GitFork,
  Lock,
  MapPin,
  Pencil,
  Play,
  TriangleAlert,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { ChecklistManager } from "@/features/checklist/checklist-manager";
import {
  listChecklistAssignees,
  listChecklistItems,
} from "@/server/services/checklist.service";
import { ShareLinkManager } from "@/features/share/share-link-manager";
import { listTripShareLinks } from "@/server/services/share-link.service";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { removeExpenseAction } from "@/features/budget/actions";
import { BudgetChart } from "@/features/budget/budget-chart";
import { toExpenseCategory } from "@/features/budget/categories";
import { ExpenseForm } from "@/features/budget/expense-form";
import { removeBookingAction } from "@/features/booking/actions";
import { BookingForm } from "@/features/booking/booking-form";
import { CollaboratorManager } from "@/features/share/collaborator-manager";
import { InviteForm } from "@/features/share/invite-form";
import { CopyPlanDayButton } from "@/features/copy-plan/copy-plan-button";
import { CopyPlanProgress } from "@/features/copy-plan/copy-plan-progress";
import { CopyPlanDaysSelector } from "@/features/copy-plan/copy-plan-days-selector";
import { ItineraryItemForm } from "@/features/itinerary/itinerary-item-form";
import { ItinerarySortableTimeline } from "@/features/itinerary/itinerary-sortable-timeline";
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
import { listTripCollaborators } from "@/server/services/collaborator.service";
import {
  computeBudgetSummary,
  listExpenses,
} from "@/server/services/budget.service";
import { listBookings } from "@/server/services/booking.service";
import {
  detectItineraryOpeningHours,
  detectItineraryOverlaps,
  detectItineraryShortGaps,
  detectItineraryTravel,
  listItineraryItems,
  summarizeItineraryVotes,
} from "@/server/services/itinerary.service";
import { listTagsForPicker } from "@/server/services/location-tag.service";
import { listStorySlides } from "@/server/services/story.service";
import { getTripDetail } from "@/server/services/trip.service";
import {
  getTripNegativeSignals,
  getTripVerifiedVisits,
} from "@/server/services/cite-trust.service";

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
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{
    editItem?: string;
    editExpense?: string;
    editBooking?: string;
    shareToken?: string;
  }>;
}) {
  const { tripId } = await params;
  const { editItem, editExpense, editBooking, shareToken } = await searchParams;

  const session = await getSession();
  const result = await getTripDetail(tripId, session?.userId, shareToken);

  if (!result) notFound();

  const { trip, isOwner, canEdit, requiresLogin } = result;

const [
  t,
  tStatus,
  tForm,
  tTravelers,
  tItinerary,
  tCategory,
  tMap,
  tBudget,
  tBooking,
  tExpenseCategory,
  tShare,
  tChecklist,
  tStory,
  tCopyPlan,
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
  getTranslations("booking"),
  getTranslations("expenseCategory"),
  getTranslations("share.invite"),
  getTranslations("checklist"),
  getTranslations("story"),
  getTranslations("copyPlan"),
  getFormatter(),
]);

const loginCallbackHref = shareToken
  ? `/trips/${trip.id}?shareToken=${encodeURIComponent(shareToken)}`
  : `/trips/${trip.id}`;

  if (requiresLogin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-24 text-center">
        <span className="bg-muted text-muted-foreground flex size-12 items-center justify-center rounded-full">
          <Lock className="size-5" />
        </span>

        <h1 className="text-xl font-semibold">{trip.name}</h1>

        <p className="text-muted-foreground text-sm">
          {t("gateDescription", {
            destination: trip.destination,
          })}
        </p>

        <Button
          render={
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(loginCallbackHref)}`}
            />
          }
          nativeButton={false}
        >
          {t("loginCta")}
        </Button>
      </div>
    );
  }

const [
  items,
  tagOptions,
  expenses,
  budgetSummary,
  bookings,
  storySlides,
  collaborators,
  shareLinks,
  checklistItems,
  checklistAssignees,
  verifiedVisits,
  negativeSignals,
] = await Promise.all([
  listItineraryItems(tripId),
  canEdit ? listTagsForPicker() : Promise.resolve([]),
  listExpenses(tripId),
  computeBudgetSummary(tripId),
  listBookings(tripId, session?.userId, shareToken),
  listStorySlides(tripId),
  isOwner && session ? listTripCollaborators(tripId, session.userId) : Promise.resolve([]),
  isOwner && session ? listTripShareLinks(tripId, session.userId) : Promise.resolve([]),
  listChecklistItems(tripId, session?.userId, shareToken),
  canEdit && session
    ? listChecklistAssignees(tripId, session.userId, shareToken)
    : Promise.resolve([]),
  getTripVerifiedVisits(tripId),
  getTripNegativeSignals(tripId),
]);

const shareLinkItems = shareLinks.map((link) => ({
  id: link.id,
  token: link.token,
  type: link.type,
  expiresAt: link.expiresAt?.toISOString() ?? null,
  revokedAt: link.revokedAt?.toISOString() ?? null,
}));

const checklistManagerItems = checklistItems.map((item) => ({
  id: item.id,
  title: item.title,
  dueDate: item.dueDate
    ? item.dueDate.toISOString().slice(0, 10)
    : null,
  status: item.status,
  assignedTo: item.assignedTo
    ? {
        id: item.assignedTo.id,
        name: item.assignedTo.name,
      }
    : null,
}));

  const sortedDays = [
    ...new Set(items.map((item) => item.day)),
  ].sort((a, b) => a - b);

  const dayCount =
    sortedDays.length > 0
      ? Math.max(...sortedDays)
      : 0;

  const editingItem =
    canEdit && editItem
      ? items.find((item) => item.id === editItem)
      : undefined;

  const editingExpense =
    canEdit && editExpense
      ? expenses.find(
          (expense) => expense.id === editExpense,
        )
      : undefined;

  const editingBooking =
    canEdit && editBooking
      ? bookings.find(
          (booking) => booking.id === editBooking,
        )
      : undefined;

  const itineraryOverlaps =
    detectItineraryOverlaps(items);

  const overlapMap = new Map(
    itineraryOverlaps.map((overlap) => [
      overlap.itemId,
      overlap.overlappingItemIds,
    ]),
  );

  const itemById = new Map(
    items.map((item) => [item.id, item]),
  );

  const itineraryShortGaps =
    detectItineraryShortGaps(items);

  const shortGapMap = new Map(
    itineraryShortGaps.map((gap) => [
      gap.itemId,
      gap,
    ]),
  );

  const itineraryTravel =
    detectItineraryTravel(items);

  const travelMap = new Map(
    itineraryTravel.map((segment) => [
      segment.itemId,
      segment,
    ]),
  );

  const itineraryOpeningHours =
    detectItineraryOpeningHours(items);

  const openingHoursMap = new Map(
    itineraryOpeningHours.map((warning) => [
      warning.itemId,
      warning,
    ]),
  );

  const tripDayCount =
    trip.startDate && trip.endDate
      ? Math.max(
          1,
          Math.floor(
            (
              Date.UTC(
                trip.endDate.getUTCFullYear(),
                trip.endDate.getUTCMonth(),
                trip.endDate.getUTCDate(),
              ) -
              Date.UTC(
                trip.startDate.getUTCFullYear(),
                trip.startDate.getUTCMonth(),
                trip.startDate.getUTCDate(),
              )
            ) /
              86400000,
          ) + 1,
        )
      : Math.max(dayCount, 1);

  const sortableItems = items.map((item) => {
    const overlappingNames = (overlapMap.get(item.id) ?? []).flatMap((overlapId) => {
      const overlapItem = itemById.get(overlapId);

      if (!overlapItem) return [];

      return [
        overlapItem.title ||
          overlapItem.locationTag?.title ||
          tItinerary("dayHeading", { day: overlapItem.day }),
      ];
    });

  const shortGap = shortGapMap.get(item.id);
  const previousGapItem = shortGap ? itemById.get(shortGap.previousItemId) : undefined;

  const travel = travelMap.get(item.id);
  const previousTravelItem = travel ? itemById.get(travel.previousItemId) : undefined;

  const openingHoursWarning = openingHoursMap.get(item.id);

  return {
    id: item.id,
    day: item.day,
    sortOrder: item.sortOrder,
    title: item.title || "",
    displayStart: toTimeLabel(item.startTime),
    displayEnd: toTimeLabel(item.endTime),
    notes: item.notes ?? null,

    locationTagId: item.locationTagId ?? null,

    locationTagTitle: item.locationTag
      ? `${tCategory(toTagCategory(item.locationTag.category))} ${item.locationTag.title}`
      : null,

    verifiedVisit: item.locationTagId
      ? verifiedVisits.get(item.locationTagId) ?? false
      : false,
negativeSignalType: item.locationTagId
  ? negativeSignals.get(item.locationTagId)?.type ?? null
  : null,

negativeSignalNote: item.locationTagId
  ? negativeSignals.get(item.locationTagId)?.note ?? null
  : null,
    overlappingNames,

    shortGap: shortGap
      ? {
          minutes: shortGap.gapMinutes,
          previousName:
            previousGapItem?.title ||
            previousGapItem?.locationTag?.title ||
            tItinerary("dayHeading", {
              day: previousGapItem?.day ?? item.day,
            }),
        }
      : null,

    travel: travel
      ? {
          distanceKm: travel.distanceKm,
          estimatedMinutes: travel.estimatedMinutes,
          availableMinutes: travel.availableMinutes,
          insufficientTravelTime: travel.insufficientTravelTime,
          previousName:
            previousTravelItem?.title ||
            previousTravelItem?.locationTag?.title ||
            tItinerary("dayHeading", {
              day: previousTravelItem?.day ?? item.day,
            }),
        }
      : null,

    openingHoursWarning: openingHoursWarning
      ? {
          openingHours: openingHoursWarning.openingHours,
          placeName: openingHoursWarning.placeName,
        }
      : null,

    votes: summarizeItineraryVotes(item.votes, session?.userId),

    comments: item.comments.map((comment) => ({
      id: comment.id,
      userId: comment.userId,
      userName: comment.user.name,
      content: comment.content,
    })),
  };
});

  const mapMarkers = items
    .filter(
      (item) =>
        item.locationTag?.latitude != null &&
        item.locationTag?.longitude != null,
    )
    .map((item) => ({
      id: item.id,
      latitude:
        item.locationTag!.latitude!,
      longitude:
        item.locationTag!.longitude!,
      title: item.locationTag!.title,
      category: toTagCategory(
        item.locationTag!.category,
      ),
      citeTrustScore:
        item.locationTag!.citeTrustScore,
      day: item.day,
      time: toTimeLabel(item.startTime),
      openingHours:
        item.locationTag!.openingHours,
    }));

  const backtrackDays =
    sortedDays.filter((day) =>
      detectBacktrack(
        mapMarkers
          .filter(
            (marker) =>
              marker.day === day,
          )
          .map(
            ({
              latitude,
              longitude,
            }) => ({
              latitude,
              longitude,
            }),
          ),
      ),
    );

  const dateRange =
    trip.startDate && trip.endDate
      ? format.dateTimeRange(
          trip.startDate,
          trip.endDate,
          {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          },
        )
      : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12">
      {trip.coverImageUrl && (
        <div className="overflow-hidden rounded-xl border">
          <img
            src={trip.coverImageUrl}
            alt={trip.name}
            className="h-56 w-full object-cover sm:h-72"
          />
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold">
            {trip.name}
          </h1>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {tStatus(
                trip.status as
                  | "IDEA"
                  | "SCHEDULED"
                  | "COMPLETED",
              )}
            </Badge>

            {trip.verifiedByAuthor && (
              <Badge variant="secondary">
                {t("verifiedTrip")}
              </Badge>
            )}
          </div>
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
              {format.number(
                Number(trip.budgetTarget),
              )}{" "}
              VND
            </span>
          )}
        </div>

        {toTripStyles(
          trip.travelStyle,
        ).length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {toTripStyles(
              trip.travelStyle,
            ).map((style) => (
              <Badge
                key={style}
                variant="outline"
              >
                {tForm(
                  STYLE_KEY[style],
                )}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <User className="size-3" />

          {t.rich("meta", {
            owner: trip.owner.name,
            count:
              trip._count.itineraryItems,

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
{trip.forkedFrom && (
  <div className="bg-muted/50 flex flex-col gap-4 rounded-lg px-3 py-3">
    <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
      <GitFork className="text-primary size-3.5" />

      <span>{tCopyPlan("copiedFrom")}</span>

      <Link
        href={`/trips/${trip.forkedFrom.id}`}
        className="text-foreground font-medium hover:underline"
      >
        {trip.forkedFrom.name}
      </Link>

      <span>· {tCopyPlan("originalOwner")}</span>

      <Link
        href={`/creators/${trip.forkedFrom.owner.id}`}
        className="text-foreground font-medium hover:underline"
      >
        {trip.forkedFrom.owner.name}
      </Link>
    </div>

    {trip.copyRecord && (
      <CopyPlanProgress
        tripId={trip.id}
        retentionRate={
          trip.copyRecord.retentionRate
        }
        completed={
          trip.copyRecord.completed
        }
        postTripRating={
          trip.copyRecord.postTripRating
        }
        canManage={isOwner}
      />
    )}
  </div>
)}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tTravelers("heading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {trip.travelers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tTravelers("empty")}
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {trip.travelers.map(
                (traveler) => (
                  <li key={traveler.id}>
                    <Badge
                      variant="secondary"
                      className="gap-1.5 py-1 pr-1"
                    >
                      {traveler.name}

                      {traveler.ageGroup && (
                        <span className="text-muted-foreground">
                          (
                          {
                            traveler.ageGroup
                          }
                          )
                        </span>
                      )}

                      {canEdit && (
                        <form
                          action={removeTravelerAction.bind(
                            null,
                            tripId,
                            traveler.id,
                            shareToken ?? null,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={tTravelers(
                              "removeButtonNamed",
                              {
                                name:
                                  traveler.name,
                              },
                            )}
                            className="hover:bg-destructive/20 hover:text-destructive rounded-full p-0.5"
                          >
                            <X className="size-3" />
                          </button>
                        </form>
                      )}
                    </Badge>
                  </li>
                ),
              )}
            </ul>
          )}

          {canEdit && (
            <TravelerForm
              tripId={tripId}
              shareToken={shareToken}
            />
          )}
        </CardContent>
      </Card>

{isOwner && (
  <Card id="share">
    <CardHeader>
      <CardTitle className="text-base">{tShare("heading")}</CardTitle>
    </CardHeader>

    <CardContent className="flex flex-col gap-6">
      <InviteForm tripId={tripId} />

      <div className="border-t pt-5">
        <CollaboratorManager
          tripId={tripId}
          collaborators={collaborators}
        />
      </div>

      <div className="border-t pt-5">
        <ShareLinkManager
          tripId={tripId}
          links={shareLinkItems}
        />
      </div>
    </CardContent>
  </Card>
)}

<Card id="checklist">
  <CardHeader>
    <CardTitle className="text-base">
      {tChecklist("heading")}
    </CardTitle>
  </CardHeader>

  <CardContent>
    <ChecklistManager
      tripId={tripId}
      items={checklistManagerItems}
      assignees={checklistAssignees}
      canEdit={canEdit}
      shareToken={shareToken}
    />
  </CardContent>
</Card>

<Card id="itinerary">
  <CardHeader>
    <CardTitle className="text-base">
      {tItinerary("heading")}
    </CardTitle>
  </CardHeader>

  <CardContent className="flex flex-col gap-5">
{trip.visibility === "PUBLIC" &&
  !isOwner &&
  sortedDays.length > 0 && (
    <div className="flex flex-col gap-5">
      {/* Copy nhanh một ngày */}
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          {tCopyPlan("copySingleDayDescription")}
        </p>

        <div className="flex flex-wrap gap-2">
          {sortedDays.map((day) => (
            <CopyPlanDayButton
              key={day}
              tripId={tripId}
              day={day}
            />
          ))}
        </div>
      </div>

      {/* Copy nhiều ngày */}
      {sortedDays.length > 1 && (
        <div className="border-t pt-4">
          <CopyPlanDaysSelector
            tripId={tripId}
            days={sortedDays}
          />
        </div>
      )}
    </div>
  )}

    {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tItinerary("empty")}
            </p>
          ) : (
            <ItinerarySortableTimeline
              tripId={tripId}
              initialItems={sortableItems}
              isOwner={isOwner}
              currentUserId={session?.userId ?? null}
              totalDays={tripDayCount}
              tripStatus={trip.status}
              shareToken={shareToken}
            />
          )}

          {canEdit && (
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">
                  {editingItem
                    ? tItinerary(
                        "editHeading",
                      )
                    : tItinerary(
                        "addHeading",
                      )}
                </h3>

                {editingItem && (
                  <Link
                    href={
                      shareToken
                        ? `/trips/${tripId}?shareToken=${encodeURIComponent(shareToken)}#itinerary`
                        : `/trips/${tripId}#itinerary`
                    }
                    className="text-muted-foreground hover:text-foreground text-sm underline"
                  >
                    {tItinerary(
                      "cancelEdit",
                    )}
                  </Link>
                )}
              </div>

              <ItineraryItemForm
                key={
                  editingItem?.id ??
                  "new"
                }
                tripId={tripId}
                dayCount={
                  trip.startDate &&
                  trip.endDate
                    ? tripDayCount
                    : Math.max(
                        dayCount,
                        1,
                      ) + 1
                }
                tagOptions={
                  tagOptions
                }
                editingItem={
                  editingItem
                    ? {
                        id:
                          editingItem.id,
                        day:
                          editingItem.day,
                        title:
                          editingItem.title,
                        startTime:
                          editingItem.startTime,
                        endTime:
                          editingItem.endTime,
                        notes:
                          editingItem.notes,
                        locationTagId:
                          editingItem.locationTagId,
                      }
                    : undefined
                }
                shareToken={shareToken}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {tMap("heading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {mapMarkers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tMap("empty")}
            </p>
          ) : (
            <>
              <TripMapLoader
                markers={mapMarkers}
              />

              {backtrackDays.map(
                (day) => (
                  <p
                    key={day}
                    className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400"
                  >
                    <TriangleAlert className="size-3.5 shrink-0" />

                    {tMap(
                      "backtrackWarning",
                      { day },
                    )}
                  </p>
                ),
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card id="budget">
        <CardHeader>
          <CardTitle className="text-base">
            {tBudget("heading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-xs">
                {tBudget(
                  "totalSpentLabel",
                )}
              </span>

              <span className="font-medium">
                {format.number(
                  budgetSummary.totalSpent,
                )}{" "}
                VND
              </span>
            </div>

            {budgetSummary.budgetTarget !=
            null ? (
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">
                  {(budgetSummary.remaining ??
                    0) < 0
                    ? tBudget(
                        "overBudgetLabel",
                      )
                    : tBudget(
                        "remainingLabel",
                      )}
                </span>

                <span
                  className={
                    (budgetSummary.remaining ??
                      0) < 0
                      ? "text-destructive font-medium"
                      : "font-medium"
                  }
                >
                  {format.number(
                    Math.abs(
                      budgetSummary.remaining ??
                        0,
                    ),
                  )}{" "}
                  VND
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                {tBudget(
                  "noTargetHint",
                )}
              </p>
            )}
          </div>

          {budgetSummary.byCategory.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-muted-foreground text-xs font-medium">
                {tBudget("byCategoryHeading")}
              </h3>

              <BudgetChart
                slices={budgetSummary.byCategory.map(({ category, total }) => ({
                  category: toExpenseCategory(category),
                  total,
                }))}
                totalLabel={tBudget("totalSpentLabel")}
                categoryLabel={tExpenseCategory}
                formatAmount={(value) => `${format.number(value)} VND`}
              />
            </div>
          )}

          {budgetSummary.bySplitMember
            .length > 0 && (
            <div className="flex flex-col gap-1.5">
              <h3 className="text-muted-foreground text-xs font-medium">
                {tBudget(
                  "splitHeading",
                )}
              </h3>

              <ul className="flex flex-wrap gap-2">
                {budgetSummary.bySplitMember.map(
                  ({ name, owed }) => (
                    <li key={name}>
                      <Badge variant="secondary">
                        {name}:{" "}
                        {format.number(
                          Math.round(
                            owed,
                          ),
                        )}{" "}
                        VND
                      </Badge>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {budgetSummary.settlements
            .length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-sm font-medium">
                {tBudget(
                  "settlementHeading",
                )}
              </h3>

              <ul className="flex flex-col gap-2">
                {budgetSummary.settlements.map(
                  (
                    settlement,
                    index,
                  ) => (
                    <li
                      key={`${settlement.from}-${settlement.to}-${index}`}
                      className="border-border flex flex-wrap items-center gap-1.5 rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-medium">
                        {
                          settlement.from
                        }
                      </span>

                      <span className="text-muted-foreground">
                        →
                      </span>

                      <span className="font-medium">
                        {settlement.to}
                      </span>

                      <span className="text-muted-foreground">
                        ·
                      </span>

                      <span>
                        {format.number(
                          Math.round(
                            settlement.amount,
                          ),
                        )}{" "}
                        VND
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          )}

          {budgetSummary.balances
            .length > 0 &&
            budgetSummary.settlements
              .length === 0 &&
            budgetSummary.balances.every(
              (member) =>
                Math.abs(
                  member.balance,
                ) < 0.01,
            ) && (
              <p className="text-muted-foreground text-sm">
                {tBudget("settled")}
              </p>
            )}

          {expenses.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tBudget(
                "expenseListEmpty",
              )}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {expenses.map(
                (expense) => (
                  <li
                    key={expense.id}
                    className="border-border flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium">
                        {tExpenseCategory(
                          expense.category,
                        )}{" "}
                        ·{" "}
                        {format.number(
                          expense.amount,
                        )}{" "}
                        VND
                      </span>

                      {expense.note && (
                        <span className="text-muted-foreground text-xs">
                          {
                            expense.note
                          }
                        </span>
                      )}

                      {expense
                        .splitBetween
                        .length >
                        0 && (
                        <span className="text-muted-foreground text-xs">
                          {expense.splitBetween.join(
                            ", ",
                          )}
                        </span>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                            href={
                                shareToken
                                  ? `/trips/${tripId}?shareToken=${encodeURIComponent(shareToken)}&editExpense=${expense.id}#budget`
                                  : `/trips/${tripId}?editExpense=${expense.id}#budget`
                              }
                          aria-label={tBudget(
                            "editButtonNamed",
                            {
                              name: `${tExpenseCategory(
                                expense.category,
                              )} ${format.number(
                                expense.amount,
                              )} VND`,
                            },
                          )}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1"
                        >
                          <Pencil className="size-3.5" />
                        </Link>

                        <form
                          action={removeExpenseAction.bind(
                            null,
                            tripId,
                            expense.id,
                            shareToken ?? null,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={tBudget(
                              "removeButtonNamed",
                              {
                                name: `${tExpenseCategory(
                                  expense.category,
                                )} ${format.number(
                                  expense.amount,
                                )} VND`,
                              },
                            )}
                            className="hover:bg-destructive/20 hover:text-destructive rounded-full p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}

          {canEdit && (
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">
                  {editingExpense
                    ? tBudget(
                        "editHeading",
                      )
                    : tBudget(
                        "addHeading",
                      )}
                </h3>

                {editingExpense && (
                  <Link
                    href={
                      shareToken
                        ? `/trips/${tripId}?shareToken=${encodeURIComponent(shareToken)}#budget`
                        : `/trips/${tripId}#budget`
                    }
                    className="text-muted-foreground hover:text-foreground text-sm underline"
                  >
                    {tBudget(
                      "cancelEdit",
                    )}
                  </Link>
                )}
              </div>

              <ExpenseForm
                key={
                  editingExpense?.id ??
                  "new"
                }
                tripId={tripId}
                travelerNames={trip.travelers.map(
                  (traveler) =>
                    traveler.name,
                )}
                editingExpense={
                  editingExpense
                    ? {
                        id:
                          editingExpense.id,
                        category:
                          editingExpense.category,
                        amount:
                          editingExpense.amount,
                        note:
                          editingExpense.note,
                        splitBetween:
                          editingExpense.splitBetween,
                      }
                    : undefined
                }
                shareToken={shareToken}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card id="booking">
        <CardHeader>
          <CardTitle className="text-base">
            {tBooking("heading")}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          {bookings.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tBooking("empty")}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {bookings.map(
                (booking) => (
                  <li
                    key={booking.id}
                    className="border-border flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col gap-1">
                      <span className="font-medium">
                        {booking.type}
                      </span>

                      {booking.provider && (
                        <span className="text-muted-foreground text-xs">
                          {tBooking("form.providerLabel")}:{" "}
                          {booking.provider}
                        </span>
                      )}

                      {booking.confirmationCode && (
                        <span className="text-muted-foreground text-xs">
                          {tBooking("form.confirmationCodeLabel")}:{" "}
                          {booking.confirmationCode}
                        </span>
                      )}

                      {booking.dateTime && (
                        <span className="text-muted-foreground text-xs">
                          {tBooking("form.dateTimeLabel")}:{" "}
                          {format.dateTime(
                            booking.dateTime,
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      )}

                      {booking.fileUrl && (
                        <a
                          href={
                            booking.fileUrl.startsWith("booking-document:")
                              ? shareToken
                                ? `/api/bookings/${booking.id}/document?shareToken=${encodeURIComponent(shareToken)}`
                                : `/api/bookings/${booking.id}/document`
                              : booking.fileUrl
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary text-xs underline"
                        >
                          {tBooking("openDocument")}
                        </a>
                      )}
                    </div>

                    {canEdit && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Link
                          href={
                            shareToken
                              ? `/trips/${tripId}?shareToken=${encodeURIComponent(shareToken)}&editBooking=${booking.id}#booking`
                              : `/trips/${tripId}?editBooking=${booking.id}#booking`
                          }
                          aria-label={tBooking(
                            "editButtonNamed",
                            {
                              name:
                                booking.type,
                            },
                          )}
                          className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1"
                        >
                          <Pencil className="size-3.5" />
                        </Link>

                        <form
                          action={removeBookingAction.bind(
                            null,
                            tripId,
                            booking.id,
                            shareToken ?? null,
                          )}
                        >
                          <button
                            type="submit"
                            aria-label={tBooking(
                              "removeButtonNamed",
                              {
                                name:
                                  booking.type,
                              },
                            )}
                            className="hover:bg-destructive/20 hover:text-destructive rounded-full p-1"
                          >
                            <X className="size-3.5" />
                          </button>
                        </form>
                      </div>
                    )}
                  </li>
                ),
              )}
            </ul>
          )}

          {canEdit && (
            <div className="border-t pt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium">
                  {editingBooking
                    ? tBooking(
                        "editHeading",
                      )
                    : tBooking(
                        "addHeading",
                      )}
                </h3>

                {editingBooking && (
                  <Link
                    href={
                      shareToken
                        ? `/trips/${tripId}?shareToken=${encodeURIComponent(shareToken)}#booking`
                        : `/trips/${tripId}#booking`
                    }
                    className="text-muted-foreground hover:text-foreground text-sm underline"
                  >
                    {tBooking(
                      "cancelEdit",
                    )}
                  </Link>
                )}
              </div>

              <BookingForm
                key={
                  editingBooking?.id ??
                  "new"
                }
                tripId={tripId}
                editingBooking={
                  editingBooking
                    ? {
                        id:
                          editingBooking.id,
                        type:
                          editingBooking.type,
                        provider:
                          editingBooking.provider,
                        confirmationCode:
                          editingBooking.confirmationCode,
                        fileUrl:
                          editingBooking.fileUrl,
                        dateTime:
                          editingBooking.dateTime,
                      }
                    : undefined
                }
                shareToken={shareToken}
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
          <p className="text-muted-foreground text-sm">
            {tStory("subtitle")}
          </p>

          {storySlides.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {tStory("empty")}
            </p>
          ) : (
            <>
              <Button
                render={
                  <Link
                    href={`/trips/${tripId}/story`}
                  />
                }
                nativeButton={false}
                className="self-start"
              >
                <Play className="size-4" />

                {tStory(
                  "viewButton",
                  {
                    count:
                      storySlides.length,
                  },
                )}
              </Button>

              <ul className="flex flex-wrap gap-2">
                {storySlides.map(
                  (slide) => (
                    <li
                      key={slide.id}
                      className="relative"
                    >
                      <span
                        className={`flex h-24 w-16 flex-col justify-end overflow-hidden rounded-lg bg-gradient-to-br bg-cover bg-center p-1.5 text-[10px] text-white ${
                          slide.photo
                            ? ""
                            : STORY_THEME_GRADIENT[
                                slide
                                  .theme
                              ]
                        }`}
                        style={
                          slide.photo
                            ? {
                                backgroundImage: `url(${slide.photo})`,
                              }
                            : undefined
                        }
                      >
                        <span className="line-clamp-4 drop-shadow">
                          {
                            slide.caption
                          }
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
                            aria-label={tStory(
                              "removeButtonNamed",
                              {
                                name: slide.caption.slice(
                                  0,
                                  24,
                                ),
                              },
                            )}
                            className="bg-destructive text-destructive-foreground absolute -top-1.5 -right-1.5 rounded-full p-0.5"
                          >
                            <X className="size-3" />
                          </button>
                        </form>
                      )}
                    </li>
                  ),
                )}
              </ul>
            </>
          )}

          {isOwner && (
            <div className="border-t pt-4">
              <h3 className="mb-3 text-sm font-medium">
                {tStory(
                  "addHeading",
                )}
              </h3>

              <StorySlideForm
                tripId={tripId}
                dayCount={dayCount}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {tForm("editTitle")}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <TripForm
              mode="edit"
              defaultValues={{
                id: trip.id,
                name: trip.name,
                destination: trip.destination,
                coverImageUrl: trip.coverImageUrl,
                startDate: toDateInputValue(
                  trip.startDate,
                ),
                endDate: toDateInputValue(
                  trip.endDate,
                ),
                travelerCount:
                  trip.travelerCount,
                budgetTarget:
                  trip.budgetTarget?.toString() ??
                  "",
                pace: trip.pace,
                travelStyle: toTripStyles(
                  trip.travelStyle,
                ),
                visibility:
                  trip.visibility,
                status: trip.status,
              }}
              shareToken={shareToken}
            />

            {isOwner && (
              <Link
                href={`/trips/${trip.id}/delete`}
                className="text-destructive self-start text-sm underline"
              >
                {tForm("deleteLink")}
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
