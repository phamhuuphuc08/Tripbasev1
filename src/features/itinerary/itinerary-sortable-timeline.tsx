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
import { GripVertical, Pencil, TriangleAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { reorderItineraryAction, removeItineraryItemAction } from "@/features/itinerary/actions";
import { Link } from "@/i18n/navigation";

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
}

function dayDropId(day: number) { return `day-${day}`; }

function getDayFromDropId(id: UniqueIdentifier) {
  const value = String(id);
  if (!value.startsWith("day-")) return null;
  const day = Number(value.slice(4));
  return Number.isInteger(day) && day >= 1 ? day : null;
}

function SortableItem({
  tripId, item, isOwner, pending,
}: {
  tripId: string;
  item: SortableTimelineItem;
  isOwner: boolean;
  pending: boolean;
}) {
  const t = useTranslations("itinerary");
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
  const removeAction = removeItineraryItemAction.bind(null, tripId, item.id);

  return (
    <li ref={setNodeRef} style={style} className="border-border flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
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

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
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
                <span>
                  {t("travelWarning", {
                    available: item.travel.availableMinutes,
                    needed: item.travel.estimatedMinutes,
                  })}
                </span>
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
      </div>

      {isOwner && (
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href={`/trips/${tripId}?editItem=${item.id}#itinerary`}
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
  day, items, tripId, isOwner, pending,
}: {
  day: number;
  items: SortableTimelineItem[];
  tripId: string;
  isOwner: boolean;
  pending: boolean;
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
              pending={pending}
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
  tripId, initialItems, isOwner, totalDays,
}: {
  tripId: string;
  initialItems: SortableTimelineItem[];
  isOwner: boolean;
  totalDays: number;
}) {
  const t = useTranslations("itinerary");
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

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
      const reorderedTarget = targetItems.map((item, index) => ({
        ...item, day: targetDay, sortOrder: index,
      }));

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
              pending={pending}
            />
          </div>
        ))}
      </DndContext>
    </div>
  );
}