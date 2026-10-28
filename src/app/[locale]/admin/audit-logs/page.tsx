import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminAuditLogs } from "@/server/admin/audit-log.service";

export default async function AdminAuditLogsPage() {
  await requireAdmin();
  const logs = await listAdminAuditLogs();
  return <AdminSectionPage title="Nhật ký quản trị" description="Lịch sử thao tác của quản trị viên."><AdminTable rows={logs} columns={[
    { key: "createdAt", label: "Thời gian", render: (entry) => entry.createdAt.toLocaleString("vi-VN") },
    { key: "actor", label: "Người thực hiện" },
    { key: "action", label: "Thao tác" },
    { key: "target", label: "Đối tượng" },
  ]} emptyMessage="Chưa có dữ liệu nhật ký. Schema hiện tại chưa lưu audit log." /></AdminSectionPage>;
}