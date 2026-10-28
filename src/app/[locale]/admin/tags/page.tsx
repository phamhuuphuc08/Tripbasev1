import {
  Check,
  Clock,
  X,
} from "lucide-react";

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

export default async function AdminTagsPage() {
  await requireAdmin();

  const tags =
    await listAdminTags();

  const pendingCount =
    tags.filter(
      (tag) =>
        tag.approvalStatus ===
        "PENDING",
    ).length;

  return (
    <AdminSectionPage
      title="Địa điểm"
      description={`Địa điểm do cộng đồng đóng góp. Có ${pendingCount} địa điểm đang chờ xét duyệt.`}
    >
      <AdminTable
        rows={tags}
        columns={[
          {
            key: "title",
            label: "Tên địa điểm",
            render: (tag) => (
              <Link
                className="font-medium hover:underline"
                href={`/admin/tags/${tag.id}`}
              >
                {tag.title}
              </Link>
            ),
          },

          {
            key: "category",
            label: "Danh mục",
          },

          {
            key: "owner",
            label: "Người tạo",
            render: (tag) =>
              tag.owner.name,
          },

          {
            key: "approvalStatus",
            label: "Trạng thái",
            render: (tag) => {
              if (
                tag.approvalStatus ===
                "APPROVED"
              ) {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-300">
                    <Check className="size-3" />
                    Đã duyệt
                  </span>
                );
              }

              if (
                tag.approvalStatus ===
                "REJECTED"
              ) {
                return (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                    <X className="size-3" />
                    Từ chối
                  </span>
                );
              }

              return (
                <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
                  <Clock className="size-3" />
                  Chờ duyệt
                </span>
              );
            },
          },

          {
            key: "citeTrustScore",
            label: "Độ tin cậy",
          },

          {
            key: "createdAt",
            label: "Ngày tạo",
            render: (tag) =>
              tag.createdAt.toLocaleDateString(
                "vi-VN",
              ),
          },

          {
            key: "actions",
            label: "Thao tác",
            render: (tag) => {
              if (
                tag.approvalStatus !==
                "PENDING"
              ) {
                return (
                  <span className="text-muted-foreground text-xs">
                    Đã xử lý
                  </span>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <form
                    action={approveAdminTagAction.bind(
                      null,
                      tag.id,
                    )}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      className="gap-1.5"
                    >
                      <Check className="size-4" />
                      Duyệt
                    </Button>
                  </form>

                  <form
                    action={rejectAdminTagAction.bind(
                      null,
                      tag.id,
                    )}
                  >
                    <Button
                      type="submit"
                      size="sm"
                      variant="destructive"
                      className="gap-1.5"
                    >
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
    </AdminSectionPage>
  );
}