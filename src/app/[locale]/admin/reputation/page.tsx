import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminReputation } from "@/server/admin/reputation-admin.service";

export default async function AdminReputationPage() {
  await requireAdmin();
  const { creators } = await listAdminReputation();
  const rows = creators.map((creator) => ({ ...creator, id: creator.userId }));
  return <AdminSectionPage title="Uy tín nhà sáng tạo" description="Điểm CopyPlan và hoạt động của nhà sáng tạo."><AdminTable rows={rows} columns={[
    { key: "user", label: "Nhà sáng tạo", render: (creator) => creator.user.name },
    { key: "copyplanScore", label: "Điểm", render: (creator) => creator.copyplanScore.toFixed(2) },
    { key: "totalPlans", label: "Kế hoạch" },
    { key: "totalCopies", label: "Lượt sao chép" },
    { key: "lastUpdated", label: "Cập nhật", render: (creator) => creator.lastUpdated.toLocaleDateString("vi-VN") },
  ]} /></AdminSectionPage>;
}