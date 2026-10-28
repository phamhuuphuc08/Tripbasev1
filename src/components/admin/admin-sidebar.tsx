"use client";

import {
  LayoutDashboard,
  Users,
  Plane,
  MapPin,
  FileWarning,
  ShieldCheck,
  ScrollText,
  Settings,
} from "lucide-react";

import { Link } from "@/i18n/navigation";

const menuItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Người dùng",
    icon: Users,
  },
  {
    href: "/admin/trips",
    label: "Chuyến đi",
    icon: Plane,
  },
  {
    href: "/admin/tags",
    label: "Tag & Tip",
    icon: MapPin,
  },
  {
    href: "/admin/reports",
    label: "Báo cáo",
    icon: FileWarning,
  },
  {
    href: "/admin/reputation",
    label: "Uy tín",
    icon: ShieldCheck,
  },
  {
    href: "/admin/audit-logs",
    label: "Nhật ký",
    icon: ScrollText,
  },
  {
    href: "/admin/settings",
    label: "Cài đặt",
    icon: Settings,
  },
];

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link
          href="/admin"
          className="text-lg font-bold"
        >
          TripBase Admin
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm"
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          ← Quay lại TripBase
        </Link>
      </div>
    </aside>
  );
}