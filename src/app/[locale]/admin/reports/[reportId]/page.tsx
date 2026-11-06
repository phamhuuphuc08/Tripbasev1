import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  FileWarning,
  MapPinOff,
  PlaneTakeoff,
  ShieldCheck,
  Undo2,
  UserRound,
  XCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ReportReason, ReportStatus, ReportTargetType } from "@prisma/client";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import {
  markReportReviewingAction,
  rejectReportAction,
  resolveReportAction,
} from "@/features/admin/report-actions";
import {
  blockTagCreationAction,
  blockTripCreationAction,
  removeTagCreationBlockAction,
  removeTripCreationBlockAction,
  removeUserSuspensionAction,
  suspendUserAction,
} from "@/features/admin/user-actions";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminReport } from "@/server/admin/report-admin.service";
import {
  isTagCreationBlocked,
  isTripCreationBlocked,
  isUserSuspended,
} from "@/server/admin/user-admin.service";
import { prisma } from "@/server/db/client";

const STATUS_LABELS: Record<ReportStatus, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  RESOLVED: "Đã xử lý",
  REJECTED: "Đã bỏ qua",
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

const REASON_LABELS: Record<ReportReason, string> = {
  SPAM: "Spam",
  INAPPROPRIATE_CONTENT: "Nội dung không phù hợp",
  FALSE_INFORMATION: "Thông tin sai lệch",
  HARASSMENT: "Quấy rối",
  FRAUD: "Lừa đảo",
  OTHER: "Khác",
};

const dayOptions = [
  { value: "1", label: "1 ngày" },
  { value: "3", label: "3 ngày" },
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
];

async function getReportTarget(targetType: ReportTargetType, targetId: string) {
  if (targetType === "USER") {
    const user = await prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        email: true,
        suspendedUntil: true,
        tripCreateBlockedUntil: true,
        tagCreateBlockedUntil: true,
      },
    });

    if (!user) return null;

    return {
      type: "USER" as const,
      id: user.id,
      title: user.name,
      subtitle: user.email,
      href: `/admin/users/${user.id}`,
      user,
    };
  }

  if (targetType === "TRIP") {
    const trip = await prisma.trip.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        name: true,
        destination: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            suspendedUntil: true,
            tripCreateBlockedUntil: true,
            tagCreateBlockedUntil: true,
          },
        },
      },
    });

    if (!trip) return null;

    return {
      type: "TRIP" as const,
      id: trip.id,
      title: trip.name,
      subtitle: trip.destination,
      href: `/admin/trips/${trip.id}`,
      user: trip.owner,
    };
  }

  const tag = await prisma.locationTag.findUnique({
    where: { id: targetId },
    select: {
      id: true,
      title: true,
      category: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          suspendedUntil: true,
          tripCreateBlockedUntil: true,
          tagCreateBlockedUntil: true,
        },
      },
    },
  });

  if (!tag) return null;

  return {
    type: "TAG" as const,
    id: tag.id,
    title: tag.title,
    subtitle: tag.category || "Chưa phân loại",
    href: `/admin/tags/${tag.id}`,
    user: tag.owner,
  };
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const admin = await requireAdmin();
  const { reportId } = await params;

  const report = await getAdminReport(reportId);
  if (!report) notFound();

  const target = await getReportTarget(report.targetType, report.targetId);

  const targetUser = target?.user ?? null;
  const isSelf = targetUser?.id === admin.id;

  const isSuspended = targetUser
    ? isUserSuspended(targetUser.suspendedUntil)
    : false;

  const isTripBlocked = targetUser
    ? isTripCreationBlocked(targetUser.tripCreateBlockedUntil)
    : false;

  const isTagBlocked = targetUser
    ? isTagCreationBlocked(targetUser.tagCreateBlockedUntil)
    : false;

  const finished =
    report.status === "RESOLVED" ||
    report.status === "REJECTED";

  return (
    <AdminSectionPage
      title="Chi tiết báo cáo"
      description={`Mã báo cáo: ${report.id}`}
    >
      <div className="space-y-6">
        {/* STATUS */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-muted-foreground text-sm">Trạng thái</p>

            <div className="mt-3">
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[report.status]}`}
              >
                {STATUS_LABELS[report.status]}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-muted-foreground text-sm">Đối tượng</p>
            <p className="mt-2 text-lg font-semibold">
              {TARGET_LABELS[report.targetType]}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <p className="text-muted-foreground text-sm">Lý do</p>
            <p className="mt-2 text-lg font-semibold">
              {REASON_LABELS[report.reason]}
            </p>
          </div>
        </div>

        {/* REPORT INFO */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="bg-red-500/10 text-red-600 flex size-10 items-center justify-center rounded-xl">
              <FileWarning className="size-5" />
            </span>

            <div>
              <h2 className="font-semibold">Nội dung báo cáo</h2>
              <p className="text-muted-foreground text-sm">
                Thông tin do thành viên gửi đến hệ thống.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Người báo cáo</p>

              <Link
                href={`/admin/users/${report.reporter.id}`}
                className="mt-1 block font-medium hover:underline"
              >
                {report.reporter.name}
              </Link>

              <p className="text-muted-foreground mt-1 text-sm">
                {report.reporter.email}
              </p>
            </div>

            <div className="rounded-xl border p-4">
              <p className="text-muted-foreground text-xs">Thời điểm gửi</p>
              <p className="mt-1 text-sm font-medium">
                {report.createdAt.toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border p-4">
            <p className="text-muted-foreground text-xs">Mô tả</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
              {report.description || "Người dùng không cung cấp mô tả."}
            </p>
          </div>
        </section>

        {/* TARGET */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-3">
            <AlertTriangle className="text-orange-600 size-5" />

            <div>
              <h2 className="font-semibold">Đối tượng bị báo cáo</h2>
              <p className="text-muted-foreground text-sm">
                Kiểm tra nội dung trước khi thực hiện biện pháp xử lý.
              </p>
            </div>
          </div>

          {target ? (
            <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-muted-foreground text-xs">
                  {TARGET_LABELS[report.targetType]}
                </p>

                <Link
                  href={target.href}
                  className="mt-1 block font-medium hover:underline"
                >
                  {target.title}
                </Link>

                <p className="text-muted-foreground mt-1 text-sm">
                  {target.subtitle}
                </p>
              </div>

              <Link
                href={target.href}
                className="text-primary text-sm font-medium hover:underline"
              >
                Xem chi tiết →
              </Link>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5">
              <p className="text-muted-foreground text-sm">
                Đối tượng này không còn tồn tại hoặc đã bị xóa.
              </p>

              <p className="text-muted-foreground mt-1 break-all text-xs">
                ID: {report.targetId}
              </p>
            </div>
          )}
        </section>

        {/* TARGET OWNER */}
        {targetUser && (
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <UserRound className="text-muted-foreground size-5" />

              <div>
                <h2 className="font-semibold">
                  {report.targetType === "USER"
                    ? "Tài khoản bị báo cáo"
                    : "Chủ sở hữu nội dung"}
                </h2>

                <p className="text-muted-foreground text-sm">
                  Các biện pháp quản trị sẽ được áp dụng lên tài khoản này.
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
              <div>
                <Link
                  href={`/admin/users/${targetUser.id}`}
                  className="font-medium hover:underline"
                >
                  {targetUser.name}
                </Link>

                <p className="text-muted-foreground mt-1 text-sm">
                  {targetUser.email}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {isSuspended && (
                  <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600">
                    Đình chỉ
                  </span>
                )}

                {isTripBlocked && (
                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600">
                    Chặn Trip
                  </span>
                )}

                {isTagBlocked && (
                  <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-600">
                    Chặn Tag
                  </span>
                )}

                {!isSuspended && !isTripBlocked && !isTagBlocked && (
                  <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600">
                    Bình thường
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MODERATION */}
        {!finished && (
          <section>
            <div className="mb-4">
              <h2 className="font-semibold">Xử lý báo cáo</h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Chọn biện pháp phù hợp sau khi kiểm tra nội dung.
              </p>
            </div>

            {report.status === "PENDING" && (
              <div className="mb-4 rounded-2xl border bg-blue-500/5 p-5">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="font-medium">Bắt đầu xem xét</h3>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Chuyển báo cáo từ chờ xử lý sang đang xem xét.
                    </p>
                  </div>

                  <form
                    action={markReportReviewingAction.bind(
                      null,
                      report.id,
                      "",
                    )}
                  >
                    <Button type="submit" className="gap-2">
                      <Clock3 className="size-4" />
                      Đang xem xét
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {targetUser && !isSelf && (
              <div className="grid gap-4 xl:grid-cols-3">
                {/* SUSPEND */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="font-medium">Đình chỉ tài khoản</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Chặn toàn bộ quyền sử dụng TripBase.
                  </p>

                  {isSuspended ? (
                    <form
                      action={removeUserSuspensionAction.bind(
                        null,
                        targetUser.id,
                      )}
                      className="mt-4"
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        className="gap-2"
                      >
                        <Undo2 className="size-4" />
                        Gỡ đình chỉ
                      </Button>
                    </form>
                  ) : (
                    <form
                      action={async (formData) => {
                        "use server";

                        await suspendUserAction(
                          targetUser.id,
                          Number(formData.get("days")),
                          String(
                            formData.get("reason") ??
                              `Xử lý báo cáo ${report.id}`,
                          ),
                        );
                      }}
                      className="mt-4 space-y-3"
                    >
                      <select
                        name="days"
                        defaultValue="7"
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      >
                        {dayOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        name="reason"
                        defaultValue={`Xử lý báo cáo ${report.id}`}
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      />

                      <Button
                        type="submit"
                        variant="destructive"
                        className="gap-2"
                      >
                        <Ban className="size-4" />
                        Đình chỉ
                      </Button>
                    </form>
                  )}
                </div>

                {/* BLOCK TRIP */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="font-medium">Chặn tạo Trip</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Người dùng vẫn đăng nhập được nhưng không tạo Trip mới.
                  </p>

                  {isTripBlocked ? (
                    <form
                      action={removeTripCreationBlockAction.bind(
                        null,
                        targetUser.id,
                      )}
                      className="mt-4"
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        className="gap-2"
                      >
                        <Undo2 className="size-4" />
                        Gỡ chặn
                      </Button>
                    </form>
                  ) : (
                    <form
                      action={async (formData) => {
                        "use server";

                        await blockTripCreationAction(
                          targetUser.id,
                          Number(formData.get("days")),
                          String(
                            formData.get("reason") ??
                              `Xử lý báo cáo ${report.id}`,
                          ),
                        );
                      }}
                      className="mt-4 space-y-3"
                    >
                      <select
                        name="days"
                        defaultValue="7"
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      >
                        {dayOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        name="reason"
                        defaultValue={`Xử lý báo cáo ${report.id}`}
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      />

                      <Button
                        type="submit"
                        variant="destructive"
                        className="gap-2"
                      >
                        <PlaneTakeoff className="size-4" />
                        Chặn tạo Trip
                      </Button>
                    </form>
                  )}
                </div>

                {/* BLOCK TAG */}
                <div className="rounded-2xl border bg-card p-5 shadow-sm">
                  <h3 className="font-medium">Chặn tạo Tag & Tip</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Người dùng vẫn sử dụng TripBase nhưng không tạo Tag mới.
                  </p>

                  {isTagBlocked ? (
                    <form
                      action={removeTagCreationBlockAction.bind(
                        null,
                        targetUser.id,
                      )}
                      className="mt-4"
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        className="gap-2"
                      >
                        <Undo2 className="size-4" />
                        Gỡ chặn
                      </Button>
                    </form>
                  ) : (
                    <form
                      action={async (formData) => {
                        "use server";

                        await blockTagCreationAction(
                          targetUser.id,
                          Number(formData.get("days")),
                          String(
                            formData.get("reason") ??
                              `Xử lý báo cáo ${report.id}`,
                          ),
                        );
                      }}
                      className="mt-4 space-y-3"
                    >
                      <select
                        name="days"
                        defaultValue="7"
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      >
                        {dayOptions.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>

                      <input
                        name="reason"
                        defaultValue={`Xử lý báo cáo ${report.id}`}
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                      />

                      <Button
                        type="submit"
                        variant="destructive"
                        className="gap-2"
                      >
                        <MapPinOff className="size-4" />
                        Chặn tạo Tag
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {isSelf && (
              <div className="mt-4 rounded-2xl border bg-muted/30 p-4">
                <p className="text-muted-foreground text-sm">
                  Đối tượng liên quan đến chính tài khoản Admin đang đăng
                  nhập nên các thao tác khóa tài khoản đã được vô hiệu hóa.
                </p>
              </div>
            )}

            {/* COMPLETE */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-5">
                <h3 className="font-medium text-green-700">
                  Hoàn tất xử lý
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Dùng khi báo cáo hợp lệ và Admin đã thực hiện biện pháp
                  cần thiết.
                </p>

                <form
                  action={async (formData) => {
                    "use server";

                    await resolveReportAction(
                      report.id,
                      String(formData.get("reviewNote") ?? ""),
                    );
                  }}
                  className="mt-4 space-y-3"
                >
                  <textarea
                    name="reviewNote"
                    rows={3}
                    placeholder="Ghi chú cách đã xử lý..."
                    className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm"
                  />

                  <Button type="submit" className="gap-2">
                    <CheckCircle2 className="size-4" />
                    Đánh dấu đã xử lý
                  </Button>
                </form>
              </div>

              <div className="rounded-2xl border p-5">
                <h3 className="font-medium">Bỏ qua báo cáo</h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Dùng khi báo cáo không đúng, không đủ căn cứ hoặc không
                  vi phạm.
                </p>

                <form
                  action={async (formData) => {
                    "use server";

                    await rejectReportAction(
                      report.id,
                      String(formData.get("reviewNote") ?? ""),
                    );
                  }}
                  className="mt-4 space-y-3"
                >
                  <textarea
                    name="reviewNote"
                    rows={3}
                    placeholder="Lý do bỏ qua báo cáo..."
                    className="border-input bg-background w-full resize-none rounded-md border px-3 py-2 text-sm"
                  />

                  <Button
                    type="submit"
                    variant="outline"
                    className="gap-2"
                  >
                    <XCircle className="size-4" />
                    Bỏ qua báo cáo
                  </Button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* FINISHED */}
        {finished && (
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex gap-3">
              <ShieldCheck className="text-green-600 mt-0.5 size-5" />

              <div className="flex-1">
                <h2 className="font-semibold">
                  Báo cáo đã được xử lý
                </h2>

                <p className="text-muted-foreground mt-1 text-sm">
                  {report.status === "RESOLVED"
                    ? "Admin xác nhận báo cáo và đã hoàn tất xử lý."
                    : "Admin đã bỏ qua báo cáo này."}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs">
                      Người xử lý
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {report.reviewedBy?.name || "—"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs">
                      Thời điểm
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {report.reviewedAt?.toLocaleString("vi-VN") || "—"}
                    </p>
                  </div>
                </div>

                {report.reviewNote && (
                  <div className="mt-3 rounded-xl bg-muted/40 p-3">
                    <p className="text-muted-foreground text-xs">
                      Ghi chú xử lý
                    </p>
                    <p className="mt-1 text-sm">
                      {report.reviewNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </AdminSectionPage>
  );
}