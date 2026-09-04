# Kiến trúc & Cấu trúc thư mục

Trạng thái hiện tại: **scaffold** — cấu trúc, data model và tooling đã sẵn
sàng; UI/logic từng module (mục 4 trong `PRODUCT_SPEC.md`) sẽ được lấp dần
vào các thư mục dưới đây.

## Stack

Theo gợi ý ở `PRODUCT_SPEC.md` mục 15:

| Layer      | Lựa chọn                                                                                  |
| ---------- | ----------------------------------------------------------------------------------------- |
| Framework  | Next.js (App Router) + TypeScript                                                         |
| UI         | Tailwind CSS v4 + shadcn/ui (Base UI), `next-themes` (dark mode)                          |
| i18n       | `next-intl` — vi (mặc định, không prefix) / en (`/en`)                                    |
| Backend    | Next.js Server Actions/Route Handlers (không tách service riêng ở giai đoạn này)          |
| DB         | PostgreSQL qua Prisma ORM 7 (driver adapter `@prisma/adapter-pg`, không dùng Rust engine) |
| Validation | Zod                                                                                       |

Auth hiện là bản tối giản tự viết (JWT trong cookie httpOnly, credentials
email+password — xem `src/server/auth/session.ts`), **chưa phải** provider
thật (Clerk/Supabase/Auth.js — mục 15); map provider, realtime, file storage
vẫn chưa chọn/cài — xem `src/server/auth/README.md` khi cần quyết định
thêm.

## Cấu trúc thư mục

```
src/
  app/
    [locale]/             # MỌI route thật nằm dưới đây (vi hoặc en)
      (app)/              # trips, explore, saved, creators
      (auth)/             # login, register
      layout.tsx          # Root layout thật (<html>/<body>) — NextIntlClientProvider,
                           # ThemeProvider, SiteHeader
      page.tsx            # Home: search điểm đến + plan public khớp nhất
    api/                  # Route handlers thuần (webhook, integration) — không localize
    globals.css
  i18n/
    routing.ts            # locales, defaultLocale, localePrefix
    navigation.ts         # Link/redirect/usePathname/useRouter locale-aware
    request.ts            # load messages/<locale>.json cho next-intl
  proxy.ts                # Next.js 16 "proxy" (middleware cũ) — next-intl locale routing
  components/
    ui/                   # Primitives do shadcn/ui sinh ra
    shared/                # Component dùng chung nhiều feature (SiteHeader, ThemeToggle,
                           # LanguageSwitcher, PlaceholderScreen)
  features/               # 1 thư mục / 1 module trong mục 4 của spec
    trip/ itinerary/ map/ budget/ booking/ checklist/
    share/ copy-plan/ reputation/ marketplace/ tag-tip/ travel-memory/
    auth/                 # cross-cutting, không thuộc 12 module gốc
  server/                 # Code chỉ chạy server-side
    db/                   # Prisma client singleton
    repositories/         # Data access, 1 file / aggregate
    services/             # Business logic (CopyPlan Score, dedup, ...)
    auth/                 # Session/auth helpers (chưa wire provider thật)
  lib/                    # Helper dùng chung (cn(), v.v.)
  hooks/                  # React hooks dùng chung
  types/                  # Type dùng chung nhiều feature
  config/                 # env.ts (validate biến môi trường bằng Zod), constants
messages/
  vi.json, en.json        # Bản dịch — namespace theo tên trang/component
prisma/
  schema.prisma           # Data model — xem mục 12 của spec
prisma.config.ts          # Kết nối DB cho Prisma CLI (migrate/studio)
global.d.ts               # Typed messages cho next-intl (dựa theo messages/vi.json)
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
- **Mọi text hiển thị cho user phải qua `next-intl`** (`useTranslations`/
  `getTranslations`, key trong `messages/vi.json` + `messages/en.json`),
  không hard-code chuỗi tiếng Việt/Anh trong component — kể cả message lỗi
  từ Server Action (xem `src/features/auth/actions.ts`: service ném ra một
  **mã lỗi**, action mới dịch mã đó sang locale hiện tại qua `getLocale()`).
  Link nội bộ dùng `Link`/`redirect`/`usePathname`/`useRouter` từ
  `@/i18n/navigation`, không dùng thẳng `next/link`/`next/navigation`, để
  giữ đúng locale khi điều hướng.
