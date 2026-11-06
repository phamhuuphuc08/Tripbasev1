import { PlanStatus, PlanVisibility } from "@prisma/client";
import { Eye, Plane, Search, Share2, Users } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminTrips } from "@/server/admin/trip-admin.service";

const STATUS_LABELS: Record<PlanStatus, string> = {
  IDEA: "Ý tưởng",
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Hoàn thành",
};

const STATUS_BADGES: Record<PlanStatus, string> = {
  IDEA: "bg-slate-500/10 text-slate-600",
  SCHEDULED: "bg-blue-500/10 text-blue-600",
  COMPLETED: "bg-green-500/10 text-green-600",
};

const VISIBILITY_LABELS: Record<PlanVisibility, string> = {
  PRIVATE: "Riêng tư",
  FRIENDS: "Bạn bè",
  PUBLIC: "Công khai",
};

const VISIBILITY_BADGES: Record<PlanVisibility, string> = {
  PRIVATE: "bg-slate-500/10 text-slate-600",
  FRIENDS: "bg-orange-500/10 text-orange-600",
  PUBLIC: "bg-green-500/10 text-green-600",
};

interface AdminTripsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    visibility?: string;
  }>;
}

export default async function AdminTripsPage({ searchParams }: AdminTripsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() || "";

  const status = Object.values(PlanStatus).includes(params.status as PlanStatus)
    ? (params.status as PlanStatus)
    : undefined;

  const visibility = Object.values(PlanVisibility).includes(params.visibility as PlanVisibility)
    ? (params.visibility as PlanVisibility)
    : undefined;

  const trips = await listAdminTrips(query, status, visibility);

  const publicCount = trips.filter((trip) => trip.visibility === "PUBLIC").length;
  const completedCount = trips.filter((trip) => trip.status === "COMPLETED").length;
  const verifiedCount = trips.filter((trip) => trip.verifiedByAuthor).length;

  return (
    <AdminSectionPage title="Chuyến đi" description="Quản lý các kế hoạch du lịch và trạng thái Trip trong hệ thống.">
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Trip hiển thị</p>
                <p className="mt-2 text-3xl font-bold">{trips.length}</p>
              </div>

              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Plane className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Công khai</p>
                <p className="mt-2 text-3xl font-bold">{publicCount}</p>
              </div>

              <span className="bg-green-500/10 text-green-600 flex size-10 items-center justify-center rounded-xl">
                <Share2 className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hoàn thành</p>
                <p className="mt-2 text-3xl font-bold">{completedCount}</p>
              </div>

              <span className="bg-blue-500/10 text-blue-600 flex size-10 items-center justify-center rounded-xl">
                <Eye className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đã xác minh</p>
                <p className="mt-2 text-3xl font-bold">{verifiedCount}</p>
              </div>

              <span className="bg-purple-500/10 text-purple-600 flex size-10 items-center justify-center rounded-xl">
                <Users className="size-5" />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[1fr_200px_200px_auto]">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Tìm Trip, điểm đến, người tạo..."
                className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              name="status"
              defaultValue={status || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(PlanStatus).map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </select>

            <select
              name="visibility"
              defaultValue={visibility || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Tất cả hiển thị</option>
              {Object.values(PlanVisibility).map((item) => (
                <option key={item} value={item}>
                  {VISIBILITY_LABELS[item]}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-5 text-sm font-medium transition"
            >
              Lọc
            </button>
          </form>
        </div>

        <AdminTable
          rows={trips}
          columns={[
            {
              key: "name",
              label: "Chuyến đi",
              render: (trip) => (
                <div>
                  <Link href={`/admin/trips/${trip.id}`} className="font-medium hover:underline">
                    {trip.name}
                  </Link>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {trip.destination}
                  </p>
                </div>
              ),
            },
            {
              key: "owner",
              label: "Chủ sở hữu",
              render: (trip) => (
                <div>
                  <Link href={`/admin/users/${trip.owner.id}`} className="text-sm font-medium hover:underline">
                    {trip.owner.name}
                  </Link>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {trip.owner.email}
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (trip) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[trip.status]}`}>
                  {STATUS_LABELS[trip.status]}
                </span>
              ),
            },
            {
              key: "visibility",
              label: "Hiển thị",
              render: (trip) => (
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${VISIBILITY_BADGES[trip.visibility]}`}>
                  {VISIBILITY_LABELS[trip.visibility]}
                </span>
              ),
            },
            {
              key: "travelers",
              label: "Số người",
              render: (trip) => trip.travelerCount,
            },
            {
              key: "items",
              label: "Lịch trình",
              render: (trip) => trip._count.itineraryItems,
            },
            {
              key: "createdAt",
              label: "Ngày tạo",
              render: (trip) => trip.createdAt.toLocaleDateString("vi-VN"),
            },
          ]}
        />
      </div>
    </AdminSectionPage>
  );
}