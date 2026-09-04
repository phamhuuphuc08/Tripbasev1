# Kiến trúc & Cấu trúc thư mục

Trạng thái hiện tại: **scaffold** — cấu trúc, data model và tooling đã sẵn
sàng; UI/logic từng module (mục 4 trong `PRODUCT_SPEC.md`) sẽ được lấp dần
vào các thư mục dưới đây.

## Stack

Theo gợi ý ở `PRODUCT_SPEC.md` mục 15:

| Layer | Lựa chọn |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui |
| Backend | Next.js Server Actions/Route Handlers (không tách service riêng ở giai đoạn này) |
| DB | PostgreSQL qua Prisma ORM 7 (driver adapter `@prisma/adapter-pg`, không dùng Rust engine) |
| Validation | Zod |

Auth, map provider, realtime, file storage chưa được chọn/cài — xem
`src/server/auth/README.md` và mục 15 của spec khi cần quyết định.

## Cấu trúc thư mục

```
src/
  app/                    # Routes (Next.js App Router)
    (app)/                # Khu vực đã đăng nhập: trips, explore, saved, creators
    api/                  # Route handlers thuần (webhook, integration)
    layout.tsx, page.tsx  # Root layout + landing page
  components/
    ui/                   # Primitives do shadcn/ui sinh ra
    shared/                # Component dùng chung nhiều feature
  features/               # 1 thư mục / 1 module trong mục 4 của spec
    trip/ itinerary/ map/ budget/ booking/ checklist/
    share/ copy-plan/ reputation/ marketplace/ tag-tip/ travel-memory/
  server/                 # Code chỉ chạy server-side
    db/                   # Prisma client singleton
    repositories/         # Data access, 1 file / aggregate
    services/             # Business logic (CopyPlan Score, dedup, ...)
    auth/                 # Session/auth helpers (chưa wire)
  lib/                    # Helper dùng chung (cn(), v.v.)
  hooks/                  # React hooks dùng chung
  types/                  # Type dùng chung nhiều feature
  config/                 # env.ts (validate biến môi trường bằng Zod), constants
prisma/
  schema.prisma           # Data model — xem mục 12 của spec
prisma.config.ts          # Kết nối DB cho Prisma CLI (migrate/studio)
docs/
  PRODUCT_SPEC.md         # Spec sản phẩm gốc
  ARCHITECTURE.md         # File này
```

## Nguyên tắc

- **Feature-based, không layer-based ở tầng UI**: mỗi module trong mục 4 của
  spec có một thư mục riêng dưới `src/features/`, chứa cả component lẫn
  logic phía client của module đó. Route trong `src/app/` chỉ gọi vào
  `src/features/*`, giữ file route mỏng.
- **`server/` là biên giới duy nhất chạm DB**: `src/features/*` gọi
  `src/server/services/*`; services gọi `src/server/repositories/*`;
  repositories là nơi duy nhất import `src/server/db/client.ts`. Không import
  Prisma trực tiếp từ `features/` hay `app/`.
- **Reputation Engine chạy nền, không real-time** (mục 7–8, mục 15 của spec)
  — tránh gaming điểm số tức thời. Đặt job định kỳ trong
  `src/server/services/reputation.service.ts` khi implement.
- **Like/Bookmark tách khỏi điểm uy tín** (mục 3.2) — model `Interaction`
  trong Prisma schema có comment nhắc lại quy tắc này để không bị nhầm khi
  tính `CopyPlan Score`/`Cite Trust Score`.
