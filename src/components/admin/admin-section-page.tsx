import type { ReactNode } from "react";

export function AdminSectionPage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <section className="space-y-5">
      <div><h1 className="text-2xl font-semibold">{title}</h1><p className="mt-1 text-sm text-muted-foreground">{description}</p></div>
      {children}
    </section>
  );
}