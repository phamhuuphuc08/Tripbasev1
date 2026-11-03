import {
  Copy,
  MapPin,
  Plane,
  Share2,
  Users,
  Clock3,
  ShieldAlert,
} from "lucide-react";

import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";
import { getAdminDashboard } from "@/server/admin/dashboard.service";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboard();

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-semibold">
            TripBase Admin
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Tổng quan
          </h1>

          <p className="text-muted-foreground mt-2 text-sm">
            Theo dõi hoạt động, người dùng, chuyến đi và Tag & Tip trên toàn hệ thống.
          </p>
        </div>

        <div className="text-muted-foreground rounded-xl border bg-card px-4 py-2 text-sm shadow-sm">
          Dữ liệu hệ thống hiện tại
        </div>
      </div>

      {/* MAIN STATS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">
              Số liệu hệ thống
            </h2>

            <p className="text-muted-foreground mt-1 text-sm">
              Tổng quan dữ liệu đang được quản lý trên TripBase.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <AdminStatCard
            title="Người dùng"
            value={stats.userCount}
            description="Tổng tài khoản"
            icon={Users}
          />

          <AdminStatCard
            title="Chuyến đi"
            value={stats.tripCount}
            description="Tổng Trip"
            icon={Plane}
          />

          <AdminStatCard
            title="Plan công khai"
            value={stats.publicTripCount}
            description="Hiển thị trên Explore"
            icon={Share2}
          />

          <AdminStatCard
            title="Tag & Tip"
            value={stats.tagCount}
            description="Địa điểm cộng đồng"
            icon={MapPin}
          />

          <AdminStatCard
            title="CopyPlan"
            value={stats.copyCount}
            description="Tổng lượt sao chép"
            icon={Copy}
          />
        </div>
      </section>

      {/* SECONDARY STATS */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm">
                Tag chờ xét duyệt
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {stats.pendingTagCount}
              </p>
            </div>

            <span className="bg-yellow-500/10 text-yellow-600 flex size-10 items-center justify-center rounded-xl">
              <Clock3 className="size-5" />
            </span>
          </div>

          <p className="text-muted-foreground mt-3 text-xs">
            Cần Admin kiểm tra trước khi công khai.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm">
                Tài khoản đình chỉ
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {stats.suspendedUserCount}
              </p>
            </div>

            <span className="bg-red-500/10 text-red-600 flex size-10 items-center justify-center rounded-xl">
              <ShieldAlert className="size-5" />
            </span>
          </div>

          <p className="text-muted-foreground mt-3 text-xs">
            Các tài khoản đang trong thời gian đình chỉ.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-muted-foreground text-sm">
                Tỷ lệ Trip công khai
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {stats.tripCount > 0
                  ? Math.round(
                      (stats.publicTripCount / stats.tripCount) * 100,
                    )
                  : 0}
                %
              </p>
            </div>

            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <Share2 className="size-5" />
            </span>
          </div>

          <p className="text-muted-foreground mt-3 text-xs">
            Tỷ lệ chuyến đi đang được chia sẻ công khai.
          </p>
        </div>
      </section>

      {/* CHARTS */}
      <section>
        <div className="mb-4">
          <h2 className="font-semibold">
            Phân tích hoạt động
          </h2>

          <p className="text-muted-foreground mt-1 text-sm">
            Theo dõi xu hướng hoạt động của hệ thống trong 30 ngày gần nhất.
          </p>
        </div>

        <AdminDashboardCharts
          usersByDay={stats.usersByDay}
          tripsByDay={stats.tripsByDay}
          tagStatuses={stats.tagStatuses}
          tripStatuses={stats.tripStatuses}
        />
      </section>

      {/* BOTTOM */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Hoạt động gần đây
              </h2>

              <p className="text-muted-foreground mt-1 text-sm">
                Các thay đổi quản trị mới nhất trên hệ thống.
              </p>
            </div>
          </div>

          <div className="mt-5">
            {stats.recentActivities.length === 0 ? (
              <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">
                  Chưa có nhật ký hoạt động.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {stats.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {activity.description}
                      </p>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {activity.adminName || "Hệ thống"}
                      </p>
                    </div>

                    <time className="text-muted-foreground shrink-0 text-xs">
                      {activity.createdAt.toLocaleString("vi-VN")}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">
            Tình trạng hệ thống
          </h2>

          <p className="text-muted-foreground mt-1 text-sm">
            Trạng thái các thành phần chính của TripBase.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-green-500" />

                <span className="text-sm font-medium">
                  Website
                </span>
              </div>

              <span className="text-muted-foreground text-xs">
                Hoạt động
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-green-500" />

                <span className="text-sm font-medium">
                  Database
                </span>
              </div>

              <span className="text-muted-foreground text-xs">
                Kết nối
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-3">
              <div className="flex items-center gap-3">
                <span className="size-2.5 rounded-full bg-green-500" />

                <span className="text-sm font-medium">
                  Hệ thống xác thực
                </span>
              </div>

              <span className="text-muted-foreground text-xs">
                Hoạt động
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}