import {
  Check,
  Clock,
  MapPin,
  Quote,
  Route,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import { notFound } from "next/navigation";
import { TagApprovalStatus } from "@prisma/client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import {
  approveAdminTagAction,
  rejectAdminTagAction,
} from "@/features/admin/tag-actions";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminTag } from "@/server/admin/tag-admin.service";

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

function formatDateTime(value: Date | null) {
  return value ? value.toLocaleString("vi-VN") : "—";
}

function TrustScore({ score }: { score: number | null }) {
  const value = Number(score ?? 0);

  const style =
    value >= 70
      ? "bg-green-500/10 text-green-700"
      : value >= 40
        ? "bg-yellow-500/10 text-yellow-700"
        : "bg-red-500/10 text-red-700";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {value.toFixed(0)}
    </span>
  );
}

export default async function AdminTagDetailPage({
  params,
}: {
  params: Promise<{ tagId: string }>;
}) {
  await requireAdmin();

  const { tagId } = await params;
  const tag = await getAdminTag(tagId);

  if (!tag) notFound();

  return (
    <AdminSectionPage
      title={tag.title}
      description={`${tag.category ?? "Chưa phân loại"} · ${tag.owner.name}`}
    >
      <div className="space-y-6">
        {/* SUMMARY */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Trạng thái</p>

                <div className="mt-3">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[tag.approvalStatus]}`}
                  >
                    {tag.approvalStatus === "PENDING" && <Clock className="size-3" />}
                    {tag.approvalStatus === "APPROVED" && <Check className="size-3" />}
                    {tag.approvalStatus === "REJECTED" && <X className="size-3" />}
                    {STATUS_LABELS[tag.approvalStatus]}
                  </span>
                </div>
              </div>

              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Cite Trust Score</p>

                <div className="mt-3">
                  <TrustScore score={tag.citeTrustScore} />
                </div>
              </div>

              <span className="bg-blue-500/10 text-blue-600 flex size-10 items-center justify-center rounded-xl">
                <Quote className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Được sử dụng</p>
                <p className="mt-2 text-3xl font-bold">{tag._count.itineraryItems}</p>
              </div>

              <span className="bg-green-500/10 text-green-600 flex size-10 items-center justify-center rounded-xl">
                <Route className="size-5" />
              </span>
            </div>
          </div>
        </div>

        {/* DETAIL */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <MapPin className="size-5" />
            </span>

            <div>
              <h2 className="font-semibold">Thông tin Tag & Tip</h2>
              <p className="text-muted-foreground text-sm">
                Nội dung và thông tin địa điểm do cộng đồng đóng góp.
              </p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">ID</dt>
              <dd className="mt-1 break-all text-sm font-medium">{tag.id}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Danh mục</dt>
              <dd className="mt-1 text-sm font-medium">{tag.category || "—"}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngày tạo</dt>
              <dd className="mt-1 text-sm font-medium">
                {tag.createdAt.toLocaleString("vi-VN")}
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Vĩ độ</dt>
              <dd className="mt-1 text-sm font-medium">
                {tag.latitude ?? "—"}
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Kinh độ</dt>
              <dd className="mt-1 text-sm font-medium">
                {tag.longitude ?? "—"}
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Giờ mở cửa</dt>
              <dd className="mt-1 text-sm font-medium">
                {tag.openingHours || "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Nội dung</p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {tag.content || "Không có nội dung."}
            </p>
          </div>
        </section>

        {/* OWNER */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <UserRound className="text-muted-foreground size-5" />

            <div>
              <h2 className="font-semibold">Người tạo</h2>
              <p className="text-muted-foreground text-sm">
                Thành viên đã đóng góp Tag & Tip này.
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
            <div>
              <Link
                href={`/admin/users/${tag.owner.id}`}
                className="font-medium hover:underline"
              >
                {tag.owner.name}
              </Link>

              <p className="text-muted-foreground mt-1 text-sm">
                {tag.owner.email}
              </p>
            </div>

            <Link
              href={`/admin/users/${tag.owner.id}`}
              className="text-primary text-sm font-medium hover:underline"
            >
              Xem tài khoản →
            </Link>
          </div>
        </section>

        {/* ACTIVITY */}
        <section>
          <div className="mb-4">
            <h2 className="font-semibold">Mức độ sử dụng</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Các chỉ số liên quan đến Tag & Tip này.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Quote className="text-purple-600 size-5" />

                <div>
                  <p className="text-muted-foreground text-xs">Trích dẫn</p>
                  <p className="mt-1 text-2xl font-bold">
                    {tag._count.citations}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Route className="text-blue-600 size-5" />

                <div>
                  <p className="text-muted-foreground text-xs">
                    Lịch trình đang sử dụng
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {tag._count.itineraryItems}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* REVIEW */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold">Kiểm duyệt</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Xem trạng thái và xử lý nội dung cộng đồng.
            </p>
          </div>

          {tag.approvalStatus === "PENDING" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                <h3 className="font-medium text-green-700">
                  Duyệt Tag & Tip
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Cho phép nội dung này được sử dụng trong hệ thống.
                </p>

                <form
                  action={approveAdminTagAction.bind(null, tag.id)}
                  className="mt-4"
                >
                  <Button type="submit" className="gap-2">
                    <Check className="size-4" />
                    Duyệt nội dung
                  </Button>
                </form>
              </div>

              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <h3 className="font-medium text-destructive">
                  Từ chối Tag & Tip
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Nên nhập lý do để lưu lại quá trình kiểm duyệt.
                </p>

                <form
                  action={async (formData) => {
                    "use server";

                    await rejectAdminTagAction(
                      tag.id,
                      String(formData.get("reviewNote") ?? ""),
                    );
                  }}
                  className="mt-4 space-y-3"
                >
                  <textarea
                    name="reviewNote"
                    rows={4}
                    placeholder="Nhập lý do từ chối..."
                    className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />

                  <Button
                    type="submit"
                    variant="destructive"
                    className="gap-2"
                  >
                    <X className="size-4" />
                    Từ chối nội dung
                  </Button>
                </form>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[tag.approvalStatus]}`}
                >
                  {tag.approvalStatus === "APPROVED" ? (
                    <Check className="size-3" />
                  ) : (
                    <X className="size-3" />
                  )}

                  {STATUS_LABELS[tag.approvalStatus]}
                </span>

                <span className="text-muted-foreground text-sm">
                  Xử lý lúc: {formatDateTime(tag.reviewedAt)}
                </span>
              </div>

              {tag.reviewNote && (
                <div className="mt-4 rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground text-xs">
                    Ghi chú kiểm duyệt
                  </p>

                  <p className="mt-1 text-sm">{tag.reviewNote}</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </AdminSectionPage>
  );
}