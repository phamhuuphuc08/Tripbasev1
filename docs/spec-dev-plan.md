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
| M01 | [Trip Builder](#m01--trip-builder)                            | P0      | ✅         | ✅      | 🟨  | 🟨         |
| M02 | [Itinerary / Smart Timeline](#m02--itinerary--smart-timeline) | P0      | ✅         | ✅      | 🟨  | 🟨         |
| M03 | [Map Planner](#m03--map-planner)                              | P0      | ✅         | ✅      | 🟨  | 🟨         |
| M04 | [Budget Board](#m04--budget-board)                            | P0      | ✅         | ✅      | 🟨  | 🟨         |
| M05 | [Booking Vault](#m05--booking-vault)                          | P1      | ✅         | ⬜      | ⬜  | ⬜         |
| M06 | [Checklist](#m06--checklist)                                  | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M07 | [Share & Permission](#m07--share--permission)                 | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M08 | [CopyPlan Engine](#m08--copyplan-engine)                      | P0      | ✅         | ⬜      | ⬜  | ⬜         |
| M09 | [Reputation Engine](#m09--reputation-engine)                  | P1      | ✅         | 🟨      | 🟨  | 🟨         |
| M10 | [Plan Marketplace / Explore](#m10--plan-marketplace--explore) | P1      | ✅         | 🟨      | 🟨  | 🟨         |
| M11 | [Tag & Tip Library](#m11--tag--tip-library)                   | P1      | ✅         | ✅      | ✅  | 🟨         |
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

- [ ] Explore/Saved vẫn là `PlaceholderScreen` — chưa có UI thật để đánh
      giá redesign trên các trang đó (Trip/Creator đã có UI thật)
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
- **Trạng thái:** 🟨 Đang làm (CRUD + travelers + xoá + ngân sách/sở thích/
  nhịp độ xong, chưa có Map/Budget board thật)

Đã làm:

- [x] Đọc chi tiết 1 trip thật từ DB (`getTripDetail`), có gate: plan không
      public + không phải chủ sở hữu → 404; plan public nhưng chưa đăng
      nhập → yêu cầu login (`/trips/[tripId]`)
- [x] Trip dashboard thật (`/trips`, yêu cầu đăng nhập) — danh sách trip của
      user, badge trạng thái + visibility, nút "Tạo trip mới"
- [x] Form tạo trip (`/trips/new`): tên, điểm đến, ngày bắt đầu/kết thúc
      (optional), visibility — `createTripAction` → redirect vào trip mới
- [x] Form chỉnh sửa (trên `/trips/[tripId]`, chỉ hiện cho chủ sở hữu):
      sửa mọi field ở trên + đổi trạng thái Ý tưởng/Đã lên lịch/Đã đi và
      visibility Riêng tư/Bạn bè-nhóm/Public — `updateTripAction`
      (`src/features/trip/{actions.ts,trip-form.tsx}`), có check ownership
      ở `trip.service.updateTrip` (defense-in-depth, UI đã gate trước)
- [x] `TripForm` dùng chung create/edit, shadcn `Select` (Base UI) —
      lưu ý: `Select.Value` không tự tra nhãn theo item như Radix, phải
      truyền render-prop map giá trị → nhãn dịch thủ công
- [x] Số người tham gia (`Traveler`): thêm/xoá trên trip detail (chỉ chủ sở
      hữu) — tên + độ tuổi tuỳ chọn, `addTravelerAction`/`removeTravelerAction`
      (`src/features/trip/traveler-form.tsx`, server component thuần vì
      không cần client state)
- [x] Xoá trip: trang xác nhận riêng `/trips/[tripId]/delete` (không dùng
      `window.confirm`), `deleteTripAction` — chỉ chủ sở hữu truy cập được
      (check bằng `getTripDetail` + `isOwner`, không phải `notFound` mặc định)
- [x] Verify qua trình duyệt thật: tạo trip → sửa status/visibility → lưu
      → xuất hiện đúng trên dashboard **và** trên search public ở Home;
      thêm/xoá traveler; xoá trip → về `/trips`, biến mất khỏi danh sách
      và DB (dữ liệu thật trong Postgres)
- [x] Số người dự kiến, ngân sách dự kiến, phong cách chuyến đi (4 tag cố
      định: Ẩm thực/Mua sắm/Văn hoá/Thiên nhiên), nhịp độ (Thong thả/Vừa
      phải/Dày lịch) — `Trip.{travelerCount,budgetTarget,travelStyle,pace}`
      (migration `add_trip_builder_and_itinerary_fields`), hiện ngay dưới
      tiêu đề trip. Đây là các field mục 4 của spec mà bản đầu tiên của
      M01 còn thiếu — coi thêm chi tiết ở mục "Rà soát nhánh cộng sự" trong
      Changelog.

Chưa làm:

- [ ] Ngân sách **thực chi** theo hạng mục (Budget board thật, `Expense`,
      M04) — `budgetTarget` ở trên chỉ là con số ước lượng lúc lập kế
      hoạch, chưa so sánh được với chi tiêu thật
- [ ] Badge "Verified by Author" khi chuyển sang "Đã đi" — cố ý chưa làm:
      cần bằng chứng tối thiểu (ảnh/booking) theo guardrail mục 13, phụ
      thuộc Travel Memory (M12) chưa tồn tại; hiện tự do đổi status không
      bị chặn nhưng field `verifiedByAuthor` luôn `false`

---

## M02 — Itinerary / Smart Timeline

- **Ưu tiên:** P0 · **Spec:** mục 4, 5, 6a
- **Code:** `src/features/itinerary/`, model `ItineraryItem`
- **Trạng thái:** 🟨 Đang làm (thêm/xoá item theo ngày+giờ xong, chưa có kéo
  thả/cảnh báo)

Đã làm:

- [x] `itinerary.service.ts`: `listItineraryItems`, `addItineraryItem`,
      `removeItineraryItem` (check ownership qua `trip.repository.findTripById`,
      cùng pattern với `trip.service`)
- [x] Section "Itinerary (Smart Timeline)" trên trang chi tiết trip: nhóm
      item theo `day`, sắp xếp theo `startTime` trong mỗi ngày; form thêm
      item (ngày, giờ bắt đầu/kết thúc, ghi chú) chỉ hiện cho chủ sở hữu,
      ai xem được trip thì xem được itinerary
- [x] **Liên kết với Tag & Tip Library (M11)**: form thêm item có select
      "Địa điểm/tip (tuỳ chọn)" liệt kê toàn bộ `LocationTag` hiện có
      (`listTagsForPicker`) — chọn 1 tag thay vì gõ tên tự do, tránh tạo
      trùng lặp ngay từ lúc lập itinerary (đúng tinh thần "lookup" của M11)
- [x] Verify qua trình duyệt thật: thêm 2 item (1 có link tag, 1 không) →
      hiện đúng thứ tự theo giờ trong đúng ngày, tag hiện icon + category +
      tên; xoá từng item → cập nhật đúng
- [x] `title` tuỳ chọn trên mỗi item (migration
      `add_trip_builder_and_itinerary_fields`) — đặt tên hoạt động tự do
      cho item không gắn tag (VD: "Ăn sáng ở khách sạn"); nếu vừa có
      `title` vừa có tag liên kết, `title` hiện làm nhãn chính, tag hiện
      phụ bên dưới nhỏ hơn. Cũng thêm `sortOrder`/`createdAt`/`updatedAt`
      vào model — `sortOrder` mới chỉ nằm trong schema (default 0), **chưa
      dùng để sắp xếp** (vẫn sort theo `day`+`startTime` như cũ), dành chỗ
      cho kéo-thả thật sau này.

Chưa làm:

- [ ] Kéo thả (drag-and-drop) — MVP hiện dùng form nhập ngày/giờ + tự sắp
      xếp theo `startTime`, **không phải** kéo thả thật; cần đánh giá có
      đáng thêm thư viện DnD hay không trước khi làm. Đã có sẵn cột
      `sortOrder` trong schema chờ dùng.
- [ ] Cảnh báo travel time/buffer, giờ mở cửa — cần dữ liệu toạ độ/giờ mở
      cửa (Place hoặc LocationTag) mà hiện chưa bắt buộc nhập
- [ ] Gợi ý dedup **ngay trong lúc gõ** tên địa điểm mới (mục 8.1) — hiện
      chỉ chọn từ danh sách có sẵn qua select, chưa có ô tự tạo tag mới
      ngay tại chỗ (phải qua `/tags` riêng)
- [ ] `startTime`/`endTime` chỉ lưu giờ-trong-ngày (anchor về 1970-01-01),
      chưa phải timestamp thật gắn với ngày cụ thể của trip — xem comment
      trong `src/features/itinerary/actions.ts`
- [ ] Sửa item đã tạo (hiện chỉ thêm/xoá)
- [ ] Vote/Comment trên từng item (model đã có, chưa có UI)

---

## M03 — Map Planner

- **Ưu tiên:** P0 · **Spec:** mục 4, 6a, 11
- **Code:** `src/features/map/`, model `LocationTag` (dùng lat/lng thay vì `Place`)
- **Trạng thái:** 🟨 Đang làm (bản đồ + cảnh báo đi vòng xong trên Trip Detail)

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
- [ ] Cảnh báo giờ mở cửa (opening hours) — `Place`/`LocationTag` chưa có
      trường giờ mở cửa được dùng ở đây
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
- **Trạng thái:** 🟨 Đang làm (CRUD + chia tiền cơ bản xong, chưa có
  Booking Vault liên kết)

Đã làm:

- [x] Thêm/xoá khoản chi trên trang chi tiết trip (chỉ chủ sở hữu), 8 hạng
      mục cố định (`src/features/budget/categories.ts`: Vé máy bay, Khách
      sạn, Ăn uống, Vé tham quan, Di chuyển, Mua sắm, Dự phòng, Khác) —
      cùng pattern "union cố định, coerce ở boundary" với các module khác
- [x] `Expense` thêm `note` (ghi chú tuỳ chọn) + `createdAt` (migration
      `add_expense_note_and_created_at`); `paidById` mặc định là chủ sở
      hữu trip (người duy nhất có quyền thêm hiện tại, chưa có form chọn
      người trả vì chưa có Share & Permission/M07)
- [x] Money View cơ bản (mục 11, rule-based không AI):
      `computeBudgetSummary` — tổng đã chi, so với `Trip.budgetTarget`
      (còn lại/vượt ngân sách), phân theo hạng mục, và **chia tiền cơ
      bản**: mỗi expense có `splitBetween` (tên các Traveler, không phải
      FK cứng — đúng thiết kế "lỏng" ở mục 12 của spec) được chia đều,
      cộng dồn theo tên ra tổng mỗi người phải trả. Đây là chia đều đơn
      giản, **không phải** thuật toán settle-up tối ưu (ai trả ai bao
      nhiêu để cân bằng số dư).
- [x] Debug đáng chú ý: phát hiện 3 nút "Xoá" khác nhau trên cùng trang
      chi tiết trip (traveler/itinerary/budget) từng dùng chung
      `aria-label` gần giống nhau ("Remove") — kịch bản test tự động bấm
      nhầm nút xoá traveler thay vì xoá expense. Sửa bằng cách thêm
      `removeButtonNamed` (interpolate tên/hạng mục cụ thể) cho cả 3 nút,
      vừa hết nhầm lẫn cho test tự động vừa tốt hơn cho accessibility
      (screen reader phân biệt được đang xoá cái gì).
- [x] Verify qua trình duyệt thật + Postgres thật: tạo trip ngân sách
      5.000.000đ, thêm 2 traveler (An, Binh), thêm 1 khoản chi 2.000.000đ
      chia cho cả 2 → hiện đúng "Đã chi 2.000.000 / Còn lại 3.000.000",
      đúng "An: 1.000.000 · Binh: 1.000.000"; xoá khoản chi (sau khi sửa
      aria-label) → đúng khoản chi biến mất, traveler không bị ảnh hưởng;
      kiểm tra trực tiếp qua `psql` khớp 100%. `lint`/`typecheck`/`build`
      pass.

Chưa làm:

- [ ] Sửa khoản chi đã tạo (hiện chỉ thêm/xoá)
- [ ] Chọn người trả (`paidById`) khác chủ sở hữu — cần Share & Permission
      (M07) để có người khác ngoài chủ sở hữu thao tác trên trip trước
- [ ] Thuật toán settle-up ("ai nợ ai bao nhiêu", tối thiểu hoá số giao
      dịch) — hiện chỉ có tổng mỗi người phải trả, chưa tính chênh lệch
      giữa người trả tiền thật và người nợ
- [ ] Upload hoá đơn/receipt cho từng khoản chi — liên quan Booking Vault
      (M05), chưa xây

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

- **Ưu tiên:** P1 · **Spec:** mục 3, 7, 8, 9, 13, 15
- **Code:** `src/app/[locale]/(app)/creators/[creatorId]/{page,edit/page}.tsx`,
  `src/features/profile/`, `src/server/services/creator-profile.service.ts`,
  `src/server/repositories/comment.repository.ts`,
  `src/server/storage/avatar.ts`, model `CreatorReputation`, `Citation`,
  `PlanCopy`
- **Trạng thái:** 🟨 Phase 1 + Phase 2 xong (profile card + số liệu đóng
  góp thật + edit hồ sơ/avatar/sở thích du lịch), chưa làm phần
  scoring/CopyPlan (2026-09-04)

Đã làm (Phase 1 — theo yêu cầu "làm thêm tính năng profile, click vào xem
được profile như 1 thẻ hội viên, ghi nhận các đóng góp"):

- [x] Trang `/creators/[creatorId]` thật thay cho placeholder cũ — style
      "thẻ hội viên" (gradient, avatar chữ cái đầu tên, "Tham gia từ {ngày}")
  - lưới 4 ô thống kê đóng góp
- [x] `getCreatorProfile(userId)` — số liệu **thật, đếm trực tiếp từ DB**,
      không mock: số trip đã tạo (`Trip.count` theo `ownerId`), số location
      tag đã thêm (`LocationTag.count` theo `ownerId`), tổng `citeTrustScore`
      cộng dồn trên các tag đó ("Điểm tin cậy tag" — chỉ là phép cộng đơn
      giản trên field có sẵn, **không phải** công thức Cite Trust Score có
      trọng số ở mục 8), và số comment (`Comment.count` theo `userId` — luôn
      ra 0 vì tính năng comment (M06/M07) chưa xây, số liệu vẫn thật chứ
      không phải giả)
- [x] Gắn link tới profile ở mọi nơi đang hiện tên chủ sở hữu: tên user
      đăng nhập ở `SiteHeader`, "by {name}" trên card trip ở trang chủ, "by
      {name}" trên card tag ở `/tags`, "Created by {owner}" ở trang chi tiết
      trip — dùng `t.rich("by"/"meta", {link: ...})` để chỉ phần tên là link,
      không phải cả câu
- [x] Trang public, ai cũng xem được (không gate đăng nhập) — chỉ lộ số
      liệu tổng hợp, không lộ nội dung trip riêng tư nào

Đã làm (Phase 2 — theo yêu cầu "thiết kế profile icon chuẩn đi, cho phép
update 1 số thông tin, điền sở thích liên quan du lịch, để làm cơ sở
matching, suggestion sau này"):

- [x] Avatar ảnh thật — chọn hướng **upload ảnh, lưu local disk** (không
      URL/emoji) theo lựa chọn của user. `src/server/storage/avatar.ts`:
      validate mime type (jpeg/png/webp/gif) + giới hạn 4MB, ghi file vào
      `public/uploads/avatars/<userId>-<timestamp>.<ext>`, Next.js tự
      serve như static file, không cần route riêng. Dọn file avatar cũ
      sau khi lưu file mới thành công (best-effort, không throw).
  - `next.config.ts`: nâng `serverActions.bodySizeLimit` lên `5mb` (mặc
    định 1MB không đủ cho ảnh).
  - Docker: thêm named volume `avatar_uploads:/app/public/uploads` để
    ảnh không mất khi rebuild image.
- [x] `User` thêm field `bio`, `travelStyle`, `budgetLevel`,
      `travelInterests` (migration `add_profile_fields`) — union cố định
      ở app-layer (`src/features/profile/preferences.ts`), cùng cách làm
      với `LocationTag.category`, không phải DB enum, thêm lựa chọn mới
      không cần migration.
  - `TRAVEL_STYLES`: Solo/Couple/Family/Group/Backpacker.
  - `BUDGET_LEVELS`: Tiết kiệm/Tầm trung/Cao cấp.
  - `TRAVEL_INTERESTS`: 10 mục cố định (Biển, Núi, Thành phố, Ẩm thực,
    Văn hoá & lịch sử, Mạo hiểm, Giải trí đêm, Nghỉ dưỡng, Chụp ảnh,
    Phượt tiết kiệm) — multi-select qua checkbox.
- [x] Trang `/creators/[creatorId]/edit` — chỉ chủ sở hữu mới vào được
      (redirect về login nếu chưa đăng nhập, redirect về trang profile
      nếu không phải chính mình — check lại lần 2 ngay trong
      `updateProfileAction`, không chỉ chặn ở UI). Form: avatar (có
      preview qua `URL.createObjectURL`), tên, bio (textarea, tối đa 280
      ký tự), 2 select phong cách/ngân sách (tuỳ chọn), lưới checkbox sở
      thích.
- [x] Trang profile hiện thêm: ảnh đại diện thật (fallback về chữ cái
      đầu tên nếu chưa có), bio, và badge "Sở thích du lịch" (phong
      cách + ngân sách + các sở thích đã chọn) — nút "Edit profile" chỉ
      hiện với chính chủ.
- **Chỉ dừng ở thu thập dữ liệu có cấu trúc** — chưa có bất kỳ thuật
  toán matching/suggestion nào đọc `travelInterests`/`travelStyle`/
  `budgetLevel`; đây là nền tảng dữ liệu để làm việc đó sau, chưa phải
  tính năng matching thật.

Chưa làm (vẫn thuộc M09 gốc — cần Reputation Engine đầy đủ):

- [ ] Công thức CopyPlan Score (mục 7) — background job, không real-time
- [ ] Công thức Cite Trust Score có trọng số đầy đủ (mục 8) — hiện chỉ có
      tổng đơn giản, xem "Đã làm" ở trên
- [ ] Creator Reputation tổng hợp có trọng số theo plan mới nhất
      (`CreatorReputation` model vẫn chưa được ghi bởi bất kỳ service nào)
- [ ] Scoring job scheduler (cron/queue — mục 15)
- [ ] Guardrail chống gian lận (mục 13): wash-trading cluster, self-cite
- [ ] Thuật toán matching/suggestion dựa trên sở thích du lịch — mới có
      dữ liệu, chưa có logic dùng nó
- [ ] Resize/nén ảnh avatar phía server (hiện lưu nguyên file gốc, giới
      hạn duy nhất là 4MB)

Ghi chú kỹ thuật:

- Card trip ở trang chủ trước đó bọc toàn bộ card trong 1 `<Link>` — thêm
  link riêng cho tên chủ sở hữu bên trong sẽ tạo `<a>` lồng `<a>`, không
  hợp lệ HTML. Xử lý bằng pattern "stretched link": `<Link>` phủ
  `absolute inset-0` làm nền cho cả card, nội dung phía trên đặt
  `pointer-events-none`, chỉ bật lại `pointer-events-auto` ở đúng link
  tên chủ sở hữu.
- Base UI `Select`/`Checkbox` không nhận `value=""` làm giá trị "chưa
  chọn" một cách gọn gàng — dùng sentinel string `"none"` (giống pattern
  đã có ở `itinerary-item-form.tsx` cho tag tuỳ chọn), coi `"none"` là
  `undefined` ở boundary của Server Action.
- `public/` được `next start` serve trực tiếp từ đĩa tại runtime (app
  này không dùng `output: "standalone"`), nên file ghi vào
  `public/uploads/avatars/` sau khi build/start vẫn được serve ngay lập
  tức ở `/uploads/avatars/<file>` — không cần route/API riêng để trả ảnh.

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
- **Trạng thái:** 🟨 Đang làm (lookup + dedup lõi xong; đã liên kết vào
  itinerary qua tag-picker từ M02 — chỉ chưa có gợi ý dedup ngay lúc gõ)

Đã làm:

- [x] Tách màn hình tạo tag ra `/tags/new` riêng (theo yêu cầu "Create tag
      screen nên làm lại") — không còn form chìm ở cuối trang list. Trang
      `/tags` có nút "Tạo tag" ở header (giống nút "Tạo trip" ở dashboard
      trips) và luôn trỏ tới `/tags/new`; trang đó tự redirect sang
      `/login?callbackUrl=/tags/new` nếu chưa đăng nhập (cùng convention
      với các link `/trips` trong `SiteHeader`, gate nằm ở route đích chứ
      không lặp lại ở từng nơi có link tới). Empty-state khi tìm không ra
      kết quả có nút "Tạo tag này" mang theo từ khoá vừa gõ để prefill
      sẵn tên trên `/tags/new`.

- [x] Trang `/tags` (public, không cần đăng nhập để xem/tìm) — search theo
      tên + filter theo category, card hiện icon, category badge, trust
      badge (🟢/🟡/⚪ theo `getTrustTier`), mô tả, chủ sở hữu
- [x] 7 category cố định cho UI (`src/features/tag-tip/categories.ts`):
      RESTAURANT, ATTRACTION, HOTEL, CAR_RENTAL, TRANSPORT, SIM, OTHER —
      đáp ứng yêu cầu lookup ăn uống/tham quan/hotel **và** support (thuê
      xe, di chuyển, SIM)
- [x] Rule-based dedup (`tag-dedup.service.ts`): Levenshtein similarity,
      so trong cùng category, ngưỡng `DUPLICATE_THRESHOLD = 0.72` — **chưa**
      thêm điều kiện bán kính toạ độ (spec mục 8.1 có nhắc, nhưng tag hiện
      chưa bắt buộc nhập lat/lng nên chưa áp dụng được ngay)
- [x] Tạo tag (`createTagAction`) → nếu nghi trùng, hiện cảnh báo + nút
      "Vẫn tạo mới"; nếu user vẫn tạo, set `possibleDuplicateOfId` trỏ về
      tag gốc — đúng guardrail mục 13 (không tính là nguồn độc lập)
- [x] Seed 8 location tag mẫu (đa category, vài cái có `citeTrustScore` >
      0 để demo đủ 3 trạng thái trust badge — điểm này hiện set tay qua
      seed, chưa có cơ chế tự tính, xem M09)
- [x] Verify qua trình duyệt thật: search + filter category đúng; gõ tên
      gần giống 1 tag đã có (cùng category) → bị chặn tạo, hiện gợi ý dùng
      lại; bấm "Vẫn tạo mới" → tạo được, DB có `possible_duplicate_of`
      trỏ đúng về tag gốc (check trực tiếp qua `psql`)

Bug đã fix trong lúc build: React tự xoá field uncontrolled sau mỗi lần
Server Action chạy — lúc phát hiện trùng, ô "Tên" bị xoá trắng ngay khi
user cần thấy lại nó nhất để quyết định. Fix bằng cách server trả lại giá
trị đã submit (`submitted`) + tăng 1 counter (`attempt`) dùng làm `key` của
`<form>` để remount và áp `defaultValue` mới — xem
`src/features/tag-tip/{actions.ts,create-tag-form.tsx}`.

Chưa làm:

- [ ] Gắn dedup-suggestion vào lúc thêm địa điểm trong itinerary (mục 8.1:
      "gợi ý ngay trong lúc gõ") — phụ thuộc Itinerary (M02) chưa tồn tại,
      hiện chỉ có trang lookup độc lập `/tags`
- [ ] Bán kính toạ độ trong dedup — cần bắt buộc lat/lng khi tạo LocationTag
      (hiện optional, chưa có input map/pick toạ độ trên form)
- [ ] Citation thật (model `Citation`) khi 1 plan trích dẫn 1 tag — chưa
      có UI/luồng nào tạo `Citation`, nên `citeTrustScore` chưa tự tăng
- [ ] Self-cite: quy tắc (không cộng điểm khi tự cite đồ của mình) chỉ áp
      dụng được khi có Citation thật; chưa implement vì lý do trên
- [ ] Sửa/xoá tag đã tạo

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
