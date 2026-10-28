import { Menu } from "lucide-react";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export function AdminMobileNav() {
  return (
    <details className="border-b px-4 py-2 lg:hidden">
      <summary className="flex h-8 cursor-pointer list-none items-center gap-2 text-sm font-medium"><Menu className="size-4" /> Menu quản trị</summary>
      <div className="pt-2"><AdminSidebar /></div>
    </details>
  );
}