import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  searchPublicTrips,
  type TripSearchResult,
} from "@/server/services/marketplace.service";

const STATUS_LABEL: Record<string, string> = {
  IDEA: "💭 Ý tưởng",
  SCHEDULED: "📅 Đã lên lịch",
  COMPLETED: "✅ Đã đi",
};

const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

function formatDateRange(start: Date | null, end: Date | null) {
  if (!start || !end) return null;
  return `${dateFormatter.format(start)} – ${dateFormatter.format(end)}`;
}

function TripResultCard({ trip }: { trip: TripSearchResult }) {
  const dateRange = formatDateRange(trip.startDate, trip.endDate);

  return (
    <Link href={`/trips/${trip.id}`}>
      <Card className="hover:border-foreground/30 h-full transition-colors">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base">{trip.name}</CardTitle>
            {trip.verifiedByAuthor && (
              <Badge variant="secondary">Verified</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <span>{trip.destination}</span>
          {dateRange && (
            <span className="text-muted-foreground">{dateRange}</span>
          )}
          <div className="mt-2 flex items-center justify-between">
            <Badge variant="outline">
              {STATUS_LABEL[trip.status] ?? trip.status}
            </Badge>
            <span className="text-muted-foreground text-xs">
              bởi {trip.ownerName}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = await searchPublicTrips(query);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-16">
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">TripBase</h1>
          <p className="text-muted-foreground mt-2 text-balance">
            Trip operating system + mạng lưới uy tín cho nhóm/cá nhân/creator du
            lịch tự túc.
          </p>
        </div>

        <form action="/" className="flex w-full max-w-md gap-2">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Muốn đi đâu? VD: Đà Lạt, Seoul, Phú Quốc..."
            aria-label="Tìm điểm đến"
            className="flex-1"
          />
          <Button type="submit">Tìm plan</Button>
        </form>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-muted-foreground text-sm font-medium">
          {query ? `Plan public khớp với "${query}"` : "Plan public gần đây"}
        </h2>

        {results.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Chưa có plan public nào khớp &quot;{query}&quot;. Thử từ khoá khác,
            hoặc{" "}
            <Link href="/register" className="text-foreground underline">
              tạo tài khoản
            </Link>{" "}
            để tự dựng plan mới.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {results.map((trip) => (
              <TripResultCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
