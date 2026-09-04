# Services

Business logic per feature module, called from Server Actions / route
handlers in `src/features/*`. Key ones to expect as the product is built out
(see docs/PRODUCT_SPEC.md):

- `trip.service.ts` — create/update trip, visibility & status transitions.
- `copy-plan.service.ts` — fork a plan, record `PlanCopy`, compute Retention Rate.
- `reputation.service.ts` — CopyPlan Score / Cite Trust Score (mục 7–8),
  run as a periodic scoring job rather than on every request.
- `tag-dedup.service.ts` — rule-based fuzzy match for LocationTag/Tip (mục 8.1).
