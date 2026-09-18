"use client";

import { useEffect, useState, useTransition } from "react";
import {
  closestCenter, DndContext, KeyboardSensor, PointerSensor, useDroppable,
  useSensor, useSensors, type DragEndEvent, type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MessageCircle, Pencil, ThumbsDown, ThumbsUp, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  addItineraryCommentAction, removeItineraryCommentAction, removeItineraryItemAction,
  reorderItineraryAction, voteItineraryItemAction,
} from "@/features/itinerary/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

export interface SortableTimelineComment {
  id: string;
  userId: string;
  userName: string;
  content: string;
}

export interface SortableTimelineItem {
  id: string;
  day: number;
  sortOrder: number;
  title: string;
  displayStart: string | null;
  displayEnd: string | null;
  notes: string | null;
  locationTagTitle: string | null;
  overlappingNames: string[];
  shortGap: { minutes: number; previousName: string } | null;
  travel: {
    distanceKm: number;
    estimatedMinutes: number;
    availableMinutes: number;
    insufficientTravelTime: boolean;
    previousName: string;
  } | null;
  openingHoursWarning: { openingHours: string; placeName: string | null } | null;
  votes: { up: number; down: number; score: number; currentUserVote: "UP" | "DOWN" | null };
  comments: SortableTimelineComment[];
}

function dayDropId(day: number) { return `day-${day}`; }

function getDayFromDropId(id: UniqueIdentifier) {
  const value = String(id);
  if (!value.startsWith("day-")) return null;
  const day = Number(value.slice(4));
  return Number.isInteger(day) && day >= 1 ? day : null;
}

function SortableItem({
  tripId, item, isOwner, currentUserId, pending, shareToken,
}: {
  tripId: string;
  item: SortableTimelineItem;
  isOwner: boolean;
  currentUserId: string | null;
  pending: boolean;
  shareToken?: string | null;
}) {
  const t = useTranslations("itinerary");
  const router = useRouter();
  const [commentText, setCommentText] = useState("");
  const [interactionError, setInteractionError] = useState<string | null>(null);
  const [interactionPending, startInteraction] = useTransition();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id, disabled: !isOwner || pending,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 20 : undefined,
  };

  const itemName = item.title || item.locationTagTitle || t("dayHeading", { day: item.day });
  const token = shareToken ?? null;
  const removeAction = removeItineraryItemAction.bind(null, tripId, item.id, token);
  const editHref = token
    ? `/trips/${tripId}?shareToken=${encodeURIComponent(token)}&editItem=${item.id}#itinerary`
    : `/trips/${tripId}?editItem=${item.id}#itinerary`;

  function vote(voteType: "UP" | "DOWN") {
    setInteractionError(null);

    if (!currentUserId) {
      setInteractionError(t("interactionLoginRequired"));
      return;
    }

    startInteraction(() => {
      void (async () => {
        const result = await voteItineraryItemAction(item.id, voteType);

        if (!result.success) {
          setInteractionError(
            result.error === "LOGIN_REQUIRED"
              ? t("interactionLoginRequired")
              : result.error === "INVALID_VOTE"
                ? t("voteInvalid")
                : t("voteFailed"),
          );
          return;
        }

        router.refresh();
      })();
    });
  }

  function submitComment() {
    setInteractionError(null);
    const content = commentText.trim();

    if (!currentUserId) {
      setInteractionError(t("interactionLoginRequired"));
      return;
    }

    if (!content) {
      setInteractionError(t("commentRequired"));
      return;
    }

    if (content.length > 1000) {
      setInteractionError(t("commentTooLong"));
      return;
    }

    startInteraction(() => {
      void (async () => {
        const result = await addItineraryCommentAction(item.id, content);

        if (!result.success) {
          if (result.error === "LOGIN_REQUIRED") setInteractionError(t("interactionLoginRequired"));
          else if (result.error === "COMMENT_REQUIRED") setInteractionError(t("commentRequired"));
          else if (result.error === "COMMENT_TOO_LONG") setInteractionError(t("commentTooLong"));
          else setInteractionError(t("commentFailed"));
          return;
        }

        setCommentText("");
        router.refresh();
      })();
    });
  }

  function removeComment(commentId: string) {
    setInteractionError(null);

    startInteraction(() => {
      void (async () => {
        const result = await removeItineraryCommentAction(commentId);

        if (!result.success) {
          setInteractionError(
            result.error === "LOGIN_REQUIRED"
              ? t("interactionLoginRequired")
              : t("commentDeleteFailed"),
          );
          return;
        }

        router.refresh();
      })();
    });
  }

  return (
    <li ref={setNodeRef} style={style} className="border-border flex items-start gap-2 rounded-lg border px-3 py-3 text-sm">
      {isOwner && (
        <button
          type="button"
          disabled={pending}
          aria-label={t("dragHandle")}
          title={t("dragHandle")}
          className="text-muted-foreground hover:text-foreground mt-0.5 shrink-0 cursor-grab touch-none rounded p-1 active:cursor-grabbing disabled:cursor-not-allowed"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {(item.displayStart || item.displayEnd) && (
          <span className="text-muted-foreground text-xs">
            {item.displayStart ?? "?"}{item.displayEnd ? ` – ${item.displayEnd}` : ""}
          </span>
        )}

        {item.title && <span className="font-medium">{item.title}</span>}

        {item.locationTagTitle && (
          <span className={item.title ? "text-muted-foreground text-xs" : "font-medium"}>
            {item.locationTagTitle}
          </span>
        )}

        {item.notes && <span className="text-muted-foreground">{item.notes}</span>}

        {item.travel && (
          <div className="mt-1 flex flex-col gap-1">
            <span className="text-muted-foreground text-xs">
              {t("travelInfo", {
                distance: item.travel.distanceKm,
                minutes: item.travel.estimatedMinutes,
                name: item.travel.previousName,
              })}
            </span>

            {!pending && item.travel.insufficientTravelTime && (
              <span className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                <span>{t("travelWarning", {
                  available: item.travel.availableMinutes,
                  needed: item.travel.estimatedMinutes,
                })}</span>
              </span>
            )}
          </div>
        )}

        {!pending && item.overlappingNames.length > 0 && (
          <span className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("overlapWarning", {
              names: item.overlappingNames.map((name) => `"${name}"`).join(", "),
            })}</span>
          </span>
        )}

        {!pending && item.shortGap && (
          <span className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("shortGapWarning", {
              minutes: item.shortGap.minutes,
              name: item.shortGap.previousName,
            })}</span>
          </span>
        )}

        {!pending && item.openingHoursWarning && (
          <span className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>{t("openingHoursWarning", {
              name: item.openingHoursWarning.placeName || itemName,
              hours: item.openingHoursWarning.openingHours,
            })}</span>
          </span>
        )}

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant={item.votes.currentUserVote === "UP" ? "default" : "outline"}
            disabled={interactionPending}
            onClick={() => vote("UP")}
            aria-label={t("voteUp")}
            title={t("voteUp")}
            className="h-7 gap-1 px-2"
          >
            <ThumbsUp className="size-3.5" />
            {item.votes.up}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={item.votes.currentUserVote === "DOWN" ? "default" : "outline"}
            disabled={interactionPending}
            onClick={() => vote("DOWN")}
            aria-label={t("voteDown")}
            title={t("voteDown")}
            className="h-7 gap-1 px-2"
          >
            <ThumbsDown className="size-3.5" />
            {item.votes.down}
          </Button>

          <span className="text-muted-foreground text-xs">
            {t("voteScore", { score: item.votes.score })}
          </span>
        </div>

        <div className="mt-2 rounded-md border p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium">
            <MessageCircle className="size-3.5" />
            {t("commentsHeading", { count: item.comments.length })}
          </div>

          {item.comments.length > 0 && (
            <ul className="mb-3 flex flex-col gap-2">
              {item.comments.map((comment) => {
                const canDelete = isOwner || comment.userId === currentUserId;

                return (
                  <li key={comment.id} className="bg-muted/50 flex items-start justify-between gap-2 rounded-md px-2.5 py-2">
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-medium">{comment.userName}</span>
                      <span className="text-muted-foreground block break-words text-xs">{comment.content}</span>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        disabled={interactionPending}
                        onClick={() => removeComment(comment.id)}
                        aria-label={t("commentDelete")}
                        title={t("commentDelete")}
                        className="text-muted-foreground hover:text-destructive shrink-0 rounded p-0.5 disabled:cursor-not-allowed"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex items-center gap-2">
            <Input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (!interactionPending) submitComment();
                }
              }}
              maxLength={1000}
              disabled={interactionPending}
              placeholder={t("commentPlaceholder")}
              className="h-8 text-xs"
            />

            <Button
              type="button"
              size="sm"
              disabled={interactionPending || !commentText.trim()}
              onClick={submitComment}
              className="h-8 shrink-0"
            >
              {interactionPending ? t("commentSubmitting") : t("commentSubmit")}
            </Button>
          </div>
        </div>

        {interactionError && (
          <p role="alert" className="text-destructive mt-1 text-xs">{interactionError}</p>
        )}
      </div>

      {isOwner && (
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={editHref}
            aria-label={t("editButtonNamed", { name: itemName })}
            title={t("editHeading")}
            className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-full p-1"
          >
            <Pencil className="size-3.5" />
          </Link>

          <form action={removeAction}>
            <button
              type="submit"
              aria-label={t("removeButtonNamed", { name: itemName })}
              className="hover:bg-destructive/20 hover:text-destructive rounded-full p-1"
            >
              <X className="size-3.5" />
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function DayDropZone({
  day, items, tripId, isOwner, currentUserId, pending, shareToken,
}: {
  day: number;
  items: SortableTimelineItem[];
  tripId: string;
  isOwner: boolean;
  currentUserId: string | null;
  pending: boolean;
  shareToken?: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: dayDropId(day), disabled: !isOwner || pending,
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-12 rounded-md transition-colors ${isOver ? "bg-primary/5 ring-primary/30 ring-2" : ""}`}
    >
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableItem
              key={item.id}
              tripId={tripId}
              item={item}
              isOwner={isOwner}
              currentUserId={currentUserId}
              pending={pending}
              shareToken={shareToken}
            />
          ))}
        </ul>
      </SortableContext>
    </div>
  );
}

function normalizeDay(items: SortableTimelineItem[], day: number) {
  return items
    .filter((item) => item.day === day)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item, index) => ({ ...item, sortOrder: index }));
}

export function ItinerarySortableTimeline({
  tripId, initialItems, isOwner, currentUserId, totalDays, shareToken,
}: {
  tripId: string;
  initialItems: SortableTimelineItem[];
  isOwner: boolean;
  currentUserId: string | null;
  totalDays: number;
  shareToken?: string | null;
}) {
  const t = useTranslations("itinerary");
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const token = shareToken ?? null;

  useEffect(() => { setItems(initialItems); }, [initialItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const maxItemDay = items.reduce((max, item) => Math.max(max, item.day), 1);
  const dayCount = Math.max(1, totalDays, maxItemDay);
  const days = Array.from({ length: dayCount }, (_, index) => index + 1);

  const grouped = days.reduce<Record<number, SortableTimelineItem[]>>((groups, day) => {
    groups[day] = [];
    return groups;
  }, {});

  items.forEach((item) => { (grouped[item.day] ??= []).push(item); });
  Object.values(grouped).forEach((dayItems) => dayItems.sort((a, b) => a.sortOrder - b.sortOrder));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || pending) return;

    const activeItem = items.find((item) => item.id === active.id);
    if (!activeItem) return;

    const overItem = items.find((item) => item.id === over.id);
    const targetDay = getDayFromDropId(over.id) ?? overItem?.day;
    if (!targetDay) return;

    const sourceDay = activeItem.day;
    const previousItems = items.map((item) => ({ ...item }));

    if (sourceDay === targetDay && overItem && active.id === overItem.id) return;

    let nextItems: SortableTimelineItem[];
    let changedItems: SortableTimelineItem[];

    if (sourceDay === targetDay) {
      const dayItems = items
        .filter((item) => item.day === sourceDay)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const oldIndex = dayItems.findIndex((item) => item.id === active.id);
      const newIndex = overItem
        ? dayItems.findIndex((item) => item.id === overItem.id)
        : dayItems.length - 1;

      if (oldIndex === -1 || newIndex === -1) return;

      const reorderedDay = arrayMove(dayItems, oldIndex, newIndex)
        .map((item, index) => ({ ...item, sortOrder: index }));

      const changedMap = new Map(reorderedDay.map((item) => [item.id, item]));
      nextItems = items.map((item) => changedMap.get(item.id) ?? item);
      changedItems = reorderedDay;
    } else {
      const sourceItems = items
        .filter((item) => item.day === sourceDay && item.id !== activeItem.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const targetItems = items
        .filter((item) => item.day === targetDay && item.id !== activeItem.id)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      let insertIndex = targetItems.length;

      if (overItem) {
        const foundIndex = targetItems.findIndex((item) => item.id === overItem.id);
        if (foundIndex >= 0) insertIndex = foundIndex;
      }

      targetItems.splice(insertIndex, 0, { ...activeItem, day: targetDay });

      const reorderedSource = sourceItems.map((item, index) => ({ ...item, sortOrder: index }));
      const reorderedTarget = targetItems.map((item, index) => ({ ...item, day: targetDay, sortOrder: index }));

      const changedMap = new Map(
        [...reorderedSource, ...reorderedTarget].map((item) => [item.id, item]),
      );

      nextItems = items.map((item) => changedMap.get(item.id) ?? item);

      changedItems = [
        ...normalizeDay(nextItems, sourceDay),
        ...normalizeDay(nextItems, targetDay),
      ];

      const finalMap = new Map(changedItems.map((item) => [item.id, item]));
      nextItems = nextItems.map((item) => finalMap.get(item.id) ?? item);
    }

    setItems(nextItems);
    setError(false);

    startTransition(() => {
      void (async () => {
        const result = await reorderItineraryAction(
          tripId,
          token,
          changedItems.map((item) => ({
            id: item.id,
            day: item.day,
            sortOrder: item.sortOrder,
          })),
        );

        if (!result.success) {
          setItems(previousItems);
          setError(true);
          return;
        }

        router.refresh();
      })();
    });
  }

  return (
    <div className="space-y-5">
      {error && <p className="text-destructive text-sm">{t("reorderFailed")}</p>}
      {pending && <p className="text-muted-foreground text-xs">{t("savingOrder")}</p>}

      <DndContext
        id={`itinerary-dnd-${tripId}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {days.map((day) => (
          <div key={day} className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">{t("dayHeading", { day })}</h3>

            <DayDropZone
              day={day}
              items={grouped[day] ?? []}
              tripId={tripId}
              isOwner={isOwner}
              currentUserId={currentUserId}
              pending={pending}
              shareToken={token}
            />
          </div>
        ))}
      </DndContext>
    </div>
  );
}