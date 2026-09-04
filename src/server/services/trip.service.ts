import { PlanVisibility } from "@prisma/client";
import { findTripById } from "@/server/repositories/trip.repository";

export async function getTripDetail(id: string, viewerId?: string) {
  const trip = await findTripById(id);
  if (!trip) return null;

  const isOwner = viewerId != null && trip.ownerId === viewerId;
  const isPublic = trip.visibility === PlanVisibility.PUBLIC;

  // Private and not yours: behave like it doesn't exist, don't leak that a
  // private plan with this id is out there.
  if (!isPublic && !isOwner) return null;

  // mục 3.3/6b của spec: xem chi tiết plan public vẫn cần đăng nhập.
  const requiresLogin = viewerId == null;

  return { trip, isOwner, requiresLogin };
}
