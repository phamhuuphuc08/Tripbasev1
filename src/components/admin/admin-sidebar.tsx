"use client";

import {
  FileWarning,
  LayoutDashboard,
  MapPin,
  Plane,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { Link } from "@/i18n/navigation";

const managementItems = [
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/trips", label: "Chuyến đi", icon: Plane },
  { href: "/admin/tags", label: "Tag & Tip", icon: MapPin },
];

const moderationItems = [
  { href: "/admin/reports", label: "Báo cáo", icon: FileWarning },
  { href: "/admin/reputation", label: "Uy tín", icon: ShieldCheck },
];

const systemItems = [
  { href: "/admin/audit-logs", label: "Nhật ký", icon: ScrollText },
  { href: "/admin/settings", label: "Cài đặt", icon: Settings },
];

function SidebarItem({
  href,
  label,
  icon: Icon,
  badge,
}: {
  href: string;
  label: string;
  icon: typeof Users;
  badge?: number;
}) {
  const pathname = usePathname();
  const localePath = pathname.replace(/^\/(vi|en)(?=\/|$)/, "") || "/";
  const active = href === "/admin" ? localePath === "/admin" : localePath.startsWith(href);

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-lg transition ${
          active
            ? "bg-primary-foreground/15"
            : "bg-muted group-hover:bg-background"
        }`}
      >
        <Icon className="size-4" />
      </span>

      <span className="flex-1">{label}</span>

      {typeof badge === "number" && badge > 0 && (
        <span
          className={`flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-destructive/10 text-destructive"
          }`}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function SidebarSection({
  title,
  items,
}: {
  title: string;
  items: {
    href: string;
    label: string;
    icon: typeof Users;
    badge?: number;
  }[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
        {title}
      </p>

      {items.map((item) => (
        <SidebarItem key={item.href} {...item} />
      ))}
    </div>
  );
}

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-background/95 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-4">
        <Link href="/admin" className="flex items-center gap-3 rounded-xl px-2 py-1.5">
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <ShieldCheck className="size-5" />
          </span>

          <div className="leading-tight">
            <p className="font-bold">TripBase</p>
            <p className="text-muted-foreground text-xs">Admin Console</p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
        <SidebarItem href="/admin" label="Tổng quan" icon={LayoutDashboard} />

        <SidebarSection title="Quản lý" items={managementItems} />
        <SidebarSection title="Kiểm duyệt" items={moderationItems} />
        <SidebarSection title="Hệ thống" items={systemItems} />
      </nav>

      <div className="border-t p-3">
        <Link
          href="/"
          className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition"
        >
          <span>←</span>
          <span>Quay lại TripBase</span>
        </Link>
      </div>
    </aside>
  );
}