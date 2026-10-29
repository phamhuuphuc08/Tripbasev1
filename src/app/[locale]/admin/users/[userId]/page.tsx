import {
  Ban,
  MapPinOff,
  PlaneTakeoff,
  Trash2,
  Undo2,
} from "lucide-react";
import { notFound } from "next/navigation";

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

function isActiveUntil(
  value: Date | null,
) {
  return (
    value !== null &&
    value.getTime() > Date.now()
  );
}

function formatDateTime(
  value: Date | null,
) {
  if (!value) {
    return "—";
  }

  return value.toLocaleString(
    "vi-VN",
  );
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{
    userId: string;
  }>;
}) {
  const admin =
    await requireAdmin();

  const { userId } =
    await params;

  const user =
    await getAdminUser(userId);

  if (!user) {
    notFound();
  }

  const isSelf =
    admin.id === user.id;

  const isSuspended =
    isActiveUntil(
      user.suspendedUntil,
    );

  const isTripBlocked =
    isActiveUntil(
      user.tripCreateBlockedUntil,
    );

  const isTagBlocked =
    isActiveUntil(
      user.tagCreateBlockedUntil,
    );

  return (
    <AdminSectionPage
      title={user.name}
      description={user.email}
    >
      <div className="space-y-8">
        {/* THÔNG TIN TÀI KHOẢN */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Thông tin tài khoản
          </h2>

          <dl className="grid gap-x-8 gap-y-4 border-y py-5 sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground text-sm">
                ID
              </dt>

              <dd className="mt-1 break-all">
                {user.id}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Vai trò
              </dt>

              <dd className="mt-1">
                {user.role}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Ngày tham gia
              </dt>

              <dd className="mt-1">
                {user.createdAt.toLocaleDateString(
                  "vi-VN",
                )}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Tổng chuyến đi
              </dt>

              <dd className="mt-1">
                {user._count.trips}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Tổng địa điểm
              </dt>

              <dd className="mt-1">
                {user._count.locationTags}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Giới thiệu
              </dt>

              <dd className="mt-1">
                {user.bio || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Sở thích du lịch
              </dt>

              <dd className="mt-1">
                {user.travelInterests.join(
                  ", ",
                ) || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground text-sm">
                Trạng thái tài khoản
              </dt>

              <dd className="mt-1">
                {isSuspended
                  ? "Đang bị đình chỉ"
                  : "Đang hoạt động"}
              </dd>
            </div>
          </dl>
        </section>

        {/* TRẠNG THÁI HẠN CHẾ */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            Trạng thái hạn chế
          </h2>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* ACCOUNT */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <Ban className="size-4" />

                <h3 className="font-medium">
                  Tài khoản
                </h3>
              </div>

              <p className="text-muted-foreground mt-3 text-sm">
                {isSuspended
                  ? "Đang bị đình chỉ"
                  : "Không bị đình chỉ"}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                Đến:{" "}
                {formatDateTime(
                  user.suspendedUntil,
                )}
              </p>

              {user.suspensionReason && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Lý do:{" "}
                  {user.suspensionReason}
                </p>
              )}
            </div>

            {/* TRIP */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="size-4" />

                <h3 className="font-medium">
                  Tạo Trip
                </h3>
              </div>

              <p className="text-muted-foreground mt-3 text-sm">
                {isTripBlocked
                  ? "Đang bị chặn"
                  : "Được phép"}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                Đến:{" "}
                {formatDateTime(
                  user.tripCreateBlockedUntil,
                )}
              </p>

              {user.tripBlockReason && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Lý do:{" "}
                  {user.tripBlockReason}
                </p>
              )}
            </div>

            {/* TAG */}
            <div className="rounded-xl border p-4">
              <div className="flex items-center gap-2">
                <MapPinOff className="size-4" />

                <h3 className="font-medium">
                  Tạo Tag & Tip
                </h3>
              </div>

              <p className="text-muted-foreground mt-3 text-sm">
                {isTagBlocked
                  ? "Đang bị chặn"
                  : "Được phép"}
              </p>

              <p className="text-muted-foreground mt-1 text-xs">
                Đến:{" "}
                {formatDateTime(
                  user.tagCreateBlockedUntil,
                )}
              </p>

              {user.tagBlockReason && (
                <p className="text-muted-foreground mt-2 text-xs">
                  Lý do:{" "}
                  {user.tagBlockReason}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* QUẢN TRỊ TÀI KHOẢN */}
        {!isSelf && (
          <section>
            <h2 className="mb-4 text-lg font-semibold">
              Quản trị tài khoản
            </h2>

            <div className="space-y-5">
              {/* SUSPEND ACCOUNT */}
              <div className="rounded-xl border p-5">
                <h3 className="font-medium">
                  Đình chỉ tài khoản
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Người dùng sẽ không thể sử dụng tài khoản trong thời gian bị đình chỉ.
                </p>

                {isSuspended ? (
                  <form
                    action={removeUserSuspensionAction.bind(
                      null,
                      user.id,
                    )}
                    className="mt-4"
                  >
                    <Button
                      type="submit"
                      variant="outline"
                    >
                      <Undo2 className="size-4" />
                      Gỡ đình chỉ
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (
                      formData,
                    ) => {
                      "use server";

                      const days =
                        Number(
                          formData.get(
                            "days",
                          ),
                        );

                      const reason =
                        String(
                          formData.get(
                            "reason",
                          ) ?? "",
                        );

                      await suspendUserAction(
                        user.id,
                        days,
                        reason,
                      );
                    }}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <select
                      name="days"
                      defaultValue="7"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    >
                      <option value="1">
                        1 ngày
                      </option>

                      <option value="3">
                        3 ngày
                      </option>

                      <option value="7">
                        7 ngày
                      </option>

                      <option value="30">
                        30 ngày
                      </option>

                      <option value="90">
                        90 ngày
                      </option>
                    </select>

                    <input
                      name="reason"
                      placeholder="Lý do đình chỉ"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    />

                    <div>
                      <Button
                        type="submit"
                        variant="destructive"
                      >
                        <Ban className="size-4" />
                        Đình chỉ tài khoản
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* BLOCK TRIP */}
              <div className="rounded-xl border p-5">
                <h3 className="font-medium">
                  Quyền tạo Trip
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Chặn người dùng tạo chuyến đi mới nhưng vẫn cho phép sử dụng các chức năng khác.
                </p>

                {isTripBlocked ? (
                  <form
                    action={removeTripCreationBlockAction.bind(
                      null,
                      user.id,
                    )}
                    className="mt-4"
                  >
                    <Button
                      type="submit"
                      variant="outline"
                    >
                      <Undo2 className="size-4" />
                      Gỡ chặn tạo Trip
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (
                      formData,
                    ) => {
                      "use server";

                      const days =
                        Number(
                          formData.get(
                            "days",
                          ),
                        );

                      const reason =
                        String(
                          formData.get(
                            "reason",
                          ) ?? "",
                        );

                      await blockTripCreationAction(
                        user.id,
                        days,
                        reason,
                      );
                    }}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <select
                      name="days"
                      defaultValue="7"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    >
                      <option value="1">
                        1 ngày
                      </option>

                      <option value="3">
                        3 ngày
                      </option>

                      <option value="7">
                        7 ngày
                      </option>

                      <option value="30">
                        30 ngày
                      </option>

                      <option value="90">
                        90 ngày
                      </option>
                    </select>

                    <input
                      name="reason"
                      placeholder="Lý do chặn tạo Trip"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    />

                    <div>
                      <Button
                        type="submit"
                        variant="destructive"
                      >
                        <PlaneTakeoff className="size-4" />
                        Chặn tạo Trip
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* BLOCK TAG */}
              <div className="rounded-xl border p-5">
                <h3 className="font-medium">
                  Quyền tạo Tag & Tip
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Chặn người dùng gửi địa điểm mới nhưng vẫn cho phép sử dụng TripBase.
                </p>

                {isTagBlocked ? (
                  <form
                    action={removeTagCreationBlockAction.bind(
                      null,
                      user.id,
                    )}
                    className="mt-4"
                  >
                    <Button
                      type="submit"
                      variant="outline"
                    >
                      <Undo2 className="size-4" />
                      Gỡ chặn tạo Tag
                    </Button>
                  </form>
                ) : (
                  <form
                    action={async (
                      formData,
                    ) => {
                      "use server";

                      const days =
                        Number(
                          formData.get(
                            "days",
                          ),
                        );

                      const reason =
                        String(
                          formData.get(
                            "reason",
                          ) ?? "",
                        );

                      await blockTagCreationAction(
                        user.id,
                        days,
                        reason,
                      );
                    }}
                    className="mt-4 flex flex-col gap-3"
                  >
                    <select
                      name="days"
                      defaultValue="7"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    >
                      <option value="1">
                        1 ngày
                      </option>

                      <option value="3">
                        3 ngày
                      </option>

                      <option value="7">
                        7 ngày
                      </option>

                      <option value="30">
                        30 ngày
                      </option>

                      <option value="90">
                        90 ngày
                      </option>
                    </select>

                    <input
                      name="reason"
                      placeholder="Lý do chặn tạo Tag"
                      className="border-input bg-background h-10 rounded-md border px-3 text-sm"
                    />

                    <div>
                      <Button
                        type="submit"
                        variant="destructive"
                      >
                        <MapPinOff className="size-4" />
                        Chặn tạo Tag
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {/* DELETE */}
              <div className="rounded-xl border border-destructive/30 p-5">
                <h3 className="font-medium text-destructive">
                  Xóa tài khoản
                </h3>

                <p className="text-muted-foreground mt-1 text-sm">
                  Đây là xóa mềm. Trip, Tag và dữ liệu liên quan của người dùng không bị xóa khỏi database.
                </p>

                <form
                  action={softDeleteUserAction.bind(
                    null,
                    user.id,
                  )}
                  className="mt-4"
                >
                  <Button
                    type="submit"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    Xóa tài khoản
                  </Button>
                </form>
              </div>
            </div>
          </section>
        )}

        {/* ADMIN SELF */}
        {isSelf && (
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-muted-foreground text-sm">
              Đây là tài khoản Admin đang đăng nhập. Không thể tự đình chỉ, tự chặn quyền hoặc tự xóa tài khoản này.
            </p>
          </div>
        )}

        {/* RECENT TRIPS */}
        <section>
          <h2 className="mb-3 font-medium">
            Chuyến đi gần đây
          </h2>

          {user.trips.length === 0 ? (
            <p className="text-muted-foreground border-y py-5 text-sm">
              Người dùng chưa có chuyến đi.
            </p>
          ) : (
            <ul className="divide-y border-y">
              {user.trips.map(
                (trip) => (
                  <li
                    key={trip.id}
                    className="flex justify-between gap-4 py-3"
                  >
                    <span>
                      {trip.name} ·{" "}
                      {trip.destination}
                    </span>

                    <time className="text-muted-foreground shrink-0 text-sm">
                      {trip.createdAt.toLocaleDateString(
                        "vi-VN",
                      )}
                    </time>
                  </li>
                ),
              )}
            </ul>
          )}
        </section>
      </div>
    </AdminSectionPage>
  );
}