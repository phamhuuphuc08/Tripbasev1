import { Save, Settings2, Shield, Tags, Plane } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminSectionPage } from "@/components/admin/admin-section-page";
import { updateAdminSettingsAction } from "@/features/admin/settings-actions";
import { requireAdmin } from "@/server/admin/admin-auth";
import { getAdminSettings } from "@/server/admin/settings.service";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getAdminSettings();

  return (
    <AdminSectionPage title="Cài đặt hệ thống" description="Quản lý các thiết lập vận hành chung của TripBase.">
      <form action={updateAdminSettingsAction} className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Settings2 className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Hệ thống</h2>
                <p className="text-muted-foreground text-sm">Các thiết lập chung của nền tảng.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Chế độ bảo trì</p>
                  <p className="text-muted-foreground mt-1 text-xs">Tạm ngưng hoạt động người dùng khi bảo trì.</p>
                </div>
                <input type="checkbox" name="maintenanceMode" defaultChecked={settings.maintenanceMode} className="size-4" />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Cho phép đăng ký</p>
                  <p className="text-muted-foreground mt-1 text-xs">Cho phép tạo tài khoản mới.</p>
                </div>
                <input type="checkbox" name="registrationEnabled" defaultChecked={settings.registrationEnabled} className="size-4" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Tags className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Tag & Tip</h2>
                <p className="text-muted-foreground text-sm">Thiết lập quản lý địa điểm cộng đồng.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Yêu cầu xét duyệt</p>
                  <p className="text-muted-foreground mt-1 text-xs">Tag mới cần Admin duyệt trước khi công khai.</p>
                </div>
                <input type="checkbox" name="tagApprovalRequired" defaultChecked={settings.tagApprovalRequired} className="size-4" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Số Tag tối đa/ngày</span>
                <input type="number" min="1" name="maxTagsPerDay" defaultValue={settings.maxTagsPerDay} className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Plane className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Trip</h2>
                <p className="text-muted-foreground text-sm">Quản lý giới hạn và khả năng công khai chuyến đi.</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="flex items-center justify-between gap-4 rounded-xl border p-4">
                <div>
                  <p className="text-sm font-medium">Cho phép Trip công khai</p>
                  <p className="text-muted-foreground mt-1 text-xs">Cho phép người dùng đưa Trip lên Explore.</p>
                </div>
                <input type="checkbox" name="publicTripsEnabled" defaultChecked={settings.publicTripsEnabled} className="size-4" />
              </label>

              <label className="block">
                <span className="text-sm font-medium">Số Trip tối đa/người dùng</span>
                <input type="number" min="1" name="maxTripsPerUser" defaultValue={settings.maxTripsPerUser} className="border-input bg-background mt-2 h-10 w-full rounded-md border px-3 text-sm" />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Shield className="size-5" />
              </span>
              <div>
                <h2 className="font-semibold">Bảo mật</h2>
                <p className="text-muted-foreground text-sm">Thông tin về cơ chế xác thực hiện tại.</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between rounded-xl border p-4"><span>Session TTL</span><strong>30 ngày</strong></div>
              <div className="flex justify-between rounded-xl border p-4"><span>Session Version</span><strong>Đang bật</strong></div>
              <div className="flex justify-between rounded-xl border p-4"><span>HttpOnly Cookie</span><strong>Đang bật</strong></div>
            </div>
          </section>
        </div>

        <div className="flex justify-end">
          <Button type="submit" className="gap-2">
            <Save className="size-4" />
            Lưu cài đặt
          </Button>
        </div>
      </form>
    </AdminSectionPage>
  );
}