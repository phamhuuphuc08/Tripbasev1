# API Route Handlers

Next.js Route Handlers (`route.ts`) live here when a client needs a plain
HTTP endpoint (webhooks, file upload callbacks, external integrations).

Prefer Server Actions inside `src/features/*` for normal form/mutation flows;
reach for a route handler only when the caller isn't a React Server
Component (e.g. a webhook from a booking provider, or the Scoring Job
worker described in docs/PRODUCT_SPEC.md mục 15).
