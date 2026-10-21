# TripBase — Dev Plan & Tiến độ

Tài liệu này là **log sống**: mỗi module có mã riêng, map tới thư mục code
cụ thể, và một checklist trạng thái. Cập nhật checklist + phần
[Changelog](#changelog) mỗi khi có thay đổi đáng kể — đây là nguồn sự thật
duy nhất về "cái gì đã làm, cái gì chưa", không suy luận lại từ git log.

Chú thích trạng thái: ⬜ Chưa bắt đầu · 🟨 Đang làm · ✅ Xong

Tham chiếu nội dung nghiệp vụ đầy đủ: [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md).
Tổng quan kiến trúc: [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## Quy trình Git

Repo chỉ có 2 nhánh lâu dài: `dev` (làm việc hằng ngày) và `main` (bản đã
test xong, sẵn sàng release). Quy tắc bắt buộc cho mọi thay đổi:

1. **Không mở branch riêng (feature branch).** Code thẳng trên `dev`.
   Branch riêng từng gây ra việc 2 người viết trùng 1 tính năng (itinerary
   reorder + vote/comment) mà không ai biết, tới lúc merge mới phát hiện và
   phải bỏ hẳn một bên — xem mục [2026-09-18](#2026-09-18) trong Changelog.
2. **`git pull` (hoặc `git pull --ff-only`) trước khi bắt đầu code mỗi
   phiên làm việc**, để luôn build trên code mới nhất của người khác.
3. **Commit nhỏ, mỗi commit một thay đổi logic riêng biệt** (1 fix, 1
   feature nhỏ, 1 refactor) — không gộp nhiều việc không liên quan vào một
   commit to. Dễ review, dễ revert từng phần nếu có lỗi.
4. **Trước khi commit:** chạy `npm run typecheck` và `npm run lint`, sửa hết
   lỗi (warning có thể để lại nếu không liên quan tới thay đổi của mình).
5. Khi một module đã test xong và sẵn sàng đưa lên production: mở **Pull
   Request từ `dev` → `main`**. Không merge vào `main` khi chưa được xác
   nhận đã test kỹ.
6. Cập nhật checklist + [Changelog](#changelog) trong tài liệu này khi có
   thay đổi đáng kể, như đã nêu ở đầu file.

---

## Tổng quan tiến độ
                                                                                
| Mã  | Module                                                        | Ưu tiên | Data model | Service | UI  | Trạng thái |
|-----|---------------------------------------------------------------|---------|------------|---------|-----|------------|
| M00 | [Infra/Scaffold](#m00--infrascaffold)                         | —       | ✅         | —       | —   | ✅        |
| M13 | [Auth (login/register)](#m13--auth-loginregister)             | —       | ✅         | ✅      | ✅  | ✅       |
| M14 | [i18n & UI polish](#m14--i18n--ui-polish)                     | —       | —          | ✅      | ✅  | ✅       |
| M01 | [Trip Builder](#m01--trip-builder)                            | P0      | ✅         | ✅      | ✅  | ✅       |
| M02 | [Itinerary / Smart Timeline](#m02--itinerary--smart-timeline) | P0      | ✅         | ✅      | ✅  | ✅       |
| M03 | [Map Planner](#m03--map-planner)                              | P0      | ✅         | ✅      | ✅  | ✅       |
| M04 | [Budget Board](#m04--budget-board)                            | P0      | ✅         | ✅      | ✅  | ✅       |
| M05 | [Booking Vault](#m05--booking-vault)                          | P1      | ✅         | ✅      | ✅  | ✅       |
| M06 | [Checklist](#m06--checklist)                                  | P0      | ✅         | ✅      | ✅  | ✅       |
| M07 | [Share & Permission](#m07--share--permission)                 | P0      | ✅         | ✅      | ✅  | ✅       |
| M08 | [CopyPlan Engine](#m08--copyplan-engine)                      | P0      | ✅         | ✅      | ✅  | ✅       |
| M09 | [Reputation Engine](#m09--reputation-engine)                  | P1      | ✅         | ✅      | ✅  | ✅       |
| M10 | [Plan Marketplace / Explore](#m10--plan-marketplace--explore) | P1      | ✅         | ✅      | ✅  | ✅       |
| M11 | [Tag & Tip Library](#m11--tag--tip-library)                   | P1      | ✅         | ✅      | ✅  | ✅       |
| M12 | [Travel Memory](#m12--travel-memory)                          | P2      | ✅         | ✅      | ✅  | ✅       |


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
- [x] Đổi font UI từ Geist Sans sang **Inter** (theo yêu cầu "đổi font chữ
      thành chữ modern UI hay dùng và phù hợp đa ngôn ngữ"), subsets
      `latin`/`latin-ext`/`vietnamese`; chuỗi fallback `--font-sans` kết
      thúc bằng font hệ thống chuyên CJK (Noto Sans JP/SC, Hiragino Sans,
      PingFang SC, Microsoft YaHei) để JA/ZH sau này hiển thị đúng ngay
      không cần đổi font. Tiện thể fix 1 bug có sẵn: `--font-sans` bị tự
      tham chiếu chính nó nên trước giờ chưa từng áp dụng đúng font.
- [x] Đổi màu thương hiệu từ emerald sang **xanh dương** (theo yêu cầu
      tham khảo giao diện/bố cục/màu sắc của
      `https://shigoto.mhlw.go.jp/` — job tag, trang tra cứu nghề nghiệp
      của Bộ Y tế, Lao động và Phúc lợi Nhật Bản): màu chủ đạo của trang
      đó (`#0568D3`) quy đổi sang `oklch(0.53 0.18 257)` cho light mode,
      sáng hơn cho dark mode (`oklch(0.72 0.16 257)`) — đổi toàn bộ token
      `--primary`/`--accent`/`--ring`/`--chart-1`/`--sidebar-*` (không đổi
      lẻ tẻ từng chỗ) nên áp dụng tự động khắp app chỉ qua 1 file
      `globals.css`, không phải sửa từng component. Nền light mode cũng
      đổi từ trắng tinh sang xám rất nhạt `oklch(0.975 0.002 250)` (trang
      tham khảo dùng `#F6F6F6`, không phải `#FFFFFF`).
  - Mang 2 pattern bố cục đặc trưng của trang tham khảo vào trang chủ:
    (1) lưới điều hướng nhanh dạng icon tròn + nhãn (trang tham khảo gọi
    là "職業を調べよう" — ở đây là "PLAN · Quick start" trỏ tới
    Trips/Explore/Tag & Tip/Saved), và (2) tiêu đề section 2 phần: chữ
    tiếng Anh đậm cỡ lớn (giữ nguyên tiếng Anh ở cả 2 locale, đúng kiểu
    trang gốc giữ "TOPICS"/"INFORMATION" bằng tiếng Anh ngay trên trang
    tiếng Nhật) + nhãn mô tả nhỏ cạnh bên (áp dụng cho "EXPLORE · Recent
    public plans").
  - **Cố ý không làm theo** 1 số chi tiết khác của trang tham khảo: nhân
    vật mascot minh hoạ (không hợp với TripBase), section chuyển màu
    theo đường chéo (clip-path) giữa các block màu (rủi ro vỡ layout ở
    mobile nếu làm ẩu, để dành làm sau nếu cần), banner thông báo màu
    xanh nhạt dưới nav (chưa có nội dung thông báo thật để hiện).
  - Verify qua trình duyệt thật cả light lẫn dark mode: toàn bộ badge
    "Verified"/trust-tier, gradient thẻ hội viên, nút CTA đều tự đổi
    sang xanh dương đúng qua token dùng chung, không cần sửa riêng từng
    trang; không có console error mới.

Chưa làm:

- [x] Explore/Saved đã có UI thật sau khi hoàn thiện M10; theme/i18n dùng chung với hệ thống hiện tại.
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
- shadcn `Select` (Base UI) — `Select.Value` **không** tự tra nhãn theo
  `SelectItem` đang chọn như Radix; phải truyền render-prop
  `<SelectValue>{(value) => label}</SelectValue>` để hiện nhãn đã dịch thay
  vì raw enum value. Xem `src/features/trip/trip-form.tsx`.

---

## M01 — Trip Builder

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/trip/{trip-form,styles,actions}.tsx`, `src/server/services/trip.service.ts`, model `Trip`, `Traveler`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại (cập nhật 2026-10-07)

Đã làm:

- [x] CRUD Trip + Traveler; dashboard `/trips`, tạo/sửa/xoá Trip.
- [x] Phân quyền OWNER / EDITOR / VIEWER; Edit Link được truyền xuống action/service qua `shareToken`.
- [x] Các field lập kế hoạch: ngày đi, visibility, số người, budget target, pace, travel style.
- [x] Khi đổi `Trip.startDate`, đồng bộ ngày thật của `ItineraryItem.startTime/endTime` nhưng giữ nguyên giờ/phút trong cùng transaction.
- [x] Chỉ OWNER được chuyển Trip sang `COMPLETED` hoặc đổi Trip từ `COMPLETED` về trạng thái khác.
- [x] `verifiedByAuthor` được tính khi Trip `COMPLETED`; evidence MVP hiện dùng ảnh Story do chính owner upload.
- [x] Khi Trip rời trạng thái `COMPLETED`, `verifiedByAuthor` reset về `false`.
- [x] Runtime test Owner-only COMPLETED + Verified by Author đã pass.

Nâng cấp sau MVP:

- [ ] Có thể bổ sung thêm evidence loại `used booking` / check-in khi model hỗ trợ xác nhận việc sử dụng thực tế.

## M02 — Itinerary / Smart Timeline

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/itinerary/`,
  `src/server/{repositories,itinerary.service.ts}`, model `ItineraryItem`,
  `Vote`, `Comment`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại (2026-09-14)

Đã làm:

- [x] CRUD activity đầy đủ: thêm, sửa, xoá; check ownership ở service thay
      vì chỉ dựa vào UI.
- [x] Smart Timeline nhóm theo `day`, ưu tiên thời gian thực trong ngày và
      dùng `sortOrder` cho thứ tự kéo-thả.
- [x] **Drag & Drop thật**: sắp xếp trong cùng ngày và kéo activity qua ngày
      khác; server validate toàn bộ item thuộc đúng trip trước khi lưu.
- [x] Cảnh báo **trùng giờ** và **khoảng nghỉ ngắn** dưới 15 phút giữa các
      activity trong cùng ngày.
- [x] Cảnh báo **travel time/buffer** giữa 2 activity liên tiếp có tọa độ:
      dùng Haversine + heuristic thời gian di chuyển rule-based; hiện khoảng
      cách, thời gian ước tính và cảnh báo khi thời gian trống không đủ.
- [x] `LocationTag.openingHours` + form nhập giờ mở/đóng cửa; Smart Timeline
      cảnh báo khi activity nằm ngoài giờ mở cửa. Hỗ trợ khung giờ qua nửa
      đêm như `18:00-02:00`.
- [x] Liên kết Tag & Tip Library: picker chọn `LocationTag` có sẵn, có ô tìm
      kiếm và **inline dedup suggestion ngay lúc gõ**; dùng chung thuật toán
      normalize + Levenshtein/token similarity với `tag-dedup.service.ts`
      (`DUPLICATE_THRESHOLD = 0.72`) thay vì duy trì 2 bản logic khác nhau.
- [x] `startTime`/`endTime` là **timestamp thật** theo
      `Trip.startDate + (day - 1)`; không còn tạo dữ liệu mới neo ở
      `1970-01-01`. Migration có backfill các timestamp cũ năm 1970 khi Trip
      có `startDate`.
- [x] Khi kéo activity sang ngày khác, timestamp được dựng lại theo ngày mới
      nhưng giữ nguyên giờ. Khi sửa `Trip.startDate`, `trip.service` cũng
      dịch toàn bộ timestamp itinerary tương ứng trong cùng transaction.
- [x] **Vote trên từng activity**: UP/DOWN, bấm lại cùng lựa chọn để bỏ vote,
      đổi UP↔DOWN được; UI hiển thị tổng UP/DOWN/score và vote hiện tại.
- [x] **Comment trên từng activity**: thêm comment, giới hạn 1000 ký tự;
      tác giả comment hoặc chủ Trip được xoá.
- [x] Siết quyền Vote/Comment ở service: chủ Trip và user đăng nhập trên Trip
      PUBLIC được tương tác; Trip PRIVATE/FRIENDS yêu cầu owner hoặc có bản
      ghi `Collaborator`. Biết `itemId`/`commentId` trực tiếp không đủ để
      vượt quyền.
- [x] i18n vi/en cho toàn bộ phần mới: drag/drop, travel warning, opening
      hours, inline dedup, vote/comment và error state.
- [x] Migration lịch sử Prisma được khôi phục đúng thứ tự; migration
      `20260911074035_add_location_tag_opening_hours` chứa `opening_hours`,
      index Vote/Comment và backfill timestamp cũ. Không dùng
      `prisma migrate reset`.
- [x] Trước commit M02 `fbfaa93`, `prisma format`, `prisma validate`,
      `prisma generate` và `npm run typecheck` đều pass; code đã push lên
      branch `dev`.

Ghi chú xác minh cuối:

- Sau hardening Vote/Comment ngày 2026-09-14, lỗi type
  `comment.item.trip.id` đã được sửa sang `comment.item.tripId`; các lần
  `npm run typecheck` tiếp theo trong đợt M06/M07 ngày 2026-09-16 đã chạy sạch.
- M02 được coi là feature-complete cho MVP; OWNER/EDITOR collaborator có quyền
  chỉnh sửa, VIEWER chỉ xem. Quyền chỉnh sửa bằng **Edit Link token** vẫn thuộc
  phần tích hợp còn lại của M07, không mở lại phạm vi M02.
- Các mở rộng như realtime collaboration/presence hoặc notification không nằm
  trong phạm vi M02 hiện tại và sẽ được tách sang module phù hợp nếu cần.

---

## M03 — Map Planner

- **Ưu tiên:** P0 · **Spec:** mục 4, 6a, 11
- **Code:** `src/features/map/`, model `LocationTag` (dùng lat/lng thay vì `Place`)
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại (bản đồ + marker theo ngày + cảnh báo đi vòng; các mục geo-clustering/map picker là nâng cấp sau MVP)

Quyết định (user chọn khi được hỏi): **Leaflet + OpenStreetMap**, không phải
Mapbox/Google Maps — miễn phí, không cần API key/tài khoản.

Đã làm:

- [x] `react-leaflet` + `leaflet`; component tách riêng
      (`trip-map.tsx` + `trip-map-loader.tsx` dùng `next/dynamic({ssr:false})`
      vì Leaflet đụng `window` — bắt buộc phải nằm trong 1 Client Component
      mới được dùng `ssr:false`, không gọi thẳng từ trang Server Component)
- [x] Thêm input Vĩ độ/Kinh độ (tuỳ chọn) khi tạo tag ở Tag & Tip Library —
      toạ độ là điều kiện để 1 điểm hiện lên map, chưa bắt buộc
- [x] Section "Map Planner" trên Trip Detail: marker màu theo ngày (7 màu
      lặp lại), popup hiện tên + ngày/giờ + badge trust tier (🟢/🟡/⚪, nối
      với `getTrustTier` từ M11 — badge Cite Trust Score đã lên map)
- [x] "Gom theo khu vực" hiện tại = tô màu theo ngày (rule-based, không phải
      geo-clustering) — xem ghi chú "Chưa làm" bên dưới
- [x] `geo.ts`: rule-based "đi vòng" (không AI) — so quãng đường thực tế
      trong ngày (đúng thứ tự giờ) với quãng đường nếu đi theo nearest-
      neighbor; thực tế dài hơn 30% → cảnh báo. Áp dụng từ 3 điểm có toạ độ
      trở lên trong cùng 1 ngày
- [x] Seed 8 location tag mẫu đã có toạ độ thật (Đà Nẵng, Hà Nội, Hội An,
      Hạ Long, Đà Lạt, TP.HCM) để map có dữ liệu ngay
- [x] `LocationTag` đã có `openingHours`; dữ liệu này hiện được Smart
      Timeline (M02) dùng để cảnh báo ngoài giờ mở cửa, nên M03 có thể tái
      sử dụng cùng nguồn dữ liệu thay vì tạo model giờ mở cửa riêng.
- [x] Verify qua trình duyệt thật với dữ liệu thật: tạo trip Đà Nẵng, thêm
      3 điểm (Bánh Xèo Bà Dưỡng 08:00, Phố cổ Hội An 11:00, Muong Thanh
      Grand Đà Nẵng 15:00) → map hiện đúng 3 marker đúng vị trí thực tế;
      popup đúng nội dung; **cảnh báo đi vòng xuất hiện đúng** (thứ tự giờ
      đi xa rồi quay lại gần điểm đầu, xa hơn ~50% so với thứ tự tối ưu)

Chưa làm:

- [ ] Gom theo khu vực **thật sự** (geo-clustering) — hiện chỉ tô màu theo
      ngày, không nhóm các điểm gần nhau về mặt không gian
- [ ] Bắt buộc/gợi ý nhập toạ độ khi tạo tag (map chọn điểm trên bản đồ
      thay vì gõ số) — hiện phải biết số thật, UX chưa thân thiện
- [ ] Hiển thị giờ mở cửa/trạng thái đang mở-đóng trực tiếp trên Map
      Planner/popup — dữ liệu + logic cảnh báo đã có ở M02, nhưng Map UI chưa
      trực quan hoá phần này.
- [ ] Hiển thị marker cho `Place` (model riêng, chưa dùng đến) — M03 hiện
      chỉ vẽ từ `LocationTag`, phù hợp với hướng "1 nguồn dữ liệu địa điểm"
      đã chọn từ M11 thay vì trùng lặp 2 model

Ghi chú kỹ thuật:

- `leaflet`/`react-leaflet` chỉ chạy được ở client (`Leaflet` đụng `window`
  khi import) — `next/dynamic(..., { ssr: false })` **không được gọi trực
  tiếp trong Server Component**, phải bọc qua 1 file "use client" riêng
  (`trip-map-loader.tsx`) rồi mới import vào trang.

---

## M04 — Budget Board

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 11
- **Code:** `src/features/budget/`, `src/server/services/budget.service.ts`, model `Expense`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] CRUD khoản chi trên Trip Detail: thêm, sửa, xoá.
- [x] 8 hạng mục chi phí cố định; hỗ trợ `note`, `splitBetween`, người trả, ngày tạo.
- [x] Tổng chi, còn lại/vượt ngân sách, tổng theo hạng mục, balances và settlement "ai trả ai".
- [x] OWNER/EDITOR được thao tác, VIEWER chỉ xem; permission được kiểm tra ở service.
- [x] Giữ `shareToken` trong luồng Edit Link và các link edit/cancel/redirect.
- [x] Kiểm thử luồng Budget và xác nhận M04 hoàn thiện.

Nâng cấp sau MVP:

- [ ] Picker chọn người trả khác thay vì mặc định user đang thao tác.
- [ ] Receipt riêng cho từng Expense nếu sau này cần; hiện Booking Vault đã có private document cho booking.

## M05 — Booking Vault

- **Ưu tiên:** P1 · **Spec:** mục 4, 5
- **Code:** `src/features/booking/`, `src/server/repositories/booking.repository.ts`,
  `src/server/services/booking.service.ts`, `src/server/storage/booking-document.ts`,
  route `src/app/api/bookings/[bookingId]/document/route.ts`, model `Booking`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] Danh sách booking theo trip; CRUD thêm/sửa/xoá.
- [x] Upload private document PDF/JPG/PNG/WebP, giới hạn 8 MB; validate cả client và server.
- [x] File private lưu tại `storage/bookings`, không expose trực tiếp qua `public/`.
- [x] Route `/api/bookings/[bookingId]/document` kiểm tra quyền trước khi trả file.
- [x] Khi replace/remove/delete booking, file cũ được dọn best-effort.
- [x] OWNER/EDITOR thao tác; VIEWER/View Link chỉ xem; Edit Link đã giữ `shareToken`.
- [x] Đã kiểm thử upload/open/replace/remove/delete, file hợp lệ/không hợp lệ và permission.

Nâng cấp sau MVP:

- [ ] Email forwarding để import booking tự động.
- [ ] S3-compatible/object storage cho production scale.

## M06 — Checklist

- **Ưu tiên:** P0 · **Spec:** mục 4, 5
- **Code:** `src/features/checklist/`, `src/server/repositories/checklist.repository.ts`,
  `src/server/services/checklist.service.ts`, `src/features/checklist/{actions,checklist-manager}.tsx`,
  model `ChecklistItem`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại (2026-09-16)

Đã làm:

- [x] CRUD checklist item: thêm, sửa, xoá.
- [x] Check Done/Pending trực tiếp trên danh sách.
- [x] `dueDate` và giao việc (`assignedToId`) cho OWNER hoặc collaborator thuộc
      trip; service chặn assignee ngoài trip.
- [x] UI `ChecklistManager` trên Trip Detail: danh sách, inline edit, giao việc,
      hạn hoàn thành, toggle trạng thái và xoá.
- [x] Permission matrix đã kiểm tra thành công:
      **OWNER → thêm/sửa/xoá/Done/giao việc**,
      **EDITOR → thêm/sửa/xoá/Done/giao việc**,
      **VIEWER → chỉ xem**.
- [x] Permission được kiểm tra ở service bằng `assertCanViewTrip`/
      `assertCanEditTrip`, không chỉ ẩn nút ở client.
- [x] `checklist.service.ts` đã nhận `shareToken` cho luồng đọc trang và danh
      sách assignee; PRIVATE trip mở bằng View/Edit Link hợp lệ không còn bị
      chặn ở bước load Checklist.
- [x] i18n vi/en cho toàn bộ UI và error state. `npm run typecheck` sạch sau
      tích hợp M06/M07 ngày 2026-09-16.

Nâng cấp sau MVP:

- [ ] Preset checklist theo loại chuyến đi (visa, SIM, bảo hiểm...) — không còn
      là blocker để đóng M06 MVP.
- [ ] Server Action Checklist qua **Edit Link token** vẫn là phần tích hợp M07:
      service đã có tham số token nhưng action/UI chưa truyền token khi mutate.

---

## M07 — Share & Permission

- **Ưu tiên:** P0 · **Spec:** mục 3.3, 4, 5, 13
- **Code:** `src/features/share/`, `src/server/repositories/{collaborator,trip-invitation,share-link}.repository.ts`,
  `src/server/services/{permission,invitation,collaborator,share-link}.service.ts`,
  routes `/invitations`, `/share/[token]`, models `Collaborator`, `TripInvitation`, `ShareLink`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] OWNER suy ra từ `Trip.ownerId`; collaborator chỉ EDITOR/VIEWER.
- [x] Invitation PENDING/ACCEPTED/DECLINED, trang `/invitations`, badge lời mời.
- [x] OWNER quản lý collaborator: đổi EDITOR↔VIEWER, xoá thành viên.
- [x] VIEW/EDIT Share Link, token random, expiry, revoke, resolve token.
- [x] PRIVATE Trip mở đúng qua View/Edit Link hợp lệ.
- [x] Edit Link yêu cầu đăng nhập trước khi cho mutation.
- [x] `shareToken` được truyền xuyên suốt Trip/Traveler, Itinerary, Budget, Checklist, Booking và các internal link/redirect liên quan.
- [x] Permission matrix OWNER / EDITOR / VIEWER / View Link / Edit Link / revoked-expired token đã được kiểm thử end-to-end.

## M08 — CopyPlan Engine

- **Ưu tiên:** P0 · **Spec:** mục 3, 6b, 7, 13
- **Code:** `src/features/copy-plan/`, `src/server/services/copy-plan.service.ts`, model `PlanCopy`, `Trip.forkedFromPlanId`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] Copy toàn bộ Public Plan.
- [x] Copy riêng một ngày hoặc nhiều ngày được chọn; remap ngày về liên tiếp.
- [x] Trip copy trở thành workspace PRIVATE riêng, lưu `forkedFromPlanId`.
- [x] Lưu `PlanCopy` với `originalPlanId`, `copierUserId`, device hash, `initialItemCount`.
- [x] Tính lại Retention Rate dựa trên các item còn giữ `copiedFromItemId`.
- [x] `completeCopyPlan()` cập nhật `PlanCopy.completed = true` và `Trip.status = COMPLETED`.
- [x] Post-trip Rating 1–5 chỉ cho copier/owner của Trip copy và chỉ sau khi completed.
- [x] Guardrail Reputation: self-copy không tính; một user/device chỉ tính một lần.
- [x] UI `CopyPlanProgress` hiển thị completion/rating trên Trip copy.
- [x] Đã kiểm thử M08.

## M09 — Reputation Engine

- **Ưu tiên:** P1 · **Spec:** mục 3, 7, 8, 9, 13, 15
- **Code:** `src/server/services/reputation.service.ts`, `src/server/services/cite-trust.service.ts`,
  `src/server/repositories/creator-reputation.repository.ts`, Creator Profile và models `PlanReputation`,
  `CreatorReputation`, `PlanCopy`, `Citation`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] Creator Profile + edit hồ sơ/avatar/sở thích du lịch.
- [x] CopyPlan Score: Copy Volume hiệu chỉnh bởi Retention, Completion Rate, Post-trip Rating, Diversity Bonus và decay.
- [x] Guardrail CopyPlan Reputation: loại self-copy, dedupe theo user và device.
- [x] Snapshot `PlanReputation` cho Public Plan.
- [x] Creator Reputation tổng hợp từ các Public Plan, ưu tiên plan mới hơn bằng time-decay.
- [x] Citation sync từ itinerary về tag canonical; self-cite không được tính điểm.
- [x] Cite Trust Score tính từ eligible cite, quality, Verified Visit và cross-plan consistency.
- [x] Verified Visit chỉ owner Trip, yêu cầu Trip `COMPLETED`, tag phải nằm trong itinerary.
- [x] `runReputationScoringJob()` chạy theo thứ tự: Plan Reputation → Creator Reputation → Citation sync → Cite Trust.
- [x] Đã kiểm thử M09.

Ghi chú:

- Reputation dùng background scoring job; completion/rating không bắt buộc tính lại score ngay trong cùng request.

## M10 — Plan Marketplace / Explore

- **Ưu tiên:** P1 · **Spec:** mục 4, 5, 6b, 11
- **Code:** `src/app/[locale]/(app)/explore/page.tsx`, `src/app/[locale]/(app)/saved/page.tsx`,
  `src/server/services/marketplace.service.ts`, `src/server/services/saved-plan.service.ts`,
  `src/server/repositories/saved-plan.repository.ts`, `src/features/marketplace/actions.ts`,
  model `Interaction`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] Explore/Marketplace thật, query Public Plan từ DB.
- [x] Search điểm đến + filter/sort theo các tiêu chí Marketplace hiện có.
- [x] Card plan hiển thị thông tin cần thiết và tích hợp CopyPlan.
- [x] Bookmark/Unbookmark qua `Interaction.type = BOOKMARK`.
- [x] Saved Library riêng cho từng user.
- [x] Owner không cần bookmark chính plan của mình.
- [x] Kiểm thử end-to-end M10 thành công.

## M11 — Tag & Tip Library

- **Ưu tiên:** P1 · **Spec:** mục 4, 8.1
- **Code:** `src/features/tag-tip/`, `src/server/services/location-tag.service.ts`,
  `src/server/services/tag-dedup.service.ts`, `src/server/repositories/location-tag.repository.ts`,
  model `LocationTag`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại

Đã làm:

- [x] `/tags` public: search theo tên, filter category, trust badge, creator link.
- [x] `/tags/new`: tạo tag, yêu cầu login, hỗ trợ category, content, opening hours, lat/lng.
- [x] 7 category cố định cho UI.
- [x] Dedup fuzzy theo normalize + Levenshtein/token similarity, cùng category, threshold `0.72`.
- [x] Inline dedup suggestion trong Itinerary Item Form.
- [x] Nếu nghi trùng: gợi ý dùng lại; user vẫn có thể force-create và lưu `possibleDuplicateOfId`.
- [x] LocationTag có thể gắn vào Itinerary; Citation được sync từ itinerary.
- [x] Cite Trust Score/Verified Visit của M09 được hiển thị và sử dụng trong luồng tag.
- [x] Map picker/toạ độ đã có trong form tạo tag.

Nâng cấp sau MVP:

- [ ] Dedup có thể bổ sung khoảng cách địa lý/radius để bám spec chặt hơn khi dữ liệu lớn.
- [ ] CRUD sửa/xoá tag có thể mở rộng nếu cần quản trị nội dung đầy đủ.

## M12 — Travel Memory

- **Ưu tiên:** P2 · **Spec:** mục 4, 6a
- **Code:** `src/features/story/`, `src/server/services/story.service.ts`,
  `src/server/storage/story-photo.ts`, `src/server/services/copy-plan.service.ts`,
  `src/server/services/reputation.service.ts`, Budget Board và model `StorySlide`
- **Trạng thái:** ✅ Xong phạm vi MVP hiện tại (2026-10-07)

Đã làm:

- [x] Trip Story: slide theo ngày/bìa, caption, theme, ảnh tuỳ chọn, thumbnail và Story Viewer full-screen.
- [x] Story Viewer tự chuyển slide, điều hướng trái/phải, share link; PUBLIC Story xem không cần login, PRIVATE chỉ owner.
- [x] Note/album sau chuyến đi dùng Story; tổng kết chi phí tái sử dụng Budget Board, không tạo module chi phí trùng lặp.
- [x] CopyPlan completion: `PlanCopy.completed = true` đồng thời `Trip.status = COMPLETED`.
- [x] Post-trip Rating 1–5 chỉ được ghi sau khi CopyPlan hoàn thành.
- [x] Completion + Post-trip Rating được Reputation Engine đọc vào CopyPlan Score qua background scoring job.
- [x] Chỉ OWNER được chuyển Trip sang `COMPLETED` hoặc đổi Trip từ `COMPLETED` về trạng thái khác.
- [x] Evidence check MVP dùng ảnh Story do chính owner upload.
- [x] `verifiedByAuthor = true` khi Trip `COMPLETED` và có Story photo; không có evidence thì vẫn `COMPLETED` nhưng không Verified.
- [x] Nếu Trip đã `COMPLETED` rồi mới upload ảnh Story, `verifiedByAuthor` được tính lại tự động.
- [x] Xoá Story photo cuối cùng hoặc chuyển Trip khỏi `COMPLETED` sẽ reset `verifiedByAuthor = false`.
- [x] UI hiển thị badge **Đã xác minh chuyến đi** khi `verifiedByAuthor = true`.
- [x] Runtime test toàn bộ luồng M12 thành công ngày 2026-10-07.

Nâng cấp sau MVP:

- [ ] Kéo-thả/sắp xếp lại Story slide.
- [ ] Sửa nội dung slide đã tạo.
- [ ] View/share analytics.
- [ ] Có thể bổ sung evidence `used booking` hoặc check-in khi model có trạng thái xác nhận sử dụng thực tế.

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


### 2026-10-07

- **Hoàn thiện M12 — Travel Memory:**
  - Rà soát Story, Budget, CopyPlan và Reputation để tái sử dụng chức năng đã có thay vì tạo module trùng lặp.
  - Bổ sung Owner-only `COMPLETED`: chỉ chủ Trip được xác nhận hoặc đổi trạng thái khỏi `COMPLETED`.
  - Bổ sung evidence check bằng Story photo của owner và đồng bộ `Trip.verifiedByAuthor`.
  - Trip đã `COMPLETED` rồi mới thêm/xoá Story photo vẫn tự tính lại Verified.
  - Thêm badge **Đã xác minh chuyến đi** trên Trip Detail.
  - Xác nhận Post-trip Rating 1–5 + Completion được đưa vào CopyPlan Score/Reputation background job.
  - Runtime test M12 thành công; đánh dấu M12 ✅.
- Đồng bộ lại trạng thái tài liệu cho M01, M04, M05, M07, M08, M09, M10, M11 và M12 theo tiến độ hiện tại.


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
- Tạo branch `dev`, chuyển toàn bộ commit từ giờ vào đó — chỉ merge `main`
  sau khi user xác nhận đã test OK (xem memory `git-workflow-dev-branch`).
- **Trip Builder (M01) — lõi CRUD:**
  - `src/server/repositories/trip.repository.ts` +
    `src/server/services/trip.service.ts`: `createTrip`, `updateTrip` (check
    ownership), `listOwnedTrips`.
  - `src/features/trip/{actions.ts,trip-form.tsx}`: Server Actions
    `createTripAction`/`updateTripAction` (Zod, `useActionState`), 1
    component `TripForm` dùng chung create/edit.
  - `/trips` (dashboard, yêu cầu đăng nhập), `/trips/new` (form tạo),
    `/trips/[tripId]` (thêm form edit khi `isOwner`) — tất cả route thật,
    không còn placeholder cho `/trips`.
  - Thêm shadcn `Select`; phát hiện `Select.Value` (Base UI) không tự tra
    nhãn theo `SelectItem` như Radix — phải truyền render-prop
    `(value) => label` thủ công, đã note vào phần M14 "Ghi chú kỹ thuật".
  - Verify qua trình duyệt thật: tạo trip → sửa status (Idea → Scheduled)
    - visibility (Private → Public) → lưu → trip xuất hiện đúng trên
      dashboard và trên search public ở Home; validate HTML `required` chặn
      submit tên/điểm đến rỗng. `lint`/`typecheck`/`build` pass. Committed
      vào `dev`, **chưa merge `main`** — chờ user xác nhận test.
- **Tag & Tip Library (M11) — lookup + dedup lõi**, theo yêu cầu "phải cho
  lookup các địa điểm ăn uống, thăm quan, hotel từ local tag, các support
  như thuê xe, di chuyển, sim... đều lookup hết":
  - 7 category cố định (ăn uống/tham quan/khách sạn/thuê xe/di chuyển/
    SIM/khác) — `src/features/tag-tip/categories.ts`.
  - `tag-dedup.service.ts`: Levenshtein similarity rule-based (không AI),
    dùng bởi `location-tag.service.ts` khi tạo tag mới.
  - Trang `/tags`: search + filter category (public, không cần đăng
    nhập), form tạo tag (cần đăng nhập) với cảnh báo trùng lặp + nút
    "Vẫn tạo mới" gắn `possibleDuplicateOfId`.
  - Bug phát hiện + fix: React tự xoá field form sau mỗi lần Server Action
    chạy — mất đúng lúc cần giữ lại tên đã gõ để user quyết định trên
    cảnh báo trùng lặp. Fix bằng cách echo `submitted` values từ server +
    remount `<form>` qua `key={attempt}`.
  - Seed 8 location tag mẫu đa category.
  - Verify qua trình duyệt thật + kiểm tra trực tiếp trong Postgres
    (`possible_duplicate_of` trỏ đúng tag gốc sau khi force-create).
    `lint`/`typecheck`/`build` pass. Committed vào `dev`, chưa merge
    `main`.
- **Hoàn thiện M01 (travelers + xoá trip) và bắt đầu M02 (itinerary)**,
  theo yêu cầu "tiếp tục hoàn thiện M01 và start M02":
  - M01: `Traveler` CRUD (thêm/xoá người tham gia trên trip detail, chỉ chủ
    sở hữu), trang xác nhận xoá trip riêng (`/trips/[tripId]/delete`, không
    dùng `window.confirm` vì tool automation bị chặn dialog gốc và UX chủ
    động hơn cho người dùng thật).
  - M02: `itinerary.service.ts` + section Itinerary trên trang chi tiết
    trip — thêm/xoá item theo ngày + giờ (native `<input type="time">`,
    neo về ngày tham chiếu 1970-01-01 vì item chưa có ngày lịch thật), tự
    sắp xếp theo giờ trong từng ngày. Form thêm item có select chọn từ
    `LocationTag` có sẵn (`listTagsForPicker`) — nối trực tiếp vào Tag &
    Tip Library vừa xây, tránh gõ tay tên địa điểm trùng lặp ngay từ lúc
    lập lịch trình.
  - **Không làm** kéo-thả thật (chỉ nhập ngày/giờ + tự sắp xếp) và cảnh báo
    travel-time/giờ mở cửa — ghi rõ trong mục "Chưa làm" của M02, cân nhắc
    kỹ trước khi thêm thư viện DnD ở vòng sau.
  - Debug đáng chú ý: nhiều lần click qua công cụ automation (browser tool)
    không kích hoạt được nút/ô nhập dù toạ độ và `find` đều đúng — xác minh
    đây là hạn chế của công cụ test, không phải bug app, bằng cách gọi
    `element.click()`/set value trực tiếp qua JS và bằng `form_input`; tính
    năng hoạt động đúng khi kiểm tra theo cách đó.
  - Verify qua trình duyệt thật (kết hợp click UI + JS khi cần): thêm/xoá
    traveler; thêm 2 itinerary item (1 có link tag, 1 không) → đúng thứ tự
    theo giờ; xoá item; xoá trip → biến mất khỏi dashboard và Postgres.
    `lint`/`typecheck`/`build` pass. Committed vào `dev`, chưa merge
    `main`.
- **Map Planner (M03)**, theo yêu cầu "Map Planner (M03) đi":
  - `LocationTag` thêm `latitude`/`longitude` (migration), form tạo tag ở
    `/tags` thêm 2 ô nhập toạ độ tuỳ chọn (`type="number" step="any"`) kèm
    hint giải thích tác dụng (hiện trên Map Planner).
  - `src/features/map/geo.ts` (rule-based, không AI): Haversine tính khoảng
    cách giữa 2 điểm; `detectBacktrack()` so quãng đường thực tế trong ngày
    với quãng đường theo heuristic nearest-neighbor — lệch quá
    `BACKTRACK_RATIO_THRESHOLD = 1.3` (và ≥3 điểm có toạ độ) thì coi là "có
    thể đang đi vòng".
  - `src/features/map/trip-map.tsx` + `trip-map-loader.tsx`: bản đồ Leaflet
    - OpenStreetMap (chọn theo yêu cầu người dùng — free, không cần API
      key), marker màu theo ngày, popup hiện tên/ngày/giờ/trust-tier. Phải
      tách riêng file `"use client"` chỉ để gọi `next/dynamic(..., {ssr:
false})` vì không gọi được `ssr:false` trực tiếp trong Server Component.
  - Trang chi tiết trip: card "Map Planner" mới, lọc itinerary item có tag
    đã gắn toạ độ → marker; hiện cảnh báo "Ngày N có thể đang đi vòng" theo
    từng ngày qua `detectBacktrack`.
  - `prisma/seed.ts`: đổi `seedLocationTag` từ "bỏ qua nếu đã tồn tại" sang
    upsert-cập-nhật, và thêm toạ độ thực tế gần đúng cho cả 8 tag mẫu (Đà
    Nẵng, Hà Nội, Hội An, Hạ Long, Đà Lạt, TP.HCM) để Map Planner có dữ liệu
    ngay khi seed, không phải nhập tay mới thấy được tính năng.
  - **Không làm**: gom điểm theo khu vực/geo-clustering thật (mục 6a) — mới
    dừng ở cảnh báo đi vòng theo ngày; chưa cảnh báo giờ mở cửa; chưa có
    UI chọn toạ độ bằng cách click trên bản đồ (chỉ nhập số tay); model
    `Place` trong schema vẫn chưa dùng tới.
  - Debug đáng chú ý (tốn nhiều thời gian nhất module này): trong lúc test
    qua trình duyệt thật, mọi lần submit form login/tạo trip đều gọi nhầm
    `logoutAction()` phía server (thấy rõ qua log dev server:
    `POST /en/trips/new 200 ... └─ ƒ logoutAction() in 4ms`). Ban đầu nghi
    do HMR cũ làm lệch Server Action ID, sau nghi do Chrome cache HTTP ở
    `/login` — cả hai đều sai. Nguyên nhân thật: script test dùng selector
    toàn trang `document.querySelector('button[type="submit"]')`, và khi
    user đã đăng nhập, selector này khớp nhầm vào nút "Đăng xuất" của
    `SiteHeader` (cũng `type="submit"`, nằm trước mọi form của trang trong
    DOM) thay vì nút submit của form đang test. Sửa bằng cách scope selector
    vào đúng form: `inputElement.closest('form').querySelector('button[type="submit"]')`.
    Sau khi sửa, toàn bộ luồng test (tạo trip, thêm itinerary item gắn tag,
    hiện bản đồ, cảnh báo đi vòng) chạy đúng ngay lần đầu.
  - Verify qua trình duyệt thật với dữ liệu thật trong Postgres: tạo trip
    "Đà Nẵng cuối tuần", thêm 3 itinerary item gắn tag có toạ độ thật →
    bản đồ hiện đúng 3 marker đúng vị trí, popup đúng tên/giờ/trust-tier,
    cảnh báo "Ngày 1 có thể đang đi vòng" hiện đúng khi thứ tự điểm bất hợp
    lý. Xoá trip test sau khi xong để không để lại data rác.
    `lint`/`typecheck`/`build` pass. Committed vào `dev`, chưa merge
    `main`.
- **Đổi font UI sang Inter (M14)**, theo yêu cầu "đổi font chữ thành chữ
  modern UI hay dùng và phù hợp đa ngôn ngữ sau này như En, JA, CN": xem
  chi tiết ở mục [M14](#m14--i18n--ui-polish) — gồm cả fix bug
  `--font-sans` tự tham chiếu khiến font trước đó chưa từng áp dụng đúng.
  Verify qua browser thật (`getComputedStyle`, chữ có dấu tiếng Việt hiện
  đúng nét). Committed vào `dev`, sau đó **đã merge vào `main`** theo xác
  nhận "test xong, merge dev vào main đi" của user (gộp chung với M03 và
  phần tag-screen redesign bên dưới trong cùng 1 lần merge).
- **Tách màn hình tạo tag (M11)**, theo yêu cầu "Create tag screen nên
  làm lại và từ màn hình list a tag sẽ tổ chức button create tag sao cho
  hợp lý nhất": xem chi tiết ở mục [M11](#m11--tag--tip-library). Verify
  qua browser thật: tạo/xoá tag test trên `/tags/new` để xác nhận luồng
  dedup vẫn đúng; logout rồi vào `/tags/new` → redirect đúng callbackUrl;
  empty-state "Tạo tag này" prefill đúng từ khoá đã tìm.
  `lint`/`typecheck`/`build` pass. Committed + merge vào `main` cùng đợt
  với 2 mục trên.
- **Creator Profile — Phase 1 (M09)**, theo yêu cầu "làm thêm tính năng
  profile, click vào xem được profile như 1 thẻ hội viên, ghi nhận các
  đóng góp": xem chi tiết ở mục [M09](#m09--reputation-engine).
  - Thay placeholder `/creators/[creatorId]` bằng trang thật: "thẻ hội
    viên" (avatar chữ cái đầu, tên, ngày tham gia) + 4 ô thống kê đóng
    góp — tất cả đếm thật từ Postgres, không mock: số trip đã tạo, số
    location tag đã thêm, tổng `citeTrustScore` cộng dồn trên các tag đó,
    số comment (đúng 0 vì tính năng comment chưa xây — số liệu vẫn thật).
  - Gắn link tới profile ở mọi chỗ đang hiện tên chủ sở hữu: tên mình ở
    `SiteHeader`, "by {name}" trên card trip trang chủ, "by {name}" trên
    card tag `/tags`, "Created by {owner}" ở trang chi tiết trip.
  - Debug đáng chú ý: card trip ở trang chủ vốn bọc toàn bộ card trong 1
    `<Link>` — thêm link riêng cho tên chủ sở hữu bên trong sẽ tạo `<a>`
    lồng `<a>`, không hợp lệ HTML. Xử lý bằng pattern "stretched link"
    (xem Ghi chú kỹ thuật ở mục M09).
  - Verify qua browser thật với dữ liệu thật: xem profile "Linh Creator"
    → đúng 3 trip / 4 tag / 0 comment / 49 điểm tin cậy (khớp tổng
    `citeTrustScore` thật của 4 tag seed: 14+22+5+8); xem profile
    "TripBase Demo" → đúng 2 trip / 4 tag / 0 comment / 3 điểm; test locale
    vi → toàn bộ nhãn dịch đúng, format ngày `dd/mm/yyyy`; test
    `creatorId` không tồn tại → 404 đúng. `lint`/`typecheck`/`build` pass.
    Committed vào `dev`.
  - Lưu ý quy trình: bước cuối lỡ commit thẳng vào `main` (do sau lần
    merge trước, repo còn đang ở nhánh `main`) — phát hiện trước khi
    push, xử lý bằng cherry-pick commit sang `dev` rồi `git reset --hard
origin/main` để đưa `main` về đúng trạng thái đã push trước đó,
    không có gì rò rỉ lên `origin/main`.
- **Edit hồ sơ + avatar upload + sở thích du lịch (M09 Phase 2)**, theo
  yêu cầu "thiết kế profile icon chuẩn đi, cho phép update 1 số thông
  tin. Điền sở thích liên quan du lịch này kia nữa. Để làm cơ sở
  matching, suggestion sau này":
  - Hỏi lại user hướng làm avatar (emoji / upload local disk / URL) do
    mỗi hướng có đánh đổi hạ tầng khác nhau — user chọn **upload ảnh
    thật, lưu local disk**.
  - Schema: `User` thêm `bio`, `travelStyle`, `budgetLevel`,
    `travelInterests` (migration `add_profile_fields`).
  - `src/server/storage/avatar.ts`: lưu file vào
    `public/uploads/avatars/`, validate type/size, dọn file cũ sau khi
    lưu file mới; Docker có volume riêng để không mất ảnh khi rebuild.
  - `next.config.ts`: `serverActions.bodySizeLimit: "5mb"` (mặc định 1MB
    của Next.js không đủ cho upload ảnh).
  - Trang `/creators/[creatorId]/edit` (gate chủ sở hữu ở cả UI lẫn
    Server Action) — form avatar/tên/bio/phong cách/ngân sách/sở thích
    (checkbox đa chọn, 10 mục cố định). Trang profile hiện avatar thật
    (fallback chữ cái đầu tên), bio, và badge sở thích; nút "Edit
    profile" chỉ hiện với chính chủ.
  - Thêm 2 shadcn component còn thiếu: `Checkbox`, `Textarea`.
  - Verify qua trình duyệt thật, dữ liệu thật: upload ảnh test (màu hồng
    riêng biệt) → hiện đúng ngay trên card, file cũ trên đĩa bị xoá sau
    khi lưu file mới (kiểm tra trực tiếp thư mục), DB có đúng path/bio/
    travel_style=BACKPACKER/travel_interests={BEACH,FOOD}; upload file
    `.txt` giả dạng ảnh → bị chặn đúng ("Unsupported image format"),
    không ghi gì xuống đĩa/DB; vào thẳng URL edit của người khác trong
    khi đang đăng nhập user khác → bị redirect về trang profile (không
    lộ form edit); test locale vi → toàn bộ nhãn, dropdown, checkbox
    dịch đúng. Xoá file test + reset dữ liệu test sau khi xong.
    `lint`/`typecheck`/`build` pass.
- **Rà soát nhánh cộng sự + hoàn thiện Trip Builder/Itinerary (M01/M02)**,
  theo yêu cầu "check out vs branch mới, rồi tìm cách kiểm tra và merge
  vào branch dev, rồi đẩy vào main":
  - Phát hiện nhánh `feature/trip-builder-itinerary` trên GitHub **không
    phải do tôi tạo** — do cộng sự (`phamhuuphuc08`) push, tách từ commit
    cũ (`edeb4e3`, ngay sau bản M01 đầu tiên), độc lập xây tiếp Trip
    Builder + Itinerary theo hướng riêng, không hay biết các module đã
    làm thêm trên `dev` từ đó tới giờ (Tag & Tip, Map Planner, đổi font,
    redesign tạo tag, Creator Profile). Migration Prisma của 2 nhánh rẽ
    khác nhau từ cùng gốc → **không** merge Git trực tiếp được (sẽ vỡ
    lịch sử migration, có nguy cơ đè field của 1 trong 2 bên).
  - Báo tình huống cho user, hỏi hướng xử lý — user chọn **rà soát và
    merge có chọn lọc, ưu tiên những gì đã có trên `dev`**.
  - Đã mang sang `dev` (viết lại theo đúng cấu trúc code hiện tại, không
    copy nguyên file của nhánh kia): `Trip.travelerCount`/`budgetTarget`/
    `pace`/`travelStyle` (Trip Builder đầy đủ hơn theo mục 4 của spec —
    xem chi tiết ở mục [M01](#m01--trip-builder)); `ItineraryItem.title`/
    `sortOrder`/`createdAt`/`updatedAt` (xem mục
    [M02](#m02--itinerary--smart-timeline)). Gộp chung 1 migration
    `add_trip_builder_and_itinerary_fields`.
  - **Cố ý không mang sang**: `itinerary-form.tsx`/`itinerary-timeline.tsx`/
    `delete-trip-button.tsx` của nhánh kia — khác kiến trúc với bản hiện
    tại (không liên kết Tag & Tip Library, dùng `datetime-local` thay vì
    giờ-trong-ngày, có sửa item tại chỗ mà bản hiện tại chưa có) — giữ
    nguyên UI/luồng hiện tại của `dev` theo đúng lựa chọn "ưu tiên dev"
    của user; ý tưởng "sửa item tại chỗ" ghi lại như 1 việc chưa làm ở
    mục Chưa làm của M02 để cân nhắc sau, không bỏ qua hẳn.
  - Verify qua trình duyệt thật + Postgres thật: tạo trip mới với đủ 4
    người/20.000.000đ/nhịp độ Thong thả/style Ẩm thực+Thiên nhiên → hiện
    đúng ngay dưới tiêu đề trip (cả 2 locale vi/en); mở lại form sửa →
    tất cả field pre-fill đúng giá trị đã lưu; thêm itinerary item có
    `title` "Lặn ngắm san hô" → hiện đúng làm nhãn chính trong danh sách;
    kiểm tra trực tiếp qua `psql` khớp 100% với dữ liệu đã nhập. Xoá dữ
    liệu test sau khi xong. `lint`/`typecheck`/`build` pass.
  - Commit vào `dev`, sau đó merge `dev` vào `main` theo đúng yêu cầu của
    user trong cùng chuỗi thao tác này (không phải xác nhận riêng sau).
- **Ghi nhận nhánh cộng sự đã merge + xoá nhánh**, theo yêu cầu "merge và
  xoá đi": dùng `git merge -s ours` để đánh dấu
  `feature/trip-builder-itinerary` là đã merge trong lịch sử Git (không
  áp lại nội dung file thô — phần giá trị đã được rà soát/viết lại thủ
  công ở bước trên), verify `git diff` giữa các commit trước/sau đều
  rỗng (cây file không đổi gì thêm), rồi xoá nhánh đó trên GitHub
  (`git push origin --delete`).
- **Budget Board (M04)**, theo yêu cầu "OK code tiếp đi" (chọn module P0
  còn trống tiếp theo, gắn liền với `Trip.budgetTarget` vừa thêm ở M01):
  xem chi tiết ở mục [M04](#m04--budget-board). Migration
  `add_expense_note_and_created_at`. Verify qua trình duyệt thật +
  Postgres thật: tạo trip 5.000.000đ, 2 traveler, 1 khoản chi 2.000.000đ
  chia đôi → tổng/còn lại/chia tiền đều đúng; xoá khoản chi đúng, không
  ảnh hưởng traveler. `lint`/`typecheck`/`build` pass. Test data đã xoá.
- **Đổi màu thương hiệu + bố cục trang chủ tham khảo shigoto.mhlw.go.jp
  (M14)**, theo yêu cầu "tham khảo giao diện, bố cục, màu sắc... cách
  phân bố layout" của trang job tag (Bộ Y tế – Lao động – Phúc lợi Nhật
  Bản): xem chi tiết ở mục [M14](#m14--i18n--ui-polish). Đã xem trực
  tiếp trang tham khảo qua trình duyệt (không chỉ đọc mô tả) để lấy đúng
  màu chủ đạo (`#0568D3`) và các pattern bố cục (lưới icon điều hướng
  nhanh, tiêu đề section 2 phần). Verify qua trình duyệt thật cả light/
  dark mode trên nhiều trang (Home, Tag & Tip, Creator Profile) — màu
  đổi nhất quán khắp app chỉ qua token dùng chung, không sót chỗ nào còn
  màu cũ. `lint`/`typecheck`/`build` pass.

### 2026-09-07

- **Trip Story (M12 Phase 1)**, theo yêu cầu "thêm 1 tính năng mà bạn
  cho rằng cực kỳ độc đáo và hút user trẻ. Những bạn muốn di chuyển và
  rất thích viết story của mình": xem chi tiết ở mục
  [M12](#m12--travel-memory). Không phải diễn giải đúng nghĩa đen của
  spec cho Travel Memory — đây là ý tưởng riêng: định dạng "story" kiểu
  Instagram/TikTok Stories cho mỗi trip, viết tay hoàn toàn (không AI).
  - Model `StorySlide` (migration `add_story_slides`), card "Trip
    Story" trên trang chi tiết trip, trang xem full-screen
    `/trips/[tripId]/story` (tự chuyển đoạn 6s, chạm/phím mũi tên để
    điều hướng, nút Share copy link).
  - Quyết định sản phẩm đáng chú ý: story của trip PUBLIC xem được
    **không cần đăng nhập** (nới lỏng có chủ đích so với quy tắc chung
    "plan public vẫn cần đăng nhập" — vì mục tiêu của tính năng này là
    chia sẻ link mở ra xem ngay, giống 1 link Instagram/TikTok story
    thật); trip PRIVATE vẫn chỉ chủ sở hữu xem được.
  - Debug đáng chú ý: giữa lúc test, thao tác click/gõ phím qua công cụ
    automation đột nhiên mất tác dụng — nguyên nhân là cửa sổ Chrome bị
    mất focus cấp hệ điều hành (nghi do lệnh khởi động lại Docker Desktop
    trước đó làm nổi cửa sổ khác lên trên). Xử lý bằng cách chuyển hẳn
    sang thao tác trực tiếp qua JS (native setter + dispatch event,
    `.click()`, `form.requestSubmit()`) — xác nhận đây là hạn chế môi
    trường test, không phải bug của tính năng.
  - Verify qua trình duyệt thật + Postgres thật: tạo 2 slide (bìa +
    ngày 1, 2 tông màu khác nhau) → hiện đúng cả thumbnail lẫn story
    viewer; tự chuyển đoạn đúng giờ; điều hướng chạm đúng; xoá đúng 1
    slide; quy tắc truy cập PUBLIC-không-cần-login và PRIVATE-vẫn-chặn
    đều đúng; xoá hết slide → hiện đúng màn "Chưa có story".
    `lint`/`typecheck`/`build` pass. Xoá dữ liệu test sau khi xong.

### 2026-09-11

- **Hoàn thiện M02 — Smart Timeline + collaboration cơ bản**:
  - Bổ sung sửa activity, Drag & Drop, overlap warning, short-gap warning,
    travel distance/time warning và giữ toàn bộ logic cũ của Timeline.
  - Chuyển `startTime`/`endTime` sang timestamp thật theo ngày Trip; migration
    backfill dữ liệu cũ neo ở năm 1970.
  - `LocationTag` thêm `openingHours`; form Tag & Tip nhập giờ mở/đóng cửa;
    Timeline cảnh báo activity ngoài giờ mở cửa.
  - Thêm inline dedup khi tìm/chọn LocationTag trong itinerary; chuẩn hoá
    thuật toán fuzzy dedup để dùng chung với flow tạo tag.
  - Thêm Vote UP/DOWN + Comment trên từng activity, cùng i18n vi/en.
  - Khôi phục 2 migration lịch sử
    `20260904081248_add_trip_builder_fields` và
    `20260904093245_add_itinerary_fields`; loại migration reconciliation
    trùng; không reset database.
  - `prisma format`, `prisma validate`, `prisma generate` và
    `npm run typecheck` pass trước commit. Commit
    `fbfaa93 feat: complete M02 itinerary collaboration and scheduling`
    đã push lên `dev`.

### 2026-09-14

- **Đóng các edge case còn lại của M02 trước khi tiếp tục M03**:
  - `trip.service.updateTrip`: khi đổi `Trip.startDate`, tự đồng bộ ngày thật
    của toàn bộ `ItineraryItem.startTime/endTime` theo `day`, giữ nguyên giờ;
    Trip + itinerary được update trong cùng Prisma transaction.
  - Hardening Vote/Comment: PUBLIC cho user đăng nhập tương tác; PRIVATE/
    FRIENDS yêu cầu owner hoặc `Collaborator`; xóa comment vẫn chỉ dành cho
    tác giả comment hoặc chủ Trip.
  - `typecheck` của patch quyền ban đầu phát hiện đúng 1 lỗi type do repository
    chỉ expose `comment.item.trip.ownerId`; sửa lời gọi từ
    `comment.item.trip.id` sang `comment.item.tripId`. Các lần `npm run typecheck`
    tiếp theo trong đợt M06/M07 ngày 2026-09-16 đã chạy sạch.
  - Cập nhật Dev Plan: M02 chuyển sang ✅ feature-complete cho MVP; M03 là
    module P0 tiếp theo cần tiếp tục, ưu tiên **Map Picker** (click bản đồ để
    lấy lat/lng) rồi mới làm geo-clustering.

### 2026-09-15

- **M07 — Invite, collaborator và permission nền:**
  - Chốt mô hình quyền: OWNER lấy từ `Trip.ownerId`; `Collaborator` chỉ lưu
    EDITOR/VIEWER; không thêm OWNER vào enum collaborator và không tạo
    `TripMember` trùng chức năng.
  - Thêm `TripInvitation` + `InvitationStatus`, repository/service cho invite,
    accept/decline/reopen; migration `20260915044309_add_trip_invitations`.
  - Thêm UI mời qua email, `/invitations`, accept/decline, quản lý collaborator
    (đổi role, xoá thành viên) và permission service dùng chung.
  - Tích hợp quyền vào Trip/M02/M04: OWNER/EDITOR được chỉnh, VIEWER chỉ xem;
    OWNER vẫn là người duy nhất quản lý thành viên và xoá Trip.
  - Header thêm mục "Lời mời" + badge pending invitation; user xác nhận test
    badge thành công.
  - Xử lý edge case invitation `ACCEPTED` còn sót sau khi collaborator bị xoá:
    re-invite sẽ reopen record nếu không còn collaborator thay vì báo đã chấp
    nhận mãi.

### 2026-09-16

- **M06 — Checklist hoàn tất MVP:**
  - Tạo repository/service/actions/UI `ChecklistManager`: CRUD, due date,
    assignee, Done/Pending.
  - Assignee chỉ được là owner hoặc collaborator của đúng Trip.
  - Permission backend + UI: OWNER/EDITOR đầy đủ thao tác; VIEWER chỉ xem.
  - User test thành công cả 3 vai trò:
    `OWNER → thêm/sửa/xoá/check Done/giao việc`,
    `EDITOR → thêm/sửa/xoá/check Done/giao việc`,
    `VIEWER → chỉ xem`.
  - M06 chuyển sang ✅ MVP; preset checklist được dời thành nâng cấp sau MVP.

- **M07 — Share Link Phase 1 + page-level permission:**
  - Tạo `share-link.repository.ts`, `share-link.service.ts`,
    `ShareLinkManager`, Server Actions tạo/revoke và i18n vi/en.
  - Token ngẫu nhiên bằng `randomBytes(24)`; hỗ trợ VIEW/EDIT, revoke và
    expiry (Never/1d/7d/30d).
  - Trip Detail OWNER load danh sách link từ DB; UI copy/revoke và giữ trạng
    thái sau refresh.
  - Thêm `/share/[token]` → resolve token → redirect sang
    `/trips/[tripId]?shareToken=...`.
  - `permission.service.ts` + `trip.service.ts` nhận `shareToken`: VIEW link
    hợp lệ có thể mở trip riêng tư; EDIT link yêu cầu đăng nhập để có
    page-level `canEdit`; revoked/expired/trip-mismatch bị vô hiệu.
  - Sửa `checklist.service.ts` nhận token ở luồng view/edit khi load trang;
    lỗi Share Link trên PRIVATE trip được xử lý và user xác nhận hết lỗi,
    test thành công.
  - `npm run typecheck` được user chạy nhiều lần trong chuỗi thay đổi và đều
    kết thúc sạch ở trạng thái hiện tại.
  - **Còn lại trước khi đóng M07:** nối `shareToken` vào Server Actions mutate
    của Trip/Itinerary/Budget/Checklist + giữ token qua redirect/internal link,
    rồi test revoke/expiry end-to-end cho Edit Link.

### 2026-09-18

- **Reconcile `origin/dev` + `feature/m07-checklist-edit-link` + local WIP:**
  - `dev` local đã bị lùi 6 commit so với `origin/dev` (teammate push thẳng,
    không qua PR) và có 1 branch `feature/m07-checklist-edit-link` chưa mở
    PR (booking vault + checklist edit-link). Fast-forward `dev` rồi merge
    branch đó vào — không conflict.
  - Code WIP local (`itinerary-list.tsx`, `vote.repository.ts`,
    `discussion.service.ts`) trùng đúng tính năng itinerary
    reorder/vote/comment mà `origin/dev` đã có sẵn
    (`itinerary-sortable-timeline.tsx`), do 2 bên làm song song không biết
    nhau. Bản local cũ hơn: chỉ owner mới reorder được (không hỗ trợ
    EDITOR của hệ phân quyền mới), chỉ reorder trong 1 ngày, không có
    travel warning/opening-hours check. Quyết định (user xác nhận): giữ
    bản `origin/dev`, xoá 3 file trùng của local.
  - Giữ lại từ local WIP vì đúng/có giá trị: migration
    `20260907224632_add_vote_unique_constraint` (`@@unique([itemId,
    userId])` trên `Vote`, khớp với logic `voteItineraryItem` đã giả định
    sẵn), component `BudgetChart` (donut chart CSS thuần, gắn vào mục
    Budget thay bảng badge cũ).
  - Dọn `countItineraryItemsInDay` (dead code chỉ được gọi bởi nhánh local
    đã bỏ) và doc-comment lỗi thời trong `comment.repository.ts` (nói M06/
    M07 chưa build — cả hai đã xong).
  - Verify: `npm run typecheck` sạch, `npm run build` thành công, `npm run
    lint` còn 5 lỗi nhưng đều thuộc code `origin/dev` không nằm trong phạm
    vi lần reconcile này (`itinerary-sortable-timeline.tsx`,
    `trip-map.tsx`, `share-link-manager.tsx`, `create-tag-form.tsx`).
  - Thêm mục [Quy trình Git](#quy-trình-git) ở đầu tài liệu để tránh lặp
    lại tình huống 2 người viết trùng tính năng trên 2 branch tách biệt.

- **Fix React lint errors trước khi chốt Booking Vault** (commit `1231b80`):
  - Sửa đồng bộ state của itinerary drag/drop không còn `setState` trực tiếp
    trong `useEffect`.
  - Sửa Map Planner khởi tạo viewport mà không gọi `setState` đồng bộ từ effect.
  - Sửa Share Link không gọi `Date.now()` trực tiếp trong render.
  - Sửa form tạo Tag/Tip đồng bộ toạ độ bằng remount theo `state.attempt`.
  - Verify lại: `npm run typecheck` pass; `npm run lint` không còn error,
    chỉ còn warning `_prevState`/`_formData` không liên quan.
- **M05 — Booking Vault private document upload** (commit `cc611f5`):
  - Hoàn thiện danh sách + CRUD booking trên Trip Detail.
  - Thêm private document upload cho PDF/JPG/PNG/WebP, giới hạn 8 MB.
  - File lưu tại `storage/bookings`; Docker dùng volume `booking_documents`.
  - Thêm protected API route kiểm tra permission trước khi mở tài liệu.
  - Dọn file cũ khi replace/remove/delete; giữ tương thích với `fileUrl`
    bên ngoài của booking cũ.
  - Tích hợp quyền VIEW/EDIT Share Link cho Booking Vault; user/token không có
    quyền bị chặn khi gọi route tài liệu.
  - Test thành công upload/open/replace/delete, định dạng hợp lệ/không hợp lệ,
    file >8 MB, VIEW/EDIT Link và unauthorized access.
