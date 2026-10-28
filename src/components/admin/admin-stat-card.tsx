import type { LucideIcon } from "lucide-react";

export function AdminStatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold">
            {value}
          </p>
        </div>

        <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>
      </div>

      {description && (
        <p className="text-muted-foreground mt-3 text-xs">
          {description}
        </p>
      )}
    </div>
  );
}