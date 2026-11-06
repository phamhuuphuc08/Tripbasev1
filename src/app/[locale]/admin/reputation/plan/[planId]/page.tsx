import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Route,
  ShieldCheck,
  Star,
  TrendingDown,
  Users,
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
import { getAdminPlanReputation } from "@/server/admin/reputation-admin.service";

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

export default async function AdminPlanReputationDetailPage({
  params,
}: {
  params: Promise<{
    planId: string;
  }>;
}) {
  await requireAdmin();

  const {
    planId,
  } = await params;

  const reputation =
    await getAdminPlanReputation(
      planId,
    );

  if (!reputation) {
    notFound();
  }

  const {
    plan,
  } = reputation;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/reputation?tab=plans"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Quay lại Uy tín
          </Link>

          <h1 className="mt-3 text-2xl font-semibold">
            Chi tiết uy tín Trip
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Phân tích CopyPlan Score và chất lượng hoạt động của Trip.
          </p>
        </div>

        <Link
          href={`/admin/trips/${plan.id}`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Xem quản lý Trip
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
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
                  Copy hợp lệ
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {reputation.eligibleCopyCount}
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
                  Tỷ lệ giữ lại
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {(
                    reputation.averageRetentionRate *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>

              <Users className="text-primary size-6" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Tỷ lệ hoàn thành
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {(
                    reputation.completionRate *
                    100
                  ).toFixed(0)}
                  %
                </p>
              </div>

              <CheckCircle2 className="text-primary size-6" />
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
                Trip cần được kiểm tra
              </p>

              <p className="text-muted-foreground mt-1 text-sm leading-6">
                CopyPlan Score của Trip này thấp hơn 40. Admin nên kiểm tra số lượt Copy hợp lệ, tỷ lệ giữ lại, tỷ lệ hoàn thành và đánh giá sau chuyến đi trước khi đưa ra kết luận.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="size-5" />
            Thông tin Trip
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">
              Tên Trip
            </p>

            <p className="mt-1 font-medium">
              {plan.name}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Điểm đến
            </p>

            <p className="mt-1 font-medium">
              {plan.destination ||
                "Chưa có điểm đến"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Trạng thái
            </p>

            <div className="mt-1">
              <Badge variant="outline">
                {plan.status}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Quyền xem
            </p>

            <div className="mt-1">
              <Badge variant="outline">
                {plan.visibility}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Ngày tạo
            </p>

            <p className="mt-1 font-medium">
              {plan.createdAt.toLocaleString(
                "vi-VN",
              )}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Plan ID
            </p>

            <p className="mt-1 break-all font-mono text-xs">
              {plan.id}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Thành phần tính uy tín
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Adjusted Copy Volume
              </p>

              <Copy className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {reputation.adjustedCopyVolume.toFixed(
                2,
              )}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Retention Rate
              </p>

              <Users className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {(
                reputation.averageRetentionRate *
                100
              ).toFixed(1)}
              %
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Completion Rate
              </p>

              <CheckCircle2 className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {(
                reputation.completionRate *
                100
              ).toFixed(1)}
              %
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Đánh giá sau Trip
              </p>

              <Star className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {reputation.averagePostTripRating.toFixed(
                2,
              )}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Diversity Bonus
              </p>

              <MapPin className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {reputation.diversityBonus.toFixed(
                2,
              )}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-xs">
                Decay
              </p>

              <TrendingDown className="text-muted-foreground size-4" />
            </div>

            <p className="mt-2 text-xl font-semibold">
              {reputation.decay.toFixed(
                2,
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Thời gian cập nhật
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">
              Copy gần nhất
            </p>

            <p className="mt-1 font-medium">
              {reputation.lastCopyAt
                ? reputation.lastCopyAt.toLocaleString(
                    "vi-VN",
                  )
                : "Chưa có"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Cập nhật điểm gần nhất
            </p>

            <p className="mt-1 font-medium">
              {reputation.lastUpdated.toLocaleString(
                "vi-VN",
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Chủ sở hữu Trip
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Link
            href={`/admin/reputation/creator/${plan.owner.id}`}
            className="font-medium hover:underline"
          >
            {plan.owner.name}
          </Link>

          <p className="text-muted-foreground mt-1 text-sm">
            {plan.owner.email}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/admin/reputation/creator/${plan.owner.id}`}
              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Xem uy tín Creator
            </Link>

            <Link
              href={`/admin/users/${plan.owner.id}`}
              className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              Xem tài khoản
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}