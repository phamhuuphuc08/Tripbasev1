import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminTrips } from "@/server/admin/trip-admin.service";

export default async function AdminTripsPage() {
  await requireAdmin();
  const trips = await listAdminTrips();
  return <AdminSectionPage title="Chuyến đi" description="Các kế hoạch du lịch trong TripBase."><AdminTable rows={trips} columns={[
    { key: "name", label: "Chuyến đi", render: (trip) => <Link className="font-medium hover:underline" href={`/admin/trips/${trip.id}`}>{trip.name}</Link> },
    { key: "destination", label: "Điểm đến" },
    { key: "owner", label: "Chủ sở hữu", render: (trip) => trip.owner.name },
    { key: "status", label: "Trạng thái" },
    { key: "visibility", label: "Hiển thị" },
  ]} /></AdminSectionPage>;
}