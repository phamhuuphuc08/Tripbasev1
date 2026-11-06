import {
  Check,
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Tags,
  X,
} from "lucide-react";
import { TagApprovalStatus } from "@prisma/client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import {
  approveAdminTagAction,
  rejectAdminTagAction,
} from "@/features/admin/tag-actions";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminTags } from "@/server/admin/tag-admin.service";

const STATUS_LABELS: Record<TagApprovalStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const STATUS_BADGES: Record<TagApprovalStatus, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300",
  APPROVED: "bg-green-500/10 text-green-700 dark:text-green-300",
  REJECTED: "bg-red-500/10 text-red-700 dark:text-red-300",
};

function TrustScore({ score }: { score: number | null }) {
  const value = Number(score ?? 0);

  const style =
    value >= 70
      ? "bg-green-500/10 text-green-700"
      : value >= 40
        ? "bg-yellow-500/10 text-yellow-700"
        : "bg-red-500/10 text-red-700";

  return (
    <span className={`inline-flex min-w-12 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {value.toFixed(0)}
    </span>
  );
}

interface AdminTagsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}

export default async function AdminTagsPage({ searchParams }: AdminTagsPageProps) {
  await requireAdmin();

  const params = await searchParams;
  const query = params.q?.trim() || "";

  const status = Object.values(TagApprovalStatus).includes(params.status as TagApprovalStatus)
    ? (params.status as TagApprovalStatus)
    : undefined;

  const tags = await listAdminTags(query, status);

  const pendingCount = tags.filter((tag) => tag.approvalStatus === "PENDING").length;
  const approvedCount = tags.filter((tag) => tag.approvalStatus === "APPROVED").length;
  const rejectedCount = tags.filter((tag) => tag.approvalStatus === "REJECTED").length;

  return (
    <AdminSectionPage
      title="Tag & Tip"
      description="Quản lý địa điểm, nội dung cộng đồng và quy trình kiểm duyệt."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đang hiển thị</p>
                <p className="mt-2 text-3xl font-bold">{tags.length}</p>
              </div>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Tags className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Chờ duyệt</p>
                <p className="mt-2 text-3xl font-bold">{pendingCount}</p>
              </div>
              <span className="bg-yellow-500/10 text-yellow-700 flex size-10 items-center justify-center rounded-xl">
                <Clock className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Đã duyệt</p>
                <p className="mt-2 text-3xl font-bold">{approvedCount}</p>
              </div>
              <span className="bg-green-500/10 text-green-700 flex size-10 items-center justify-center rounded-xl">
                <Check className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Từ chối</p>
                <p className="mt-2 text-3xl font-bold">{rejectedCount}</p>
              </div>
              <span className="bg-red-500/10 text-red-700 flex size-10 items-center justify-center rounded-xl">
                <X className="size-5" />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <form className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />

              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Tìm tên, danh mục, người tạo..."
                className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <select
              name="status"
              defaultValue={status || ""}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Tất cả trạng thái</option>

              {Object.values(TagApprovalStatus).map((item) => (
                <option key={item} value={item}>
                  {STATUS_LABELS[item]}
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
          rows={tags}
          columns={[
            {
              key: "title",
              label: "Tag & Tip",
              render: (tag) => (
                <div>
                  <Link
                    href={`/admin/tags/${tag.id}`}
                    className="font-medium hover:underline"
                  >
                    {tag.title}
                  </Link>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {tag.category}
                  </p>
                </div>
              ),
            },
            {
              key: "owner",
              label: "Người tạo",
              render: (tag) => (
                <div>
                  <Link
                    href={`/admin/users/${tag.owner.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {tag.owner.name}
                  </Link>

                  <p className="text-muted-foreground mt-1 text-xs">
                    {tag.owner.email}
                  </p>
                </div>
              ),
            },
            {
              key: "approvalStatus",
              label: "Trạng thái",
              render: (tag) => (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[tag.approvalStatus]}`}
                >
                  {tag.approvalStatus === "PENDING" && <Clock className="size-3" />}
                  {tag.approvalStatus === "APPROVED" && <Check className="size-3" />}
                  {tag.approvalStatus === "REJECTED" && <X className="size-3" />}
                  {STATUS_LABELS[tag.approvalStatus]}
                </span>
              ),
            },
            {
              key: "citeTrustScore",
              label: "Tin cậy",
              render: (tag) => <TrustScore score={tag.citeTrustScore} />,
            },
            {
              key: "citations",
              label: "Trích dẫn",
              render: (tag) => tag._count.citations,
            },
            {
              key: "uses",
              label: "Lịch trình",
              render: (tag) => tag._count.itineraryItems,
            },
            {
              key: "createdAt",
              label: "Ngày tạo",
              render: (tag) => tag.createdAt.toLocaleDateString("vi-VN"),
            },
            {
              key: "actions",
              label: "Thao tác",
              render: (tag) => {
                if (tag.approvalStatus !== "PENDING") {
                  return (
                    <Link
                      href={`/admin/tags/${tag.id}`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      Xem chi tiết
                    </Link>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <form action={approveAdminTagAction.bind(null, tag.id)}>
                      <Button type="submit" size="sm" className="gap-1.5">
                        <Check className="size-4" />
                        Duyệt
                      </Button>
                    </form>

                    <form action={rejectAdminTagAction.bind(null, tag.id)}>
                      <Button type="submit" size="sm" variant="destructive" className="gap-1.5">
                        <X className="size-4" />
                        Từ chối
                      </Button>
                    </form>
                  </div>
                );
              },
            },
          ]}
        />

        {pendingCount > 0 && (
          <div className="rounded-2xl border bg-yellow-500/5 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-yellow-700" />

              <div>
                <p className="text-sm font-medium">
                  Còn {pendingCount} Tag & Tip cần kiểm duyệt
                </p>

                <p className="text-muted-foreground mt-1 text-xs">
                  Nên kiểm tra nội dung, vị trí và độ tin cậy trước khi duyệt.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminSectionPage>
  );
}