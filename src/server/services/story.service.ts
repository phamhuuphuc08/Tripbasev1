import { PlanVisibility } from "@prisma/client";
import { toStoryTheme, type StoryTheme } from "@/features/story/themes";
import {
  countStorySlidesByTrip,
  createStorySlide,
  deleteStorySlide,
  findStorySlideById,
  findStorySlidesByTrip,
} from "@/server/repositories/story.repository";
import { findTripById } from "@/server/repositories/trip.repository";
import {
  deleteStoryPhotoIfLocal,
  saveStoryPhoto,
} from "@/server/storage/story-photo";

export class StoryError extends Error {}

async function assertTripOwner(tripId: string, ownerId: string) {
  const trip = await findTripById(tripId);
  if (!trip) throw new StoryError("TRIP_NOT_FOUND");
  if (trip.ownerId !== ownerId) throw new StoryError("FORBIDDEN");
  return trip;
}

export async function listStorySlides(tripId: string) {
  const slides = await findStorySlidesByTrip(tripId);
  return slides.map((slide) => ({
    ...slide,
    theme: toStoryTheme(slide.theme),
  }));
}

export interface AddStorySlideInput {
  day: number | null;
  caption: string;
  theme: StoryTheme;
  photoFile: File | null;
}

export async function addStorySlide(
  tripId: string,
  ownerId: string,
  input: AddStorySlideInput,
) {
  await assertTripOwner(tripId, ownerId);

  let photo: string | null = null;
  if (input.photoFile && input.photoFile.size > 0) {
    photo = await saveStoryPhoto(tripId, input.photoFile);
  }

  const sortOrder = await countStorySlidesByTrip(tripId);
  return createStorySlide({
    tripId,
    day: input.day,
    caption: input.caption,
    theme: input.theme,
    photo,
    sortOrder,
  });
}

export async function removeStorySlide(slideId: string, ownerId: string) {
  const slide = await findStorySlideById(slideId);
  if (!slide) throw new StoryError("NOT_FOUND");
  await assertTripOwner(slide.tripId, ownerId);
  await deleteStorySlide(slideId);
  // Best-effort, after the DB row is gone — a stray file on disk is a much
  // smaller problem than failing the delete over it.
  await deleteStoryPhotoIfLocal(slide.photo);
}

/**
 * Access rule for the public Story viewer page — deliberately looser than
 * trip.service.getTripDetail's "a public plan still needs login" rule
 * (mục 3.3/6b). Stories exist to be shared and opened straight from a
 * link (chat apps, social bios), the same way an Instagram/TikTok story
 * link just plays — so a PUBLIC trip's story never gates on login. A
 * PRIVATE trip's story still only opens for its own owner.
 */
export async function getStoryView(tripId: string, viewerId?: string) {
  const trip = await findTripById(tripId);
  if (!trip) return null;

  const isOwner = viewerId != null && trip.ownerId === viewerId;
  const isPublic = trip.visibility === PlanVisibility.PUBLIC;
  if (!isPublic && !isOwner) return null;

  const slides = await listStorySlides(tripId);
  return { trip, slides, isOwner };
}
