<<<<<<< HEAD
# TripBase

Web app lập kế hoạch du lịch tự túc cho người Việt — itinerary builder, bản
đồ, budget, checklist, cộng tác nhóm, và **CopyPlan** (nhân bản/fork lịch
trình kiểu copy-trade) với hệ thống điểm uy tín CopyPlan Score / Cite Trust
Score.

> Bản đầy đủ của định vị sản phẩm, data model, cơ chế tính điểm và roadmap:
> xem [`docs/PRODUCT_SPEC.md`](docs/PRODUCT_SPEC.md). Tổng quan kiến trúc
> code: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Tiến độ từng module
> (đã làm/chưa làm): [`docs/spec-dev-plan.md`](docs/spec-dev-plan.md).

Giai đoạn hiện tại **không dùng AI** — toàn bộ tính năng là thao tác thủ
công/rule-based.

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS v4 + shadcn/ui · dark mode
(`next-themes`) · song ngữ vi/en (`next-intl`) · PostgreSQL qua Prisma
ORM 7 · Zod.

## Bắt đầu

```bash
npm install
cp .env.example .env   # điền DATABASE_URL thật
npm run db:generate    # sinh Prisma Client
npm run db:migrate     # tạo schema trong DB (cần Postgres đang chạy)
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000).

### Chạy bằng Docker (app + Postgres, tự migrate)

```bash
npm run docker:up      # = docker compose up --build
# nếu cổng 3000 trên máy đang bận:
WEB_PORT=3001 docker compose up --build
```

Container `web` tự chạy `prisma migrate deploy` trước khi start — không cần
thao tác tay nào khác để có localhost test được.

## Scripts

| Script                            | Chức năng                                    |
| --------------------------------- | -------------------------------------------- |
| `npm run dev`                     | Chạy dev server                              |
| `npm run build` / `npm start`     | Build & chạy production                      |
| `npm run lint`                    | ESLint                                       |
| `npm run typecheck`               | `tsc --noEmit`                               |
| `npm run format` / `format:check` | Prettier                                     |
| `npm run db:generate`             | Sinh Prisma Client từ `prisma/schema.prisma` |
| `npm run db:migrate`              | Chạy migration (dev)                         |
| `npm run db:studio`               | Mở Prisma Studio                             |

## Cấu trúc thư mục

Xem chi tiết ở [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Tóm tắt:

- `src/app/` — routes (Next.js App Router)
- `src/features/*` — một thư mục cho mỗi module sản phẩm (trip, itinerary,
  map, budget, copy-plan, reputation, marketplace, ...), mỗi thư mục có
  README riêng mô tả trách nhiệm + entity liên quan
- `src/server/` — db client, repositories, services (business logic), auth
- `src/components/`, `src/lib/`, `src/hooks/`, `src/types/`, `src/config/`
- `prisma/schema.prisma` — data model đầy đủ theo mục 12 của spec

Đây là bản scaffold: cấu trúc, data model, và tooling đã sẵn sàng; logic/UI
từng module sẽ được lấp dần.
=======
# Tripbasev1
>>>>>>> backupv1/main
