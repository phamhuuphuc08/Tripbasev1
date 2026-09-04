# Auth

Cross-cutting module, not one of the 12 product modules in
`docs/PRODUCT_SPEC.md` mục 4 — foundational infra several of them depend on
(Share & Permission, CopyPlan, gating a public plan's detail view behind
login).

Credentials-only (email + password) session auth for this stage: a signed
JWT in an httpOnly cookie (`src/server/auth/session.ts`), no OAuth provider
wired up yet — see `src/server/auth/README.md` and
docs/PRODUCT_SPEC.md mục 15 for the suggested providers to evaluate before
this grows further.

- `actions.ts` — Server Actions (`loginAction`, `registerAction`,
  `logoutAction`) backing `login-form.tsx` / `register-form.tsx`.
- Business logic lives in `src/server/services/auth.service.ts`, not here.

**MVP priority:** implicit P0 — Trip Marketplace/CopyPlan (mục 5) requires a
logged-in user before either makes sense.
