import { Search, ShieldCheck, Users, UserX } from "lucide-react";

import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import {
  isTagCreationBlocked,
  isTripCreationBlocked,
  isUserSuspended,
  listAdminUsers,
} from "@/server/admin/user-admin.service";

interface AdminUsersPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() || "";
  const users = await listAdminUsers(query);

  const suspendedCount = users.filter((user) => isUserSuspended(user.suspendedUntil)).length;
  const restrictedCount = users.filter(
    (user) =>
      isTripCreationBlocked(user.tripCreateBlockedUntil) ||
      isTagCreationBlocked(user.tagCreateBlockedUntil),
  ).length;

  return (
    <AdminSectionPage title="Người dùng" description="Quản lý tài khoản, trạng thái và giới hạn hoạt động của thành viên.">
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tài khoản hiển thị</p>
                <p className="mt-2 text-3xl font-bold">{users.length}</p>
              </div>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Users className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đang đình chỉ</p>
                <p className="mt-2 text-3xl font-bold">{suspendedCount}</p>
              </div>
              <span className="bg-red-500/10 text-red-600 flex size-10 items-center justify-center rounded-xl">
                <UserX className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Bị giới hạn chức năng</p>
                <p className="mt-2 text-3xl font-bold">{restrictedCount}</p>
              </div>
              <span className="bg-orange-500/10 text-orange-600 flex size-10 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <form className="relative max-w-xl">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Tìm theo tên hoặc email..."
              className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
        </div>

        <AdminTable
          rows={users}
          columns={[
            {
              key: "name",
              label: "Người dùng",
              render: (user) => (
                <div>
                  <Link className="font-medium hover:underline" href={`/admin/users/${user.id}`}>
                    {user.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">{user.email}</p>
                </div>
              ),
            },
            {
              key: "role",
              label: "Vai trò",
              render: (user) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    user.role === "ADMIN"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {user.role === "ADMIN" ? "Admin" : "Người dùng"}
                </span>
              ),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (user) => {
                const suspended = isUserSuspended(user.suspendedUntil);
                const tripBlocked = isTripCreationBlocked(user.tripCreateBlockedUntil);
                const tagBlocked = isTagCreationBlocked(user.tagCreateBlockedUntil);

                if (suspended) {
                  return (
                    <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600">
                      Đình chỉ
                    </span>
                  );
                }

                if (tripBlocked || tagBlocked) {
                  return (
                    <span className="inline-flex rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600">
                      Hạn chế
                    </span>
                  );
                }

                return (
                  <span className="inline-flex rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                    Hoạt động
                  </span>
                );
              },
            },
            {
              key: "trips",
              label: "Trip",
              render: (user) => user._count.trips,
            },
            {
              key: "tags",
              label: "Tag & Tip",
              render: (user) => user._count.locationTags,
            },
            {
              key: "createdAt",
              label: "Ngày tạo",
              render: (user) => user.createdAt.toLocaleDateString("vi-VN"),
            },
          ]}
        />
      </div>
    </AdminSectionPage>
  );
}