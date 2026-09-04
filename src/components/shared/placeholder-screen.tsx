import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * Generic "not built yet" screen used by route stubs while their owning
 * feature module (`src/features/*`) is implemented. Swap out per-route once
 * the real screen lands — this only exists so the route tree below is
 * navigable and buildable today.
 */
export function PlaceholderScreen({
  icon: Icon,
  title,
  description,
  module,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  module: string;
}) {
  const t = useTranslations("common");

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-3 px-6 py-24 text-center">
      <span className="bg-accent text-accent-foreground flex size-12 items-center justify-center rounded-full">
        <Icon className="size-5" />
      </span>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      <p className="text-muted-foreground text-xs">
        {t("moduleLabel")}: <code>src/features/{module}</code>
      </p>
    </div>
  );
}
