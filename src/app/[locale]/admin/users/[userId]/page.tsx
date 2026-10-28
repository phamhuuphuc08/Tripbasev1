import { notFound } from "next/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminUser } from "@/server/admin/user-admin.service";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  await requireAdmin();
  const { userId } = await params;
  const user = await getAdminUser(userId);
  if (!user) notFound();
  return <AdminSectionPage title={user.name} description={user.email}>
    <dl className="grid gap-x-8 gap-y-4 border-y py-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">ID</dt><dd className="mt-1 break-all">{user.id}</dd></div><div><dt className="text-sm text-muted-foreground">Ngày tham gia</dt><dd className="mt-1">{user.createdAt.toLocaleDateString("vi-VN")}</dd></div><div><dt className="text-sm text-muted-foreground">Tổng chuyến đi</dt><dd className="mt-1">{user._count.trips}</dd></div><div><dt className="text-sm text-muted-foreground">Tổng địa điểm</dt><dd className="mt-1">{user._count.locationTags}</dd></div><div><dt className="text-sm text-muted-foreground">Giới thiệu</dt><dd className="mt-1">{user.bio || "—"}</dd></div><div><dt className="text-sm text-muted-foreground">Sở thích du lịch</dt><dd className="mt-1">{user.travelInterests.join(", ") || "—"}</dd></div></dl>
    <div><h2 className="mb-3 font-medium">Chuyến đi gần đây</h2><ul className="divide-y border-y">{user.trips.map((trip) => <li key={trip.id} className="flex justify-between gap-4 py-3"><span>{trip.name} · {trip.destination}</span><time className="shrink-0 text-sm text-muted-foreground">{trip.createdAt.toLocaleDateString("vi-VN")}</time></li>)}</ul></div>
  </AdminSectionPage>;
}