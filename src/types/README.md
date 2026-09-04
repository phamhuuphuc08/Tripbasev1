# Shared Types

Cross-cutting TypeScript types that don't belong to a single feature module
(e.g. API response envelopes, shared enums mirrored from `prisma/schema.prisma`).
Feature-specific types should live next to their feature in `src/features/*`
instead of here.
