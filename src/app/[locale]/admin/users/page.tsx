import { Link } from "@/i18n/navigation";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { AdminTable } from "@/components/admin/admin-table";
import { requireAdmin } from "@/server/admin/admin-auth";
import { listAdminUsers } from "@/server/admin/user-admin.service";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await listAdminUsers();
  return <AdminSectionPage title="Người dùng" description="Tài khoản và hoạt động của thành viên."><AdminTable rows={users} columns={[
    { key: "name", label: "Tên", render: (user) => <Link className="font-medium hover:underline" href={`/admin/users/${user.id}`}>{user.name}</Link> },
    { key: "email", label: "Email" },
    { key: "trips", label: "Chuyến đi", render: (user) => user._count.trips },
    { key: "tags", label: "Địa điểm", render: (user) => user._count.locationTags },
    { key: "createdAt", label: "Ngày tạo", render: (user) => user.createdAt.toLocaleDateString("vi-VN") },
  ]} /></AdminSectionPage>;
}