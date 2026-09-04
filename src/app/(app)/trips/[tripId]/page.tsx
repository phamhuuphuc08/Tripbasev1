import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth/session";
import { getTripDetail } from "@/server/services/trip.service";

const STATUS_LABEL: Record<string, string> = {
  IDEA: "💭 Ý tưởng",
  SCHEDULED: "📅 Đã lên lịch",
  COMPLETED: "✅ Đã đi",
};

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const session = await getSession();
  const result = await getTripDetail(tripId, session?.userId);

  if (!result) notFound();

  const { trip, requiresLogin } = result;

  if (requiresLogin) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <h1 className="text-xl font-semibold">{trip.name}</h1>
        <p className="text-muted-foreground text-sm">
          {trip.destination} — plan này public, đăng nhập để xem đầy đủ
          Timeline/Map/Budget.
        </p>
        <Button render={<Link href={`/login?callbackUrl=/trips/${trip.id}`} />}>
          Đăng nhập để xem chi tiết
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-3 px-6 py-12">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">{trip.name}</h1>
        <Badge variant="outline">
          {STATUS_LABEL[trip.status] ?? trip.status}
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">{trip.destination}</p>
      <p className="text-muted-foreground text-xs">
        Tạo bởi {trip.owner.name} · {trip._count.itineraryItems} điểm trong
        itinerary
      </p>
      <p className="text-muted-foreground mt-6 text-xs">
        3 chế độ xem: Plan View (Timeline), Map View, Money View — module{" "}
        <code>src/features/itinerary</code> (chưa implement, xem
        docs/spec-dev-plan.md).
      </p>
    </div>
  );
}
