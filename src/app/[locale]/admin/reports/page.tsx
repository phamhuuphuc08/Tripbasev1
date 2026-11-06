import { ReportStatus, ReportTargetType } from "@prisma/client";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Search,
  ShieldAlert,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import {
  getAdminReportStats,
  listAdminReports,
} from "@/server/admin/report-admin.service";

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  REJECTED: "Bỏ qua",
};

const STATUS_BADGES: Record<ReportStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700",
  REVIEWING: "bg-blue-500/10 text-blue-700",
  RESOLVED: "bg-green-500/10 text-green-700",
  REJECTED: "bg-slate-500/10 text-slate-600",
};

const TARGET_LABELS: Record<ReportTargetType, string> = {
  USER: "Người dùng",
  TRIP: "Chuyến đi",
  TAG: "Tag & Tip",
};

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    targetType?: string;
  }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() || "";

  const status = Object.values(ReportStatus).includes(params.status as ReportStatus)
    ? (params.status as ReportStatus)
    : undefined;

  const targetType = Object.values(ReportTargetType).includes(params.targetType as ReportTargetType)
    ? (params.targetType as ReportTargetType)
    : undefined;

  const [reports, stats] = await Promise.all([
    listAdminReports(query, status, targetType),
    getAdminReportStats(),
  ]);

  return (
    <AdminSectionPage
      title="Báo cáo"
      description="Tiếp nhận và xử lý các báo cáo vi phạm từ cộng đồng."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tổng báo cáo</p>
                <p className="mt-2 text-3xl font-bold">{stats.total}</p>
              </div>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <ShieldAlert className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Chờ xử lý</p>
                <p className="mt-2 text-3xl font-bold">{stats.pending}</p>
              </div>
              <span className="bg-yellow-500/10 text-yellow-700 flex size-10 items-center justify-center rounded-xl">
                <Clock3 className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đang xem xét</p>
                <p className="mt-2 text-3xl font-bold">{stats.reviewing}</p>
              </div>
              <span className="bg-blue-500/10 text-blue-700 flex size-10 items-center justify-center rounded-xl">
                <AlertTriangle className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đã xử lý</p>
                <p className="mt-2 text-3xl font-bold">{stats.resolved}</p>
              </div>
              <span className="bg-green-500/10 text-green-700 flex size-10 items-center justify-center rounded-xl">
                <CheckCircle2 className="size-5" />
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
                placeholder="Tìm người báo cáo, nội dung hoặc ID đối tượng..."
                className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm"
              />
            </div>

            <select
              name="status"
              defaultValue={status || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Tất cả trạng thái</option>
              {Object.values(ReportStatus).map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
                </option>
              ))}
            </select>

            <select
              name="targetType"
              defaultValue={targetType || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Tất cả đối tượng</option>
              {Object.values(ReportTargetType).map((item) => (
                <option key={item} value={item}>
                  {TARGET_LABELS[item]}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-5 text-sm font-medium"
            >
              Lọc
            </button>
          </form>
        </div>

        <AdminTable
          rows={reports}
          columns={[
            {
              key: "reporter",
              label: "Người báo cáo",
              render: (report) => (
                <div>
                  <Link
                    href={`/admin/users/${report.reporter.id}`}
                    className="font-medium hover:underline"
                  >
                    {report.reporter.name}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {report.reporter.email}
                  </p>
                </div>
              ),
            },
            {
              key: "target",
              label: "Đối tượng",
              render: (report) => (
                <div>
                  <p className="font-medium">
                    {TARGET_LABELS[report.targetType]}
                  </p>
                  <p className="text-muted-foreground mt-1 max-w-44 truncate text-xs">
                    {report.targetId}
                  </p>
                </div>
              ),
            },
            {
              key: "reason",
              label: "Lý do",
              render: (report) => report.reason.replaceAll("_", " "),
            },
            {
              key: "status",
              label: "Trạng thái",
              render: (report) => (
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[report.status]}`}
                >
                  {STATUS_LABELS[report.status]}
                </span>
              ),
            },
            {
              key: "createdAt",
              label: "Ngày gửi",
              render: (report) => report.createdAt.toLocaleString("vi-VN"),
            },
            {
              key: "actions",
              label: "Thao tác",
              render: (report) => (
                <Link
                  href={`/admin/reports/${report.id}`}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Xem & xử lý
                </Link>
              ),
            },
          ]}
        />
      </div>
    </AdminSectionPage>
  );
}