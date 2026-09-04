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
| M13 | [Auth (login/register)](#m13--auth-loginregister)             | —       | ✅         | ✅      | ✅  | ✅         |
| M14 | [i18n & UI polish](#m14--i18n--ui-polish)                     | —       | —          | ✅      | ✅  | ✅         |
| M01 | [Trip Builder](#m01--trip-builder)                            | P0      | ✅         | 🟨      | 🟨  | 🟨         |
| M02 | [Itinerary / Smart Timeline](#m02--itinerary--smart-timeline) | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M03 | [Map Planner](#m03--map-planner)                              | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M04 | [Budget Board](#m04--budget-board)                            | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M05 | [Booking Vault](#m05--booking-vault)                          | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M06 | [Checklist](#m06--checklist)                                  | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M07 | [Share & Permission](#m07--share--permission)                 | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M08 | [CopyPlan Engine](#m08--copyplan-engine)                      | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M09 | [Reputation Engine](#m09--reputation-engine)                  | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M10 | [Plan Marketplace / Explore](#m10--plan-marketplace--explore) | P1      | ✅         | 🟨      | 🟨  | 🟨         |
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
- [x] Migration đầu tiên + seed script (`prisma/seed.ts`, `npm run db:seed`)
      — 2 user demo, 5 trip public đa điểm đến
- [x] Route `/`, `/trips`, `/trips/[tripId]`, `/explore`, `/saved`,
      `/creators/[creatorId]`, `/login`, `/register` — app build được
- [x] Tooling: ESLint + Prettier, `.editorconfig`, Zod env validation
- [x] Docker: `Dockerfile` + `docker-compose.yml` (Postgres + web), chạy
      `npm run docker:up` là có localhost để test — xem
      [Docker / Local Deploy](#docker--local-deploy)

Chưa làm:

- [ ] CI (lint/typecheck/build tự động trên PR)

---

## M13 — Auth (login/register)

Không phải 1 trong 12 module gốc ở mục 4 của spec, nhưng là hạ tầng nền mà
M01/M07/M08/M10 đều phụ thuộc ("cần đăng nhập để xem chi tiết plan").

- **Code:** `src/features/auth/`, `src/server/auth/{password,session}.ts`,
  `src/server/services/auth.service.ts`, field `User.passwordHash`
- **Trạng thái:** ✅ Xong cho MVP hiện tại (2026-09-04)

Đã làm:

- [x] Session = JWT ký bằng `AUTH_SECRET`, lưu trong cookie httpOnly
      (Credentials-only: email + mật khẩu qua bcryptjs) — **chưa phải OAuth
      provider thật**, xem `src/server/auth/README.md` và mục 15 của spec
      trước khi implement thêm
- [x] `/login`, `/register` — Server Actions (`useActionState`), redirect về
      `callbackUrl` sau khi login
- [x] `SiteHeader` (server component) hiện trạng thái đăng nhập ở mọi trang
- [x] Logout qua Server Action

Chưa làm:

- [ ] Quên mật khẩu / đổi mật khẩu
- [ ] Xác thực email
- [ ] Quyết định OAuth provider thật (Auth.js/Clerk/Supabase — mục 15) nếu
      cần login bằng Google/Facebook

---

## M14 — i18n & UI polish

Không phải module nghiệp vụ — đây là hạ tầng trình bày (presentation) áp
dụng cho toàn bộ app, làm lại theo yêu cầu "giao diện xấu, không hiện đại,
định hướng song ngữ vi/en".

- **Code:** `src/i18n/*`, `src/proxy.ts`, `messages/{vi,en}.json`,
  `global.d.ts`, `src/app/[locale]/*`, `src/components/shared/{site-header,
theme-toggle,theme-provider,language-switcher,placeholder-screen}.tsx`
- **Trạng thái:** ✅ Xong cho phạm vi hiện có (2026-09-04)

Đã làm:

- [x] Chuyển toàn bộ route sang `src/app/[locale]/...` — `next-intl`
      (`localePrefix: "as-needed"`): vi mặc định không prefix (`/`, `/trips`),
      en có prefix (`/en`, `/en/trips`). Locale detect qua `Accept-Language`
      nếu chưa có cookie/lựa chọn trước đó (hành vi mặc định của next-intl).
- [x] `LanguageSwitcher` (client) đổi locale giữ nguyên trang đang xem.
- [x] Dark mode qua `next-themes`, theo `system` mặc định, toggle thủ công
      bằng `ThemeToggle`; toàn bộ palette (kể cả `.dark`) định nghĩa trong
      `globals.css` bằng CSS variables (oklch) — đổi theme không cần đổi class
      Tailwind ở từng component.
- [x] Đổi màu nhấn thương hiệu từ xám trung tính (mặc định shadcn) sang
      emerald, thêm icon (`lucide-react`) cho location/calendar/user/status/
      verified khắp Home, Trip Detail, Placeholder screens; hero có gradient
      nhẹ; header sticky + backdrop-blur.
- [x] Toàn bộ chuỗi hiển thị (nav, home, trip status, trip detail, auth
      form + **lỗi validate/login**, placeholder screens) đi qua
      `messages/vi.json` / `messages/en.json` — không còn chuỗi hard-code.
      Lỗi từ Server Action (`AuthError`) mang **mã lỗi**, dịch sang locale hiện
      tại ở boundary `actions.ts`, giữ `auth.service.ts` locale-agnostic.
- [x] Format ngày/giờ dùng `next-intl`'s `getFormatter().dateTimeRange`
      (tự đổi theo locale: `dd/mm` cho vi, `mm/dd` cho en), không hard-code
      `Intl.DateTimeFormat("vi-VN", ...)` nữa.
- [x] Next.js 16: đổi `middleware.ts` (deprecated) → `src/proxy.ts` theo
      convention mới.

Chưa làm:

- [ ] Explore/Saved/Trips/Creator vẫn là `PlaceholderScreen` — chưa có UI
      thật để đánh giá redesign trên các trang đó
- [ ] Chưa có cách người dùng tự chọn/khoá 1 ngôn ngữ lâu dài qua UI settings
      (hiện chỉ đổi tức thời bằng nút, next-intl tự set cookie `NEXT_LOCALE`)
- [ ] Chưa test responsive mobile kỹ (mới verify ở viewport desktop)

Ghi chú kỹ thuật:

- Base UI `Button` khi dùng `render={<Link .../>}` (render ra `<a>`) phải
  set thêm `nativeButton={false}`, nếu không sẽ có console warning (Base UI
  mong đợi native `<button>` khi `nativeButton` mặc định `true`).
- `next-themes` tự inject 1 `<script>` để tránh flash sai theme — React 19
  log 1 console warning dev-only ("Encountered a script tag...") vô hại,
  không xuất hiện ở production build, không phải bug của TripBase.

---

## M01 — Trip Builder

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/trip/`, `src/server/services/trip.service.ts`, model `Trip`, `Traveler`
- **Trạng thái:** 🟨 Đang làm

Đã làm:

- [x] Đọc chi tiết 1 trip thật từ DB (`getTripDetail`), có gate: plan không
      public + không phải chủ sở hữu → 404; plan public nhưng chưa đăng
      nhập → yêu cầu login (`/trips/[tripId]`)

Chưa làm:

- [ ] Form tạo trip (điểm đến, ngày, số người, ngân sách, style)
- [ ] Server action `createTrip` / `updateTrip`
- [ ] Trip dashboard thật (danh sách trip của user đăng nhập) — hiện
      `src/app/(app)/trips/page.tsx` vẫn là placeholder tĩnh
- [ ] Trạng thái plan: chuyển Ý tưởng / Đã lên lịch / Đã đi + badge
      "Verified by Author" (hiện chỉ đọc, không đổi được)
- [ ] Đổi visibility: Riêng tư / Bạn bè-nhóm / Public

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
- [ ] Auth/permission check theo `visibility` + `Collaborator.role` (hiện
      `trip.service.ts` mới chỉ tự check owner, chưa check Collaborator)

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
- **Code:** `src/server/services/marketplace.service.ts`, `src/app/page.tsx`, model `Interaction`, `Trip` (visibility/status)
- **Trạng thái:** 🟨 Đang làm

Đã làm:

- [x] Home page (`/`) có ô search theo điểm đến (`?q=`), query thật vào
      DB (`Trip.visibility = PUBLIC`, `destination` chứa từ khoá, không
      phân biệt hoa/thường), xếp hạng rule-based: khớp chính xác > khớp
      đầu chuỗi > chứa từ khoá — **không dùng AI**, đúng tinh thần mục 8.1
- [x] Không có từ khoá → hiện danh sách plan public gần nhất thay vì rỗng
- [x] Route `/explore`, `/saved` vẫn placeholder — logic search thật hiện
      nằm ở Home page, **chưa di chuyển/hợp nhất vào `/explore`**

Chưa làm:

- [ ] Hợp nhất search ở Home vào đúng trang Explore/Marketplace (mục 4),
      hoặc quyết định Home page = Explore rút gọn
- [ ] Filter theo ngân sách/CopyPlan Score/trạng thái (hiện chỉ lọc theo
      điểm đến)
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
- Seed data (`npm run db:seed`) chạy tay, **không** tự động trong
  entrypoint — tránh insert lại demo data mỗi lần container restart trên
  môi trường không phải local.

Cách dùng:

```bash
npm run docker:up      # = docker compose up --build
# hoặc đổi cổng nếu 3000 đang bận:
WEB_PORT=3001 docker compose up --build
```

**Đã verify (2026-09-04):**

- `docker compose up -d db` → healthy → `prisma migrate dev --name init`
  chạy thật, tạo 18 bảng → build `web` qua Docker → `HTTP 200` cho `/`,
  `/trips`, `/explore` từ trong container.
- Sau khi thêm Auth + Home search: `prisma migrate dev
--name add_user_password_hash` → `npm run db:seed` (2 user, 5 trip
  public) → rebuild `docker compose up -d --build web` → verify lại qua
  trình duyệt (xem log Changelog bên dưới).

---

## Changelog

### 2026-09-04

- Scaffold toàn bộ cấu trúc thư mục + Prisma schema (commit `e7a258f`, đã push `main`).
- Viết `docs/spec-dev-plan.md` này; thêm Docker local deploy + migration đầu
  tiên (commit `80f89b5`).
- **Auth (M13) + Home search (M10, một phần):**
  - Thêm `User.passwordHash`, migration `add_user_password_hash`.
  - Session JWT trong cookie httpOnly (`jose` + `bcryptjs`), Server Actions
    login/register/logout, `SiteHeader` hiện trạng thái đăng nhập.
  - `src/app/page.tsx` viết lại: ô search điểm đến → query
    `marketplace.service.searchPublicTrips` (rule-based rank, không AI) →
    card kết quả link tới `/trips/[id]`.
  - `/trips/[tripId]` viết lại: đọc trip thật qua `trip.service.getTripDetail`;
    plan public nhưng chưa đăng nhập → chặn, hiện nút "Đăng nhập để xem chi
    tiết"; plan private không phải chủ → 404.
  - `prisma/seed.ts` + `npm run db:seed`: 2 user demo
    (`demo@tripbase.vn` / `password123`), 5 trip public đa điểm đến để
    search có dữ liệu thật.
  - Xoá `src/app/(app)/layout.tsx` (header trùng với `SiteHeader` mới ở
    root layout).
  - Verify: `lint`, `typecheck`, `build` pass. Rebuild Docker image (phải
    thêm `AUTH_SECRET` vào build args/env — `next build` cần nó vì
    `SiteHeader` gọi `getSession()` ở mọi trang). Test qua trình duyệt thật
    (Chrome automation): search "Đà Lạt" → đúng 1 kết quả khớp; click vào
    card → chặn, hiện "Đăng nhập để xem chi tiết"; login
    `demo@tripbase.vn` → redirect đúng `callbackUrl`, hiện đầy đủ chi tiết
    trip; logout → quay lại trạng thái chưa đăng nhập. Toàn bộ luồng chạy
    đúng với dữ liệu thật trong Postgres, không phải mock.
- **i18n (vi/en) + làm mới giao diện (M14)** — theo yêu cầu "giao diện xấu,
  không hiện đại, định hướng song ngữ":
  - Chuyển route sang `src/app/[locale]/...`, thêm `next-intl`
    (`src/i18n/{routing,navigation,request}.ts`, `messages/{vi,en}.json`,
    `src/proxy.ts` thay `middleware.ts` theo convention Next.js 16).
  - Thêm dark mode (`next-themes`) + đổi màu nhấn thương hiệu sang emerald,
    thêm icon `lucide-react` cho card/nav/gate, header sticky backdrop-blur,
    hero có gradient — áp dụng cho Home, Trip Detail, Auth, Placeholder
    screens.
  - Toàn bộ chuỗi UI (kể cả lỗi từ Server Action) qua `next-intl`; ngày giờ
    format theo locale bằng `getFormatter().dateTimeRange`.
  - Fix dọc đường: `nativeButton={false}` cho `Button render={<Link/>}`
    (Base UI cảnh báo khi render ra `<a>` mà không set cờ này);
    `middleware.ts` → `src/middleware.ts` → `src/proxy.ts` (2 lần đổi vị
    trí/tên do quy ước Next.js với `src/` dir và Next 16's proxy rename).
  - Verify qua trình duyệt thật: search + gate + login + logout lặp lại ở
    cả 2 theme (sáng/tối) và cả 2 locale (vi mặc định không prefix, en có
    `/en`); `lint`/`typecheck`/`build` đều pass.
