import { notFound } from "next/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminTrip } from "@/server/admin/trip-admin.service";

export default async function AdminTripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
  await requireAdmin();
  const { tripId } = await params;
  const trip = await getAdminTrip(tripId);
  if (!trip) notFound();
  return <AdminSectionPage title={trip.name} description={`${trip.destination} · ${trip.owner.name} (${trip.owner.email})`}>
    <dl className="grid gap-x-8 gap-y-4 border-y py-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">ID</dt><dd className="mt-1 break-all">{trip.id}</dd></div><div><dt className="text-sm text-muted-foreground">Trạng thái</dt><dd className="mt-1">{trip.status} · {trip.visibility}</dd></div><div><dt className="text-sm text-muted-foreground">Ngày tạo</dt><dd className="mt-1">{trip.createdAt.toLocaleDateString("vi-VN")}</dd></div><div><dt className="text-sm text-muted-foreground">Thời gian</dt><dd className="mt-1">{trip.startDate?.toLocaleDateString("vi-VN") ?? "—"} – {trip.endDate?.toLocaleDateString("vi-VN") ?? "—"}</dd></div><div><dt className="text-sm text-muted-foreground">Lịch trình</dt><dd className="mt-1">{trip._count.itineraryItems}</dd></div><div><dt className="text-sm text-muted-foreground">Cộng tác viên / trích dẫn</dt><dd className="mt-1">{trip._count.collaborators} / {trip._count.citations}</dd></div></dl>
  </AdminSectionPage>;
}