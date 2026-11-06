import { Construction, Clock3 } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-lg rounded-3xl border bg-card p-8 text-center shadow-sm">
        <div className="bg-primary/10 text-primary mx-auto flex size-16 items-center justify-center rounded-2xl">
          <Construction className="size-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight">
          TripBase đang bảo trì
        </h1>

        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Hệ thống đang được bảo trì và nâng cấp. Vui lòng quay lại sau.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border bg-muted/40 p-3 text-sm">
          <Clock3 className="text-muted-foreground size-4" />
          <span>Chúng tôi sẽ sớm hoạt động trở lại.</span>
        </div>
      </div>
    </main>
  );
}