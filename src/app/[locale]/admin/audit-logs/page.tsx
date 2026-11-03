import { AuditAction } from "@prisma/client";
import { Activity, Search, ShieldCheck } from "lucide-react";

import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAuditLogs } from "@/server/admin/audit-log.service";

const ACTION_LABELS: Record<AuditAction, string> = {
  USER_SUSPENDED: "Đình chỉ tài khoản",
  USER_UNSUSPENDED: "Gỡ đình chỉ",
  USER_DELETED: "Xóa tài khoản",
  TRIP_CREATE_BLOCKED: "Chặn tạo Trip",
  TRIP_CREATE_UNBLOCKED: "Gỡ chặn tạo Trip",
  TAG_CREATE_BLOCKED: "Chặn tạo Tag",
  TAG_CREATE_UNBLOCKED: "Gỡ chặn tạo Tag",
  TAG_APPROVED: "Duyệt Tag",
  TAG_REJECTED: "Từ chối Tag",
  SETTINGS_UPDATED: "Cập nhật cài đặt",
};

const ACTION_BADGES: Record<AuditAction, string> = {
  USER_SUSPENDED: "bg-red-500/10 text-red-600",
  USER_UNSUSPENDED: "bg-green-500/10 text-green-600",
  USER_DELETED: "bg-red-500/10 text-red-600",
  TRIP_CREATE_BLOCKED: "bg-orange-500/10 text-orange-600",
  TRIP_CREATE_UNBLOCKED: "bg-green-500/10 text-green-600",
  TAG_CREATE_BLOCKED: "bg-orange-500/10 text-orange-600",
  TAG_CREATE_UNBLOCKED: "bg-green-500/10 text-green-600",
  TAG_APPROVED: "bg-green-500/10 text-green-600",
  TAG_REJECTED: "bg-red-500/10 text-red-600",
  SETTINGS_UPDATED: "bg-blue-500/10 text-blue-600",
};

interface AdminAuditLogsPageProps {
  searchParams: Promise<{
    q?: string;
    action?: string;
  }>;
}

export default async function AdminAuditLogsPage({ searchParams }: AdminAuditLogsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() || "";
  const action = Object.values(AuditAction).includes(params.action as AuditAction)
    ? (params.action as AuditAction)
    : undefined;

  const logs = await listAuditLogs(query, action);

  return (
    <AdminSectionPage title="Nhật ký quản trị" description="Theo dõi các thay đổi và thao tác quan trọng của quản trị viên.">
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <form className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Tìm theo nội dung, Admin, ID..."
                className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              name="action"
              defaultValue={action || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Tất cả hành động</option>
              {Object.values(AuditAction).map((item) => (
                <option key={item} value={item}>
                  {ACTION_LABELS[item]}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-4 text-sm font-medium transition"
            >
              Lọc
            </button>
          </form>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Activity className="size-5" />
              </span>

              <div>
                <p className="font-semibold">Hoạt động quản trị</p>
                <p className="text-muted-foreground text-sm">
                  {logs.length} bản ghi
                  {query ? ` · Tìm "${query}"` : ""}
                </p>
              </div>
            </div>

            {(query || action) && (
              <a
                href="?"
                className="text-muted-foreground hover:text-foreground text-sm transition"
              >
                Xóa bộ lọc
              </a>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-2">
              <Activity className="text-muted-foreground size-8" />
              <p className="font-medium">Không có nhật ký phù hợp</p>
              <p className="text-muted-foreground text-sm">
                Thử thay đổi từ khóa hoặc loại hành động.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-muted/30 lg:grid-cols-[210px_1fr_220px] lg:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 items-center justify-center rounded-lg ${ACTION_BADGES[log.action]}`}>
                      <ShieldCheck className="size-4" />
                    </span>

                    <div>
                      <p className="text-sm font-medium">{ACTION_LABELS[log.action]}</p>
                      <p className="text-muted-foreground mt-1 text-xs">{log.targetType}</p>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm">
                      {log.description || `${log.targetType}: ${log.targetId}`}
                    </p>

                    <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        Admin: {log.admin ? `${log.admin.name} · ${log.admin.email}` : "Hệ thống"}
                      </span>

                      <span className="truncate">
                        ID: {log.targetId}
                      </span>
                    </div>
                  </div>

                  <time
                    dateTime={log.createdAt.toISOString()}
                    className="text-muted-foreground text-sm lg:text-right"
                  >
                    {log.createdAt.toLocaleString("vi-VN")}
                  </time>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminSectionPage>
  );
}