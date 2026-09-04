# Server Layer

Server-only code, never imported from client components.

- `db/` — Prisma client singleton (`client.ts`) and seed scripts.
- `repositories/` — data-access functions, one file per Prisma model group
  (e.g. `trip.repository.ts`). No business rules here, just queries.
- `services/` — business logic per feature module (e.g. `reputation.service.ts`
  implementing the CopyPlan Score / Cite Trust Score formulas in
  docs/PRODUCT_SPEC.md mục 7–8). Services call repositories, not the other
  way around.
- `auth/` — session/auth helpers (see docs/PRODUCT_SPEC.md mục 15 for the
  suggested provider).

`src/features/*` (UI + route-facing logic) calls into `src/server/services/*`;
it should not import `db/client` or `repositories/*` directly.
