import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { requireAdmin } from "@/server/admin/admin-auth";
import { prisma } from "@/server/db/client";

function scoreStyle(score: number) {
  if (score >= 70) {
    return "bg-green-500/10 text-green-700";
  }

  if (score >= 40) {
    return "bg-yellow-500/10 text-yellow-700";
  }

  return "bg-red-500/10 text-red-700";
}

export default async function AdminTagReputationDetailPage({
  params,
}: {
  params: Promise<{
    tagId: string;
  }>;
}) {
  await requireAdmin();

  const {
    tagId,
  } = await params;

  const tag =
    await prisma.locationTag.findUnique({
      where: {
        id: tagId,
      },

      select: {
        id: true,
        title: true,
        category: true,
        content: true,
        approvalStatus: true,
        citeTrustScore: true,
        possibleDuplicateOfId: true,
        createdAt: true,
 

        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        _count: {
          select: {
            citations: true,
            itineraryItems: true,
          },
        },
      },
    });

  if (!tag) {
    notFound();
  }

  const level =
    tag.citeTrustScore < 20
      ? "Cảnh báo cao"
      : tag.citeTrustScore < 40
        ? "Cần kiểm tra"
        : tag.citeTrustScore < 70
          ? "Trung bình"
          : "Tốt";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/reputation?tab=tags"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Quay lại Uy tín
          </Link>

          <h1 className="mt-3 text-2xl font-semibold">
            Chi tiết uy tín Tag & Tip
          </h1>

          <p className="text-muted-foreground mt-1 text-sm">
            Phân tích Cite Trust Score và mức độ sử dụng của Tag.
          </p>
        </div>

        <Link
          href={`/admin/tags/${tag.id}`}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Xem trang quản lý Tag
          <ExternalLink className="size-4" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">
              Cite Trust Score
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tag.citeTrustScore.toFixed(
                2,
              )}
            </p>

            <Badge
              className={`mt-3 ${scoreStyle(
                tag.citeTrustScore,
              )}`}
            >
              {level}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">
              Trích dẫn
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tag._count.citations}
            </p>

            <p className="text-muted-foreground mt-2 text-xs">
              Số lần Tag được Cite trong hệ thống.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-sm">
              Lịch trình sử dụng
            </p>

            <p className="mt-2 text-3xl font-bold">
              {tag._count.itineraryItems}
            </p>

            <p className="text-muted-foreground mt-2 text-xs">
              Số itinerary item đang sử dụng Tag này.
            </p>
          </CardContent>
        </Card>
      </div>

      {tag.citeTrustScore < 40 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-5">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-amber-600" />

            <div>
              <p className="font-medium">
                Tag cần được kiểm tra
              </p>

              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Tag này có Cite Trust Score thấp hơn 40. Admin nên kiểm tra chất lượng nội dung, nguồn trích dẫn, khả năng trùng lặp và lịch sử sử dụng trước khi đưa ra quyết định.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="size-5" />
            Thông tin Tag
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">
              Tên
            </p>

            <p className="mt-1 font-medium">
              {tag.title}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Danh mục
            </p>

            <p className="mt-1 font-medium">
              {tag.category ||
                "Chưa phân loại"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Trạng thái duyệt
            </p>

            <p className="mt-1 font-medium">
              {tag.approvalStatus}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Tag trùng
            </p>

            <p className="mt-1 font-medium">
              {tag.possibleDuplicateOfId
                ? "Có khả năng trùng"
                : "Không phát hiện"}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground text-xs">
              Ngày tạo
            </p>

            <p className="mt-1 font-medium">
              {tag.createdAt.toLocaleString(
                "vi-VN",
              )}
            </p>
          </div>


          {tag.content && (
            <div className="sm:col-span-2">
              <p className="text-muted-foreground text-xs">
                Nội dung
              </p>

              <p className="mt-1 text-sm leading-6">
                {tag.content}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Người tạo
          </CardTitle>
        </CardHeader>

        <CardContent>
          <Link
            href={`/admin/users/${tag.owner.id}`}
            className="font-medium hover:underline"
          >
            {tag.owner.name}
          </Link>

          <p className="text-muted-foreground mt-1 text-sm">
            {tag.owner.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}