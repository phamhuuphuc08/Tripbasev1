import {
  AlertTriangle,
  ArrowLeft,
  Copy,
  ExternalLink,
  MapPinned,
  Route,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminCreatorReputation } from "@/server/admin/reputation-admin.service";

function scoreStyle(score: number) {
  if (score >= 70) {
    return "bg-green-500/10 text-green-700";
  }

  if (score >= 40) {
    return "bg-yellow-500/10 text-yellow-700";
  }

  return "bg-red-500/10 text-red-700";
}

function scoreLabel(score: number) {
  if (score >= 70) {
    return "Tốt";
  }

  if (score >= 40) {
    return "Trung bình";
  }

  if (score >= 20) {
    return "Cần kiểm tra";
  }

  return "Cảnh báo cao";
}

export default async function AdminCreatorReputationDetailPage({
  params,
}: {
  params: Promise<{
    userId: string;
  }>;
}) {
  await requireAdmin();

  const {
    userId,
  } = await params;

  const reputation =
    await getAdminCreatorReputation(
      userId,
    );

  if (!reputation) {
    notFound();
  }

  const {
    user,
    plans,
  } = reputation;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/reputation?tab=creators"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Quay lại Uy tín
          </Link>

          <h1 className="mt-3 text-2xl font-semibold">
            Chi tiết uy tín nhà sáng tạo
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Theo dõi CopyPlan Score và hoạt động của nhà sáng tạo.
          </p>
        </div>

        <Link
          href={`/admin/users/${user.id}`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Xem tài khoản
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  CopyPlan Score
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {reputation.copyplanScore.toFixed(
                    2,
                  )}
                </p>

                <Badge
                  className={`mt-3 ${scoreStyle(
                    reputation.copyplanScore,
                  )}`}
                >
                  {scoreLabel(
                    reputation.copyplanScore,
                  )}
                </Badge>
              </div>

              <ShieldCheck className="text-primary size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Kế hoạch
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {reputation.totalPlans}
                </p>
              </div>

              <Route className="text-primary size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Lượt sao chép
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {reputation.totalCopies}
                </p>
              </div>

              <Copy className="text-primary size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Cập nhật điểm
                </p>

                <p className="mt-2 text-sm font-semibold">
                  {reputation.lastUpdated.toLocaleString(
                    "vi-VN",
                  )}
                </p>
              </div>

              <MapPinned className="text-primary size-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {reputation.copyplanScore < 40 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-medium">
                Nhà sáng tạo cần được kiểm tra
              </p>

              <p className="text-muted-foreground mt-1 text-sm leading-6">
                CopyPlan Score hiện thấp hơn 40. Admin nên kiểm tra chất lượng Trip, số lượt Copy hợp lệ, tỷ lệ hoàn thành và các hoạt động liên quan trước khi đưa ra quyết định.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            Thông tin nhà sáng tạo
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">
              Họ tên
            </p>

            <p className="mt-1 font-medium">
              {user.name}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Email
            </p>

            <p className="mt-1 font-medium">
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              User ID
            </p>

            <p className="mt-1 break-all font-mono text-xs">
              {user.id}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Ngày tham gia
            </p>

            <p className="mt-1 font-medium">
              {user.createdAt.toLocaleString(
                "vi-VN",
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Trip gần đây
          </CardTitle>
        </CardHeader>

        <CardContent>
          {plans.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nhà sáng tạo này chưa có dữ liệu Reputation cho Trip.
            </p>
          ) : (
            <div className="space-y-3">
              {plans.map(
                (item) => (
                  <div
                    key={item.planId}
                    className="flex flex-col justify-between gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/trips/${item.plan.id}`}
                        className="font-medium hover:underline"
                      >
                        {item.plan.name}
                      </Link>

                      <p className="text-muted-foreground mt-1 text-xs">
                        {item.plan.destination ||
                          "Chưa có điểm đến"}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {item.plan.status}
                        </Badge>

                        <Badge variant="outline">
                          {item.plan.visibility}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:text-right">
                      <div>
                        <p className="text-muted-foreground text-xs">
                          CopyPlan
                        </p>

                        <p className="font-semibold">
                          {item.copyplanScore.toFixed(
                            2,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-xs">
                          Copy hợp lệ
                        </p>

                        <p className="font-semibold">
                          {item.eligibleCopyCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-xs">
                          Giữ lại
                        </p>

                        <p className="font-semibold">
                          {(
                            item.averageRetentionRate *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground text-xs">
                          Hoàn thành
                        </p>

                        <p className="font-semibold">
                          {(
                            item.completionRate *
                            100
                          ).toFixed(0)}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}