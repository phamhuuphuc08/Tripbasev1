import {
  Ban,
  CalendarDays,
  CircleCheck,
  MapPin,
  MapPinOff,
  Plane,
  PlaneTakeoff,
  ShieldCheck,
  Trash2,
  Undo2,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import {
  blockTagCreationAction,
  blockTripCreationAction,
  removeTagCreationBlockAction,
  removeTripCreationBlockAction,
  removeUserSuspensionAction,
  softDeleteUserAction,
  suspendUserAction,
} from "@/features/admin/user-actions";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminUser } from "@/server/admin/user-admin.service";

function isActiveUntil(value: Date | null) {
  return value !== null && value.getTime() > Date.now();
}

function formatDateTime(value: Date | null) {
  return value ? value.toLocaleString("vi-VN") : "—";
}

function StatusBadge({ active, activeLabel, inactiveLabel }: { active: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${active ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

const dayOptions = [
  { value: "1", label: "1 ngày" },
  { value: "3", label: "3 ngày" },
  { value: "7", label: "7 ngày" },
  { value: "30", label: "30 ngày" },
  { value: "90", label: "90 ngày" },
];

export default async function AdminUserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdmin();
  const { userId } = await params;
  const user = await getAdminUser(userId);

  if (!user) notFound();

  const isSelf = admin.id === user.id;
  const isSuspended = isActiveUntil(user.suspendedUntil);
  const isTripBlocked = isActiveUntil(user.tripCreateBlockedUntil);
  const isTagBlocked = isActiveUntil(user.tagCreateBlockedUntil);

  return (
    <AdminSectionPage title={user.name} description={user.email}>
      <div className="space-y-6">
        {/* SUMMARY */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tài khoản</p>
                <p className="mt-2 text-lg font-semibold">{user.role === "ADMIN" ? "Quản trị viên" : "Người dùng"}</p>
              </div>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <UserRound className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Chuyến đi</p>
                <p className="mt-2 text-3xl font-bold">{user._count.trips}</p>
              </div>
              <span className="bg-blue-500/10 text-blue-600 flex size-10 items-center justify-center rounded-xl">
                <Plane className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Tag & Tip</p>
                <p className="mt-2 text-3xl font-bold">{user._count.locationTags}</p>
              </div>
              <span className="bg-green-500/10 text-green-600 flex size-10 items-center justify-center rounded-xl">
                <MapPin className="size-5" />
              </span>
            </div>
          </div>
        </div>

        {/* ACCOUNT INFO */}
        <section className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
              <ShieldCheck className="size-5" />
            </span>
            <div>
              <h2 className="font-semibold">Thông tin tài khoản</h2>
              <p className="text-muted-foreground text-sm">Thông tin cơ bản và trạng thái hiện tại của thành viên.</p>
            </div>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">ID</dt>
              <dd className="mt-1 break-all text-sm font-medium">{user.id}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Vai trò</dt>
              <dd className="mt-1 text-sm font-medium">{user.role === "ADMIN" ? "Admin" : "User"}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Ngày tham gia</dt>
              <dd className="mt-1 text-sm font-medium">{user.createdAt.toLocaleDateString("vi-VN")}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Trạng thái</dt>
              <dd className="mt-2">
                <StatusBadge active={isSuspended} activeLabel="Đang đình chỉ" inactiveLabel="Đang hoạt động" />
              </dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Giới thiệu</dt>
              <dd className="mt-1 text-sm">{user.bio || "—"}</dd>
            </div>

            <div className="rounded-xl border p-4">
              <dt className="text-muted-foreground text-xs">Sở thích du lịch</dt>
              <dd className="mt-1 text-sm">{user.travelInterests.join(", ") || "—"}</dd>
            </div>
          </dl>
        </section>

        {/* RESTRICTIONS */}
        <section>
          <div className="mb-4">
            <h2 className="font-semibold">Trạng thái hạn chế</h2>
            <p className="text-muted-foreground mt-1 text-sm">Theo dõi các giới hạn đang áp dụng cho tài khoản.</p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ban className="size-4" />
                  <h3 className="font-medium">Tài khoản</h3>
                </div>
                <StatusBadge active={isSuspended} activeLabel="Đình chỉ" inactiveLabel="Bình thường" />
              </div>

              <p className="text-muted-foreground mt-4 text-xs">Đến: {formatDateTime(user.suspendedUntil)}</p>
              {user.suspensionReason && <p className="mt-2 text-sm"><span className="text-muted-foreground">Lý do:</span> {user.suspensionReason}</p>}
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <PlaneTakeoff className="size-4" />
                  <h3 className="font-medium">Tạo Trip</h3>
                </div>
                <StatusBadge active={isTripBlocked} activeLabel="Đang chặn" inactiveLabel="Được phép" />
              </div>

              <p className="text-muted-foreground mt-4 text-xs">Đến: {formatDateTime(user.tripCreateBlockedUntil)}</p>
              {user.tripBlockReason && <p className="mt-2 text-sm"><span className="text-muted-foreground">Lý do:</span> {user.tripBlockReason}</p>}
            </div>

            <div className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MapPinOff className="size-4" />
                  <h3 className="font-medium">Tạo Tag & Tip</h3>
                </div>
                <StatusBadge active={isTagBlocked} activeLabel="Đang chặn" inactiveLabel="Được phép" />
              </div>

              <p className="text-muted-foreground mt-4 text-xs">Đến: {formatDateTime(user.tagCreateBlockedUntil)}</p>
              {user.tagBlockReason && <p className="mt-2 text-sm"><span className="text-muted-foreground">Lý do:</span> {user.tagBlockReason}</p>}
            </div>
          </div>
        </section>

        {/* MANAGEMENT */}
        {!isSelf ? (
          <section>
            <div className="mb-4">
              <h2 className="font-semibold">Quản trị tài khoản</h2>
              <p className="text-muted-foreground mt-1 text-sm">Áp dụng hoặc gỡ các giới hạn hoạt động đối với người dùng.</p>
            </div>

            <div className="grid gap-4 xl:grid-cols-3">
              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-medium">Đình chỉ tài khoản</h3>
                <p className="text-muted-foreground mt-1 text-sm">Chặn toàn bộ quyền sử dụng tài khoản trong khoảng thời gian đã chọn.</p>

                {isSuspended ? (
                  <form action={removeUserSuspensionAction.bind(null, user.id)} className="mt-5">
                    <Button type="submit" variant="outline" className="gap-2">
                      <Undo2 className="size-4" />
                      Gỡ đình chỉ
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (formData) => {
                      "use server";
                      await suspendUserAction(user.id, Number(formData.get("days")), String(formData.get("reason") ?? ""));
                    }}
                    className="mt-5 space-y-3"
                  >
                    <select name="days" defaultValue="7" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm">
                      {dayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>

                    <input name="reason" placeholder="Lý do đình chỉ" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" />

                    <Button type="submit" variant="destructive" className="gap-2">
                      <Ban className="size-4" />
                      Đình chỉ tài khoản
                    </Button>
                  </form>
                )}
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-medium">Quyền tạo Trip</h3>
                <p className="text-muted-foreground mt-1 text-sm">Chặn tạo chuyến đi mới nhưng vẫn cho phép sử dụng các tính năng khác.</p>

                {isTripBlocked ? (
                  <form action={removeTripCreationBlockAction.bind(null, user.id)} className="mt-5">
                    <Button type="submit" variant="outline" className="gap-2">
                      <Undo2 className="size-4" />
                      Gỡ chặn tạo Trip
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (formData) => {
                      "use server";
                      await blockTripCreationAction(user.id, Number(formData.get("days")), String(formData.get("reason") ?? ""));
                    }}
                    className="mt-5 space-y-3"
                  >
                    <select name="days" defaultValue="7" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm">
                      {dayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>

                    <input name="reason" placeholder="Lý do chặn tạo Trip" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" />

                    <Button type="submit" variant="destructive" className="gap-2">
                      <PlaneTakeoff className="size-4" />
                      Chặn tạo Trip
                    </Button>
                  </form>
                )}
              </div>

              <div className="rounded-2xl border bg-card p-5 shadow-sm">
                <h3 className="font-medium">Quyền tạo Tag & Tip</h3>
                <p className="text-muted-foreground mt-1 text-sm">Chặn gửi địa điểm mới nhưng người dùng vẫn có thể sử dụng TripBase.</p>

                {isTagBlocked ? (
                  <form action={removeTagCreationBlockAction.bind(null, user.id)} className="mt-5">
                    <Button type="submit" variant="outline" className="gap-2">
                      <Undo2 className="size-4" />
                      Gỡ chặn tạo Tag
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (formData) => {
                      "use server";
                      await blockTagCreationAction(user.id, Number(formData.get("days")), String(formData.get("reason") ?? ""));
                    }}
                    className="mt-5 space-y-3"
                  >
                    <select name="days" defaultValue="7" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm">
                      {dayOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </select>

                    <input name="reason" placeholder="Lý do chặn tạo Tag" className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm" />

                    <Button type="submit" variant="destructive" className="gap-2">
                      <MapPinOff className="size-4" />
                      Chặn tạo Tag
                    </Button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h3 className="font-medium text-destructive">Xóa tài khoản</h3>
                  <p className="text-muted-foreground mt-1 text-sm">Xóa mềm tài khoản. Trip, Tag và dữ liệu liên quan vẫn được giữ trong database.</p>
                </div>

                <form action={softDeleteUserAction.bind(null, user.id)}>
                  <Button type="submit" variant="destructive" className="gap-2">
                    <Trash2 className="size-4" />
                    Xóa tài khoản
                  </Button>
                </form>
              </div>
            </div>
          </section>
        ) : (
          <div className="rounded-2xl border bg-primary/5 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="text-primary mt-0.5 size-5" />
              <div>
                <p className="font-medium">Tài khoản Admin hiện tại</p>
                <p className="text-muted-foreground mt-1 text-sm">Không thể tự đình chỉ, tự chặn quyền hoặc tự xóa tài khoản đang đăng nhập.</p>
              </div>
            </div>
          </div>
        )}

        {/* RECENT CONTENT */}
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <Plane className="text-muted-foreground size-5" />
              <div>
                <h2 className="font-semibold">Chuyến đi gần đây</h2>
                <p className="text-muted-foreground text-xs">10 chuyến đi mới nhất của người dùng.</p>
              </div>
            </div>

            {user.trips.length === 0 ? (
              <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">Người dùng chưa có chuyến đi.</p>
              </div>
            ) : (
              <div className="divide-y">
                {user.trips.map((trip) => (
                  <div key={trip.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/admin/trips/${trip.id}`} className="text-sm font-medium hover:underline">
                        {trip.name}
                      </Link>
                      <p className="text-muted-foreground mt-1 truncate text-xs">{trip.destination} · {trip.status} · {trip.visibility}</p>
                    </div>

                    <time className="text-muted-foreground shrink-0 text-xs">{trip.createdAt.toLocaleDateString("vi-VN")}</time>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <MapPin className="text-muted-foreground size-5" />
              <div>
                <h2 className="font-semibold">Tag & Tip gần đây</h2>
                <p className="text-muted-foreground text-xs">10 Tag & Tip mới nhất của người dùng.</p>
              </div>
            </div>

            {user.locationTags.length === 0 ? (
              <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">Người dùng chưa tạo Tag & Tip.</p>
              </div>
            ) : (
              <div className="divide-y">
                {user.locationTags.map((tag) => (
                  <div key={tag.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <Link href={`/admin/tags/${tag.id}`} className="text-sm font-medium hover:underline">
                        {tag.title}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">{tag.approvalStatus}</p>
                    </div>

                    <time className="text-muted-foreground shrink-0 text-xs">{tag.createdAt.toLocaleDateString("vi-VN")}</time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="text-muted-foreground size-4" />
            <span className="text-muted-foreground">Cập nhật tài khoản gần nhất:</span>
            <span className="font-medium">{user.updatedAt.toLocaleString("vi-VN")}</span>
          </div>
        </div>
      </div>
    </AdminSectionPage>
  );
}
