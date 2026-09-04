# TripBase — Dev Plan & Tiến độ

Tài liệu này là **log sống**: mỗi module có mã riêng, map tới thư mục code
cụ thể, và một checklist trạng thái. Cập nhật checklist + phần
[Changelog](#changelog) mỗi khi có thay đổi đáng kể — đây là nguồn sự thật
duy nhất về "cái gì đã làm, cái gì chưa", không suy luận lại từ git log.

Chú thích trạng thái: ⬜ Chưa bắt đầu · 🟨 Đang làm · ✅ Xong

Tham chiếu nội dung nghiệp vụ đầy đủ: [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md).
Tổng quan kiến trúc: [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Tổng quan tiến độ

| Mã  | Module                                                        | Ưu tiên | Data model | Service | UI  | Trạng thái |
| --- | ------------------------------------------------------------- | ------- | ---------- | ------- | --- | ---------- |
| M00 | [Infra/Scaffold](#m00--infrascaffold)                         | —       | ✅         | —       | —   | ✅         |
| M01 | [Trip Builder](#m01--trip-builder)                            | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M02 | [Itinerary / Smart Timeline](#m02--itinerary--smart-timeline) | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M03 | [Map Planner](#m03--map-planner)                              | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M04 | [Budget Board](#m04--budget-board)                            | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M05 | [Booking Vault](#m05--booking-vault)                          | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M06 | [Checklist](#m06--checklist)                                  | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M07 | [Share & Permission](#m07--share--permission)                 | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M08 | [CopyPlan Engine](#m08--copyplan-engine)                      | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M09 | [Reputation Engine](#m09--reputation-engine)                  | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M10 | [Plan Marketplace / Explore](#m10--plan-marketplace--explore) | P1      | ✅         | ⬜      | 🟨  | ⬜         |
| M11 | [Tag & Tip Library](#m11--tag--tip-library)                   | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M12 | [Travel Memory](#m12--travel-memory)                          | P2      | ⬜         | ⬜      | ⬜  | ⬜         |

"Data model ✅" nghĩa là entity đã có trong `prisma/schema.prisma` **và** đã
migrate vào DB thật — chưa có nghĩa là service/business rule đã implement.

---

## M00 — Infra/Scaffold

- **Code:** repo root, `src/app/`, `src/features/*/README.md`, `src/server/`, `prisma/`, `Dockerfile`, `docker-compose.yml`
- **Trạng thái:** ✅ Xong (2026-09-04)

Đã làm:

- [x] Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui
- [x] Cấu trúc `src/features/*` — 1 thư mục/module, mỗi thư mục có README
- [x] Phân lớp `src/server/{db,repositories,services,auth}`
- [x] `prisma/schema.prisma` — toàn bộ data model mục 12 của spec
- [x] Migration đầu tiên `prisma/migrations/20260904041205_init` — đã apply
      vào Postgres thật (18 bảng), không chỉ viết schema suông
- [x] Route placeholder `/trips`, `/trips/[tripId]`, `/explore`, `/saved`,
      `/creators/[creatorId]` — app build được
- [x] Tooling: ESLint + Prettier, `.editorconfig`, Zod env validation
- [x] Docker: `Dockerfile` + `docker-compose.yml` (Postgres + web), chạy
      `npm run docker:up` là có localhost để test — xem
      [Docker / Local Deploy](#docker--local-deploy)

Chưa làm:

- [ ] Auth thật (chưa chọn provider — xem `src/server/auth/README.md`)
- [ ] CI (lint/typecheck/build tự động trên PR)

---

## M01 — Trip Builder

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/trip/`, model `Trip`, `Traveler`
- **Trạng thái:** ⬜ Chưa bắt đầu

Đã làm: (chưa có)

Chưa làm:

- [ ] Form tạo trip (điểm đến, ngày, số người, ngân sách, style)
- [ ] Server action `createTrip` / `updateTrip` (`src/server/services/trip.service.ts`)
- [ ] Trip dashboard (danh sách trip của user) — thay `src/app/(app)/trips/page.tsx`
- [ ] Trạng thái plan: Ý tưởng / Đã lên lịch / Đã đi + badge "Verified by Author"
- [ ] Visibility: Riêng tư / Bạn bè-nhóm / Public

---

## M02 — Itinerary / Smart Timeline

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/itinerary/`, model `ItineraryItem`, `Place`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Kéo thả item theo ngày/giờ (không AI)
- [ ] Cảnh báo travel time/buffer, giờ mở cửa
- [ ] Gợi ý inline "Đã có tag này — dùng lại?" khi thêm địa điểm (nối với M11)

---

## M03 — Map Planner

- **Ưu tiên:** P0 · **Spec:** mục 4, 6a, 11
- **Code:** `src/features/map/`, model `Place`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Chọn provider bản đồ (Mapbox/Google Maps — mục 15) và cấu hình API key
- [ ] Hiển thị điểm theo ngày, gom theo khu vực
- [ ] Cảnh báo đi vòng (khoảng cách toạ độ, rule-based)
- [ ] Badge Cite Trust Score trên điểm (nối với M09)

---

## M04 — Budget Board

- **Ưu tiên:** P0 · **Spec:** mục 4, 5
- **Code:** `src/features/budget/`, model `Expense`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] CRUD chi phí theo hạng mục, đơn vị VND
- [ ] Chia tiền cơ bản giữa thành viên (`splitBetween`)
- [ ] Money View (mục 11)

---

## M05 — Booking Vault

- **Ưu tiên:** P1 · **Spec:** mục 4, 5
- **Code:** `src/features/booking/`, model `Booking`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Chọn file storage (S3-compatible — mục 15)
- [ ] Upload/forward email/PDF/screenshot
- [ ] Danh sách booking theo trip

---

## M06 — Checklist

- **Ưu tiên:** P0 · **Spec:** mục 4, 5
- **Code:** `src/features/checklist/`, model `ChecklistItem`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] CRUD checklist item, gán người phụ trách, due date
- [ ] Preset checklist theo loại chuyến đi (visa, SIM, bảo hiểm...)

---

## M07 — Share & Permission

- **Ưu tiên:** P0 · **Spec:** mục 3.3, 4, 5, 13
- **Code:** `src/features/share/`, model `Collaborator`, `ShareLink`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Invite đích danh (viewer/editor)
- [ ] View Link / Edit Link — tạo, revoke, tạo lại
- [ ] Expiry cho Edit Link (guardrail mục 13)
- [ ] Auth/permission check theo `visibility` + `Collaborator.role`

---

## M08 — CopyPlan Engine

- **Ưu tiên:** P0 · **Spec:** mục 3, 6b, 7, 13
- **Code:** `src/features/copy-plan/`, model `PlanCopy`, `Trip.forkedFromPlanId`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Fork 1-click (toàn bộ hoặc từng ngày)
- [ ] Tính Retention Rate khi copy xong
- [ ] Ghi nhận Completion Rate / Post-trip Rating sau khi copier đánh dấu "đã đi"
- [ ] Guardrail: chặn self-copy tính điểm, device fingerprint (mục 13)

---

## M09 — Reputation Engine

- **Ưu tiên:** P1 · **Spec:** mục 3, 7, 8, 13, 15
- **Code:** `src/features/reputation/`, model `CreatorReputation`, `Citation`, `PlanCopy`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Công thức CopyPlan Score (mục 7) — background job, không real-time
- [ ] Công thức Cite Trust Score (mục 8)
- [ ] Creator Reputation tổng hợp có trọng số theo plan mới nhất
- [ ] Scoring job scheduler (cron/queue — mục 15)
- [ ] Guardrail chống gian lận (mục 13): wash-trading cluster, self-cite

---

## M10 — Plan Marketplace / Explore

- **Ưu tiên:** P1 · **Spec:** mục 4, 5, 6b, 11
- **Code:** `src/features/marketplace/`, model `Interaction`, `Trip` (visibility/status)
- **Trạng thái:** ⬜ Chưa bắt đầu (route placeholder đã có)

Đã làm:

- [x] Route `/explore`, `/saved` placeholder (chưa có data thật)

Chưa làm:

- [ ] Feed plan public, filter theo điểm đến/ngân sách/CopyPlan Score/trạng thái
- [ ] Like / Bookmark (không tính điểm uy tín — mục 3.2)
- [ ] Saved Library thật (query theo `Interaction.type = BOOKMARK`)
- [ ] Rate-limit Like/Bookmark theo thiết bị/tài khoản (mục 13)

---

## M11 — Tag & Tip Library

- **Ưu tiên:** P1 · **Spec:** mục 4, 8.1
- **Code:** `src/features/tag-tip/`, model `LocationTag`
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Rule-based dedup: fuzzy string match (Levenshtein) + bán kính toạ độ + cùng danh mục
- [ ] Gợi ý "dùng lại tag này?" khi gõ
- [ ] `possible_duplicate_of` flag khi user vẫn tạo mới dù trùng
- [ ] Self-cite: cho dùng lại nhưng không cộng điểm cho chính chủ

---

## M12 — Travel Memory

- **Ưu tiên:** P2 · **Spec:** mục 4, 6a
- **Code:** `src/features/travel-memory/` — **chưa có model Prisma riêng**
- **Trạng thái:** ⬜ Chưa bắt đầu

Chưa làm:

- [ ] Quyết định data model (album/note/review — hiện spec chưa định nghĩa
      entity riêng, chỉ có `PlanCopy.postTripRating`)
- [ ] Album ảnh, note, tổng kết chi phí sau chuyến đi
- [ ] Feed dữ liệu ngược vào Reputation Engine (M09)

---

## Docker / Local Deploy

Mục tiêu: `docker compose up` là có app + DB chạy ở localhost, tự apply
migration, không cần bước tay nào khác.

- **`Dockerfile`** — single-stage `node:20-alpine`, `npm ci` → `prisma
generate` → `next build` → `next start`. Chưa tối ưu size (chưa dùng
  Next.js `output: "standalone"` + multi-stage) — ưu tiên độ tin cậy cho
  local test trước.
- **`docker-compose.yml`** — service `db` (Postgres 16, healthcheck) +
  service `web` (build từ Dockerfile, đợi `db` healthy). Cổng web đọc từ
  `WEB_PORT` (mặc định 3000) để tránh đụng cổng khi máy đã có service khác
  chiếm 3000.
- **`docker-entrypoint.sh`** — chạy `prisma migrate deploy` trước khi start
  app, nên container luôn tự đồng bộ schema mới nhất khi khởi động.

Cách dùng:

```bash
npm run docker:up      # = docker compose up --build
# hoặc đổi cổng nếu 3000 đang bận:
WEB_PORT=3001 docker compose up --build
```

**Đã verify (2026-09-04):** `docker compose up -d db` → healthy → `prisma
migrate dev --name init` chạy thật, tạo 18 bảng → build `web` qua Docker →
xem log build/run trong Changelog bên dưới.

---

## Changelog

### 2026-09-04

- Scaffold toàn bộ cấu trúc thư mục + Prisma schema (commit `e7a258f`, đã push `main`).
- Viết `docs/spec-dev-plan.md` này.
- Thêm `Dockerfile`, `docker-compose.yml`, `docker-entrypoint.sh`, `.dockerignore`.
- Chạy `docker compose up -d db` → container `tripbase-db-1` healthy.
- Chạy `prisma migrate dev --name init` với `DATABASE_URL` trỏ vào DB Docker
  → migration `prisma/migrations/20260904041205_init` được tạo và apply,
  18 bảng lên đúng theo schema (verify bằng `\dt`).
- Build + chạy service `web` qua `docker compose up --build` để verify
  localhost: build image thành công, `docker-entrypoint.sh` tự chạy `prisma
migrate deploy` ("No pending migrations to apply" — đúng vì đã migrate ở
  bước trên), app start trong container và trả `HTTP 200` thật cho `/`,
  `/trips`, `/explore` (test qua `WEB_PORT=3001` vì cổng 3000 trên máy đang
  bị container khác chiếm). Đã `docker compose down` sau khi verify xong.
