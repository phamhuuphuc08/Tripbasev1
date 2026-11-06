import {
  AlertTriangle,
  Copy,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import {
  getAdminReputationAlerts,
  listAdminReputation,
} from "@/server/admin/reputation-admin.service";

function ScoreBadge({
  score,
}: {
  score: number;
}) {
  const style =
    score >= 70
      ? "bg-green-500/10 text-green-700"
      : score >= 40
        ? "bg-yellow-500/10 text-yellow-700"
        : "bg-red-500/10 text-red-700";

  return (
    <span
      className={`inline-flex min-w-14 justify-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}
    >
      {score.toFixed(2)}
    </span>
  );
}

export default async function AdminReputationPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    tab?: string;
  }>;
}) {
  await requireAdmin();

  const params =
    await searchParams;

  const query =
    params.q?.trim() || "";

  const tab =
    params.tab === "plans" ||
    params.tab === "tags"
      ? params.tab
      : "creators";

  const [
    reputation,
    alerts,
  ] =
    await Promise.all([
      listAdminReputation(
        query,
      ),
      getAdminReputationAlerts(),
    ]);

  const {
    creators,
    plans,
    tags,
    stats,
  } = reputation;

  const creatorRows =
    creators.map(
      (creator) => ({
        ...creator,
        id: creator.userId,
      }),
    );

  const planRows =
    plans.map(
      (plan) => ({
        ...plan,
        id: plan.planId,
      }),
    );

  return (
    <AdminSectionPage
      title="Uy tín"
      description="Theo dõi điểm uy tín của nhà sáng tạo, Trip và Tag & Tip trong TripBase."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Nhà sáng tạo
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.creatorCount}
                </p>
              </div>

              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Users className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Trip có uy tín
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.planCount}
                </p>
              </div>

              <span className="bg-blue-500/10 text-blue-600 flex size-10 items-center justify-center rounded-xl">
                <Route className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Tag đã duyệt
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.tagCount}
                </p>
              </div>

              <span className="bg-green-500/10 text-green-600 flex size-10 items-center justify-center rounded-xl">
                <MapPin className="size-5" />
              </span>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  CopyPlan trung bình
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {stats.averageCreatorScore.toFixed(
                    1,
                  )}
                </p>
              </div>

              <span className="bg-purple-500/10 text-purple-600 flex size-10 items-center justify-center rounded-xl">
                <ShieldCheck className="size-5" />
              </span>
            </div>
          </div>
        </div>

        {alerts.length > 0 && (
          <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700">
                  <AlertTriangle className="size-5" />
                </span>

                <div>
                  <h2 className="font-semibold">
                    Cảnh báo uy tín
                  </h2>

                  <p className="text-muted-foreground mt-1 text-sm">
                    Phát hiện {alerts.length} đối tượng có điểm uy tín thấp hoặc hoạt động cần kiểm tra.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {alerts
                .slice(
                  0,
                  8,
                )
                .map(
                  (alert) => (
                    <Link
                      key={
                        alert.id
                      }
                      href={
                        alert.href
                      }
                      className="hover:bg-background flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 transition sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              alert.level ===
                              "HIGH"
                                ? "bg-red-500/10 text-red-700"
                                : "bg-amber-500/10 text-amber-700"
                            }`}
                          >
                            {alert.level ===
                            "HIGH"
                              ? "Cao"
                              : "Cần kiểm tra"}
                          </span>

                          <span className="text-muted-foreground text-xs">
                            {alert.type ===
                            "CREATOR"
                              ? "Nhà sáng tạo"
                              : alert.type ===
                                  "PLAN"
                                ? "Trip"
                                : "Tag & Tip"}
                          </span>
                        </div>

                        <p className="mt-2 truncate text-sm font-medium">
                          {
                            alert.title
                          }
                        </p>

                        <p className="text-muted-foreground mt-1 text-xs">
                          {
                            alert.description
                          }
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-muted-foreground text-xs">
                          Điểm
                        </p>

                        <p
                          className={`text-lg font-bold ${
                            alert.level ===
                            "HIGH"
                              ? "text-red-600"
                              : "text-amber-600"
                          }`}
                        >
                          {alert.score.toFixed(
                            2,
                          )}
                        </p>
                      </div>
                    </Link>
                  ),
                )}
            </div>

            {alerts.length > 8 && (
              <p className="text-muted-foreground mt-3 text-xs">
                Còn {alerts.length - 8} cảnh báo khác.
              </p>
            )}
          </section>
        )}

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <form className="relative max-w-xl">
            <input
              type="hidden"
              name="tab"
              value={tab}
            />

            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />

            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Tìm nhà sáng tạo, Trip hoặc Tag..."
              className="border-input bg-background h-10 w-full rounded-md border pl-9 pr-3 text-sm"
            />
          </form>
        </div>

        <div className="flex flex-wrap gap-2 border-b pb-3">
          <Link
            href={
              query
                ? `/admin/reputation?tab=creators&q=${encodeURIComponent(query)}`
                : "/admin/reputation?tab=creators"
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "creators"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Nhà sáng tạo
          </Link>

          <Link
            href={
              query
                ? `/admin/reputation?tab=plans&q=${encodeURIComponent(query)}`
                : "/admin/reputation?tab=plans"
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "plans"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Trip
          </Link>

          <Link
            href={
              query
                ? `/admin/reputation?tab=tags&q=${encodeURIComponent(query)}`
                : "/admin/reputation?tab=tags"
            }
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === "tags"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Tag & Tip
          </Link>
        </div>

        {tab === "creators" && (
          <AdminTable
            rows={creatorRows}
            columns={[
              {
                key: "user",
                label: "Nhà sáng tạo",
                render:
                  (creator) => (
                    <div>
                      <Link
                        href={`/admin/reputation/creator/${creator.user.id}`}
                        className="font-medium hover:underline"
                      >
                        {
                          creator
                            .user
                            .name
                        }
                      </Link>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {
                          creator
                            .user
                            .email
                        }
                      </p>
                    </div>
                  ),
              },

              {
                key: "copyplanScore",
                label: "CopyPlan Score",
                render:
                  (creator) => (
                    <ScoreBadge
                      score={
                        creator.copyplanScore
                      }
                    />
                  ),
              },

              {
                key: "totalPlans",
                label: "Kế hoạch",
              },

              {
                key: "totalCopies",
                label: "Lượt sao chép",
              },

              {
                key: "lastUpdated",
                label: "Cập nhật",
                render:
                  (creator) =>
                    creator.lastUpdated.toLocaleString(
                      "vi-VN",
                    ),
              },
            ]}
          />
        )}

        {tab === "plans" && (
          <AdminTable
            rows={planRows}
            columns={[
              {
                key: "plan",
                label: "Trip",
                render:
                  (item) => (
                    <div>
                      <Link
                        href={`/admin/reputation/plan/${item.plan.id}`}
                        className="font-medium hover:underline"
                      >
                        {
                          item
                            .plan
                            .name
                        }
                      </Link>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {
                          item
                            .plan
                            .destination
                        }
                      </p>
                    </div>
                  ),
              },

              {
                key: "owner",
                label: "Chủ sở hữu",
                render:
                  (item) => (
                    <Link
                      href={`/admin/users/${item.plan.owner.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {
                        item
                          .plan
                          .owner
                          .name
                      }
                    </Link>
                  ),
              },

              {
                key: "copyplanScore",
                label: "CopyPlan Score",
                render:
                  (item) => (
                    <ScoreBadge
                      score={
                        item.copyplanScore
                      }
                    />
                  ),
              },

              {
                key: "eligibleCopyCount",
                label: "Copy hợp lệ",
              },

              {
                key: "retention",
                label: "Giữ lại",
                render:
                  (item) =>
                    `${(
                      item.averageRetentionRate *
                      100
                    ).toFixed(0)}%`,
              },

              {
                key: "completion",
                label: "Hoàn thành",
                render:
                  (item) =>
                    `${(
                      item.completionRate *
                      100
                    ).toFixed(0)}%`,
              },

              {
                key: "rating",
                label: "Đánh giá",
                render:
                  (item) =>
                    item.averagePostTripRating.toFixed(
                      2,
                    ),
              },
            ]}
          />
        )}

        {tab === "tags" && (
          <AdminTable
            rows={tags}
            columns={[
              {
                key: "title",
                label: "Tag & Tip",
                render:
                  (tag) => (
                    <div>
                      <Link
                        href={`/admin/tags/${tag.id}`}
                        className="font-medium hover:underline"
                      >
                        {
                          tag.title
                        }
                      </Link>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {
                          tag.category ||
                          "Chưa phân loại"
                        }
                      </p>
                    </div>
                  ),
              },

              {
                key: "owner",
                label: "Người tạo",
                render:
                  (tag) => (
                    <Link
                      href={`/admin/users/${tag.owner.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {
                        tag
                          .owner
                          .name
                      }
                    </Link>
                  ),
              },

              {
                key: "citeTrustScore",
                label: "Cite Trust",
                render:
                  (tag) => (
                    <ScoreBadge
                      score={
                        tag.citeTrustScore
                      }
                    />
                  ),
              },

              {
                key: "citations",
                label: "Trích dẫn",
                render:
                  (tag) =>
                    tag._count
                      .citations,
              },

              {
                key: "itinerary",
                label: "Lịch trình",
                render:
                  (tag) =>
                    tag._count
                      .itineraryItems,
              },

              {
                key: "createdAt",
                label: "Ngày tạo",
                render:
                  (tag) =>
                    tag.createdAt.toLocaleDateString(
                      "vi-VN",
                    ),
              },
            ]}
          />
        )}

        <div className="rounded-2xl border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="text-primary mt-0.5 size-5" />

            <div>
              <p className="text-sm font-medium">
                Hệ thống uy tín TripBase
              </p>

              <p className="text-muted-foreground mt-1 text-xs leading-5">
                Creator và Trip sử dụng CopyPlan Score; Tag & Tip sử dụng Cite Trust Score. Điểm được tính từ hoạt động thực tế của hệ thống, không phải điểm do Admin nhập thủ công.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminSectionPage>
  );
}