import { ShieldCheck } from "lucide-react";

export function AdminHeader({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div>
        <h1 className="font-semibold">
          Trang quản trị
        </h1>

        <p className="text-muted-foreground text-xs">
          Quản lý hệ thống TripBase
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
          <ShieldCheck className="size-4" />
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">
            {name}
          </p>

          <p className="text-muted-foreground text-xs">
            {email}
          </p>
        </div>
      </div>
    </header>
  );
}