# Auth

Session/auth helpers.

- `password.ts` — bcryptjs hash/verify.
- `session.ts` — JWT (via `jose`) in an httpOnly cookie: `createSession`,
  `destroySession`, `getSession`.

This is a minimal, self-written Credentials-only implementation (email +
password) for the current stage — **not** an OAuth provider. Before growing
this (Google/Facebook login, magic links, etc.), evaluate Auth.js/Clerk/
Supabase Auth per docs/PRODUCT_SPEC.md mục 15 rather than hand-rolling more
of it here. Business logic (register/login/logout) lives in
`src/server/services/auth.service.ts`; UI in `src/features/auth/`.
