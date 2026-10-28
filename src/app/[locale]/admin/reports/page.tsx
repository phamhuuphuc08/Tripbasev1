import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminReports } from "@/server/admin/report-admin.service";

export default async function AdminReportsPage() {
  await requireAdmin();
  const reports = await listAdminReports();
  const rows = reports.map((report) => ({ ...report, id: report.id, subject: report.locationTag?.title ?? report.place?.name ?? "Không rõ địa điểm" }));
  return <AdminSectionPage title="Tín hiệu cộng đồng" description="Các trích dẫn có phản hồi tiêu cực cần được xem xét."><AdminTable rows={rows} columns={[
    { key: "subject", label: "Địa điểm" },
    { key: "negativeSignalType", label: "Loại tín hiệu" },
    { key: "negativeSignalNote", label: "Ghi chú" },
    { key: "citerUser", label: "Người gửi", render: (report) => report.citerUser.name },
    { key: "negativeSignalAt", label: "Thời điểm", render: (report) => report.negativeSignalAt?.toLocaleDateString("vi-VN") ?? "—" },
  ]} /></AdminSectionPage>;
}