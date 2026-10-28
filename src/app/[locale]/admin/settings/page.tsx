import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { requireAdmin } from "@/server/admin/admin-auth";

export default async function AdminSettingsPage() {
  await requireAdmin();
  return <AdminSectionPage title="Cài đặt" description="Cấu hình quyền truy cập khu vực quản trị.">
    <div className="max-w-2xl border-y py-5"><h2 className="font-medium">Danh sách quản trị viên</h2><p className="mt-2 text-sm text-muted-foreground">Quyền quản trị được cấp qua biến môi trường ADMIN_EMAILS (danh sách email, phân tách bằng dấu phẩy). Thay đổi cấu hình ở môi trường triển khai để cập nhật quyền.</p></div>
  </AdminSectionPage>;
}