import { PlanStatus, PlanVisibility } from "@prisma/client";
import { toStoryTheme, type StoryTheme } from "@/features/story/themes";
import { prisma } from "@/server/db/client";
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

/**
 * M12 — tính lại Verified by Author.
 *
 * Trip chỉ Verified khi:
 * - status = COMPLETED
 * - có ít nhất một Story photo
 *   hoặc Booking document.
 */
async function refreshVerifiedByAuthor(tripId: string) {
  const trip = await findTripById(tripId);
  if (!trip) return;

  if (trip.status !== PlanStatus.COMPLETED) {
    if (trip.verifiedByAuthor) {
      await prisma.trip.update({
        where: { id: tripId },
        data: { verifiedByAuthor: false },
      });
    }

    return;
  }

const storyPhotoCount = await prisma.storySlide.count({
  where: {
    tripId,
    photo: { not: null },
  },
});

const verifiedByAuthor =
  storyPhotoCount > 0;

  if (trip.verifiedByAuthor !== verifiedByAuthor) {
    await prisma.trip.update({
      where: { id: tripId },
      data: { verifiedByAuthor },
    });
  }
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

  const slide = await createStorySlide({
    tripId,
    day: input.day,
    caption: input.caption,
    theme: input.theme,
    photo,
    sortOrder,
  });

  /*
   * Nếu Trip đã COMPLETED và slide mới có ảnh,
   * ảnh này có thể trở thành evidence.
   */
  if (photo) {
    await refreshVerifiedByAuthor(tripId);
  }

  return slide;
}

export async function removeStorySlide(
  slideId: string,
  ownerId: string,
) {
  const slide = await findStorySlideById(slideId);

  if (!slide) throw new StoryError("NOT_FOUND");

  await assertTripOwner(slide.tripId, ownerId);
  await deleteStorySlide(slideId);

  /*
   * Tính lại Verified sau khi xóa slide.
   * Nếu đây là Story photo cuối cùng nhưng vẫn còn
   * Booking document thì Verified vẫn giữ true.
   */
  if (slide.photo) {
    await refreshVerifiedByAuthor(slide.tripId);
  }

  // Best-effort cleanup file ảnh sau khi DB row đã được xóa.
  await deleteStoryPhotoIfLocal(slide.photo);
}

/**
 * Story của PUBLIC Trip có thể mở trực tiếp không cần login.
 * PRIVATE Trip chỉ owner được xem.
 */
export async function getStoryView(
  tripId: string,
  viewerId?: string,
) {
  const trip = await findTripById(tripId);
  if (!trip) return null;

  const isOwner =
    viewerId != null &&
    trip.ownerId === viewerId;

  const isPublic =
    trip.visibility === PlanVisibility.PUBLIC;

  if (!isPublic && !isOwner) return null;

  const slides = await listStorySlides(tripId);

  return {
    trip,
    slides,
    isOwner,
  };
}