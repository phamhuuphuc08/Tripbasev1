/**
 * Generic "not built yet" screen used by route stubs while their owning
 * feature module (`src/features/*`) is implemented. Swap out per-route once
 * the real screen lands — this only exists so the route tree below is
 * navigable and buildable today.
 */
export function PlaceholderScreen({
  title,
  description,
  module,
}: {
  title: string;
  description: string;
  module: string;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-2 px-6 py-16">
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
      <p className="text-muted-foreground text-xs">
        Module: <code>src/features/{module}</code>
      </p>
    </div>
  );
}
