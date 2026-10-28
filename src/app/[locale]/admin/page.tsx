import {
  Copy,
  MapPin,
  Plane,
  Share2,
  Users,
} from "lucide-react";

import { AdminStatCard } from "@/components/admin/admin-stat-card";
import { getAdminDashboard } from "@/server/admin/dashboard.service";

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboard();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Tổng quan
        </h1>

        <p className="text-muted-foreground mt-1 text-sm">
          Theo dõi các số liệu chính của TripBase.
        </p>
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
          description="Tổng trip"
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

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">
            Hoạt động gần đây
          </h2>

          <p className="text-muted-foreground mt-2 text-sm">
            Nhật ký hoạt động Admin sẽ được hiển thị tại đây.
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h2 className="font-semibold">
            Tình trạng hệ thống
          </h2>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="size-2 rounded-full bg-green-500" />
            Hệ thống đang hoạt động
          </div>
        </div>
      </div>
    </div>
  );
}