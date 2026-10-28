import { Link } from "@/i18n/navigation";

export function AdminPagination({ page, totalPages, href }: { page: number; totalPages: number; href: (page: number) => string }) {
  return (
    <nav className="flex items-center justify-between py-3 text-sm" aria-label="Phân trang">
      <span className="text-muted-foreground">Trang {page} / {Math.max(1, totalPages)}</span>
      <div className="flex gap-2">
        {page > 1 && <Link className="rounded border px-3 py-1.5 hover:bg-muted" href={href(page - 1)}>Trước</Link>}
        {page < totalPages && <Link className="rounded border px-3 py-1.5 hover:bg-muted" href={href(page + 1)}>Tiếp</Link>}
      </div>
    </nav>
  );
}