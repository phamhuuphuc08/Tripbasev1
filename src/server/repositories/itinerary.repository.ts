import { prisma } from "@/server/db/client";

const locationTagSelect = {
  id: true,
  title: true,
  category: true,
  latitude: true,
  longitude: true,
  openingHours: true,
  citeTrustScore: true,
  possibleDuplicateOfId: true,
} as const;

const placeSelect = {
  id: true,
  name: true,
  latitude: true,
  longitude: true,
  category: true,
  openingHours: true,
  citeTrustScore: true,
} as const;

const voteSelect = {
  id: true,
  userId: true,
  voteType: true,
  createdAt: true,
} as const;

const commentSelect = {
  id: true,
  userId: true,
  content: true,
  createdAt: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} as const;

export function findItineraryItemsByTrip(tripId: string) {
  return prisma.itineraryItem.findMany({
    where: { tripId },
    include: {
      place: { select: placeSelect },
      locationTag: { select: locationTagSelect },
      votes: { select: voteSelect },
      comments: {
        select: commentSelect,
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: [
      { day: "asc" },
      { sortOrder: "asc" },
      { startTime: "asc" },
    ],
  });
}

export function findItineraryItemById(id: string) {
  return prisma.itineraryItem.findUnique({
    where: { id },
    include: {
      trip: {
        select: {
          id: true,
          ownerId: true,
          startDate: true,
          endDate: true,
        },
      },
      place: { select: placeSelect },
      locationTag: { select: locationTagSelect },
      votes: { select: voteSelect },
      comments: {
        select: commentSelect,
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export function createItineraryItem(data: {
  tripId: string;
  day: number;
  title: string;
  startTime: Date | null;
  endTime: Date | null;
  notes: string | null;
  locationTagId: string | null;
  placeId?: string | null;
  sortOrder?: number;
}) {
  return prisma.itineraryItem.create({
    data,
    include: {
      place: { select: placeSelect },
      locationTag: { select: locationTagSelect },
      votes: { select: voteSelect },
      comments: {
        select: commentSelect,
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export function updateItineraryItem(
  id: string,
  data: {
    day: number;
    title: string;
    startTime: Date | null;
    endTime: Date | null;
    notes: string | null;
    locationTagId: string | null;
    placeId?: string | null;
    sortOrder?: number;
  },
) {
  return prisma.itineraryItem.update({
    where: { id },
    data,
    include: {
      place: { select: placeSelect },
      locationTag: { select: locationTagSelect },
      votes: { select: voteSelect },
      comments: {
        select: commentSelect,
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export function deleteItineraryItem(id: string) {
  return prisma.itineraryItem.delete({
    where: { id },
  });
}

export function reorderItineraryItems(
  items: {
    id: string;
    day: number;
    sortOrder: number;
    startTime?: Date | null;
    endTime?: Date | null;
  }[],
) {
  return prisma.$transaction(
    items.map((item) =>
      prisma.itineraryItem.update({
        where: { id: item.id },
        data: {
          day: item.day,
          sortOrder: item.sortOrder,
          ...(item.startTime !== undefined ? { startTime: item.startTime } : {}),
          ...(item.endTime !== undefined ? { endTime: item.endTime } : {}),
        },
      }),
    ),
  );
}

export function findItineraryVoteByUser(itemId: string, userId: string) {
  return prisma.vote.findFirst({
    where: {
      targetType: "ITINERARY_ITEM",
      itemId,
      userId,
    },
  });
}

export function createItineraryVote(
  itemId: string,
  userId: string,
  voteType: "UP" | "DOWN",
) {
  return prisma.vote.create({
    data: {
      targetType: "ITINERARY_ITEM",
      itemId,
      userId,
      voteType,
    },
  });
}

export function updateItineraryVote(
  id: string,
  voteType: "UP" | "DOWN",
) {
  return prisma.vote.update({
    where: { id },
    data: { voteType },
  });
}

export function deleteItineraryVote(id: string) {
  return prisma.vote.delete({
    where: { id },
  });
}

export function deleteItineraryVotesByUser(itemId: string, userId: string) {
  return prisma.vote.deleteMany({
    where: {
      targetType: "ITINERARY_ITEM",
      itemId,
      userId,
    },
  });
}

export function createItineraryComment(
  itemId: string,
  userId: string,
  content: string,
) {
  return prisma.comment.create({
    data: {
      targetType: "ITINERARY_ITEM",
      itemId,
      userId,
      content,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });
}

export function findItineraryCommentById(id: string) {
  return prisma.comment.findUnique({
    where: { id },
    include: {
      item: {
        select: {
          id: true,
          tripId: true,
          trip: {
            select: {
              ownerId: true,
            },
          },
        },
      },
    },
  });
}

export function deleteItineraryComment(id: string) {
  return prisma.comment.delete({
    where: { id },
  });
}