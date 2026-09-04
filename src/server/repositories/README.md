# Repositories

One file per aggregate, e.g. `trip.repository.ts`, `plan-copy.repository.ts`,
`citation.repository.ts` — thin wrappers around `prisma` (see
`src/server/db/client.ts`). Keep these free of business rules so services
stay the single place scoring/permission logic lives.
