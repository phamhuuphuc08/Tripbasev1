import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Eye,
  MapPin,
  Plane,
  Quote,
  Route,
  ShieldCheck,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { PlanStatus, PlanVisibility } from "@prisma/client";

import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminTrip } from "@/server/admin/trip-admin.service";

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

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("vi-VN") : "—";
}

function formatMoney(value: unknown, currency: string) {
  if (value === null || value === undefined) return "—";

  const number = Number(value);
  if (!Number.isFinite(number)) return "—";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(number);
}

export default async function AdminTripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  await requireAdmin();

  const { tripId } = await params;
  const trip = await getAdminTrip(tripId);

  if (!trip) notFound();

  return (
    <AdminSectionPage
      title={trip.name}
      description={`${trip.destination} · ${trip.owner.name}`}
    >
      <div className="space-y-6">
        {/* SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Trạng thái</p>

                <div className="mt-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGES[trip.status]}`}>
                    {STATUS_LABELS[trip.status]}
                  </span>
                </div>
              </div>

              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Plane className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Hiển thị</p>

                <div className="mt-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${VISIBILITY_BADGES[trip.visibility]}`}>
                    {VISIBILITY_LABELS[trip.visibility]}
                  </span>
                </div>
              </div>

              <span className="bg-blue-500/10 text-blue-600 flex size-10 items-center justify-center rounded-xl">
                <Eye className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Số người</p>
                <p className="mt-2 text-3xl font-bold">{trip.travelerCount}</p>
              </div>

              <span className="bg-orange-500/10 text-orange-600 flex size-10 items-center justify-center rounded-xl">
                <Users className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Xác minh tác giả</p>

                <p className={`mt-2 font-semibold ${trip.verifiedByAuthor ? "text-green-600" : "text-muted-foreground"}`}>
                  {trip.verifiedByAuthor ? "Đã xác minh" : "Chưa xác minh"}
                </p>
              </div>

              <span className="bg-green-500/10 text-green-600 flex size-10 items-center justify-center rounded-xl">
                <CheckCircle2 className="size-5" />
              </span>
            </div>
          </div>
        </div>

        {/* BASIC INFO */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <ShieldCheck className="size-5" />
            </span>

            <div>
              <h2 className="font-semibold">Thông tin chuyến đi</h2>
              <p className="text-muted-foreground text-sm">
                Thông tin cơ bản và cấu hình hiện tại của Trip.
              </p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">ID</dt>
              <dd className="mt-1 break-all text-sm font-medium">{trip.id}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Điểm đến</dt>
              <dd className="mt-1 text-sm font-medium">{trip.destination}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngày tạo</dt>
              <dd className="mt-1 text-sm font-medium">{formatDate(trip.createdAt)}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngày bắt đầu</dt>
              <dd className="mt-1 text-sm font-medium">{formatDate(trip.startDate)}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngày kết thúc</dt>
              <dd className="mt-1 text-sm font-medium">{formatDate(trip.endDate)}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngân sách mục tiêu</dt>
              <dd className="mt-1 text-sm font-medium">
                {formatMoney(trip.budgetTarget, trip.currency)}
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Nhịp độ</dt>
              <dd className="mt-1 text-sm font-medium">{trip.pace}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Phong cách du lịch</dt>
              <dd className="mt-1 text-sm">
                {trip.travelStyle.length > 0 ? trip.travelStyle.join(", ") : "—"}
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Cập nhật gần nhất</dt>
              <dd className="mt-1 text-sm font-medium">{trip.updatedAt.toLocaleString("vi-VN")}</dd>
            </div>
          </dl>
        </section>

        {/* OWNER */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="font-semibold">Chủ sở hữu</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Tài khoản đang sở hữu chuyến đi này.
            </p>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-xl border p-4 sm:flex-row sm:items-center">
            <div>
              <Link
                href={`/admin/users/${trip.owner.id}`}
                className="font-medium hover:underline"
              >
                {trip.owner.name}
              </Link>

              <p className="text-muted-foreground mt-1 text-sm">
                {trip.owner.email}
              </p>
            </div>

            <Link
              href={`/admin/users/${trip.owner.id}`}
              className="text-primary text-sm font-medium hover:underline"
            >
              Xem tài khoản →
            </Link>
          </div>
        </section>

        {/* STATS */}
        <section>
          <div className="mb-4">
            <h2 className="font-semibold">Hoạt động của Trip</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Các chỉ số liên quan đến lịch trình và tương tác.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Route className="text-blue-600 size-5" />
                <div>
                  <p className="text-muted-foreground text-xs">Lịch trình</p>
                  <p className="mt-1 text-2xl font-bold">{trip._count.itineraryItems}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Users className="text-orange-600 size-5" />
                <div>
                  <p className="text-muted-foreground text-xs">Cộng tác viên</p>
                  <p className="mt-1 text-2xl font-bold">{trip._count.collaborators}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Quote className="text-purple-600 size-5" />
                <div>
                  <p className="text-muted-foreground text-xs">Trích dẫn</p>
                  <p className="mt-1 text-2xl font-bold">{trip._count.citations}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <Eye className="text-green-600 size-5" />
                <div>
                  <p className="text-muted-foreground text-xs">Tương tác</p>
                  <p className="mt-1 text-2xl font-bold">{trip._count.interactions}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ITINERARY */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <CalendarDays className="text-muted-foreground size-5" />

            <div>
              <h2 className="font-semibold">Lịch trình</h2>
              <p className="text-muted-foreground text-sm">
                Tối đa 20 mục lịch trình đầu tiên.
              </p>
            </div>
          </div>

          {trip.itineraryItems.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed">
              <p className="text-muted-foreground text-sm">
                Trip chưa có lịch trình.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {trip.itineraryItems.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[80px_1fr_auto] sm:items-center"
                >
                  <span className="text-muted-foreground text-sm">
                    Ngày {item.day}
                  </span>

                  <div>
                    <p className="text-sm font-medium">{item.title}</p>

                    {(item.startTime || item.endTime) && (
                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.startTime?.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) ?? "—"}
                        {" – "}
                        {item.endTime?.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) ?? "—"}
                      </p>
                    )}
                  </div>

                  <MapPin className="text-muted-foreground hidden size-4 sm:block" />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Tạo:</span>
              <span>{trip.createdAt.toLocaleString("vi-VN")}</span>
            </div>

            <div className="flex items-center gap-2">
              <CircleDollarSign className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Tiền tệ:</span>
              <span>{trip.currency}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminSectionPage>
  );
}