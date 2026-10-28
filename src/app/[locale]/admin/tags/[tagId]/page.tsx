import { notFound } from "next/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminTag } from "@/server/admin/tag-admin.service";

export default async function AdminTagDetailPage({ params }: { params: Promise<{ tagId: string }> }) {
  await requireAdmin();
  const { tagId } = await params;
  const tag = await getAdminTag(tagId);
  if (!tag) notFound();
  return <AdminSectionPage title={tag.title} description={`${tag.category ?? "Chưa phân loại"} · ${tag.owner.name}`}>
    <dl className="grid gap-x-8 gap-y-4 border-y py-5 sm:grid-cols-2"><div><dt className="text-sm text-muted-foreground">ID</dt><dd className="mt-1 break-all">{tag.id}</dd></div><div><dt className="text-sm text-muted-foreground">Độ tin cậy</dt><dd className="mt-1">{tag.citeTrustScore}</dd></div><div><dt className="text-sm text-muted-foreground">Giờ mở cửa</dt><dd className="mt-1">{tag.openingHours ?? "—"}</dd></div><div><dt className="text-sm text-muted-foreground">Tọa độ</dt><dd className="mt-1">{tag.latitude ?? "—"}, {tag.longitude ?? "—"}</dd></div><div><dt className="text-sm text-muted-foreground">Trích dẫn / lịch trình</dt><dd className="mt-1">{tag._count.citations} / {tag._count.itineraryItems}</dd></div><div><dt className="text-sm text-muted-foreground">Nội dung</dt><dd className="mt-1">{tag.content ?? "—"}</dd></div></dl>
  </AdminSectionPage>;
}