# TripBase — Product Spec v2

**Định vị:** Web app lập kế hoạch du lịch tự túc cho người Việt — gom itinerary builder, bản đồ, booking, ngân sách, checklist giấy tờ, cộng tác nhóm **và một cơ chế "CopyPlan" kiểu copy-trade** để nhân bản, chỉnh sửa các lịch trình hay của người khác — vào một workspace duy nhất.

Không làm "trip planner chung chung". Làm **trip operating system + mạng lưới uy tín (reputation network)** cho nhóm/cá nhân/creator: từ lúc nảy ý tưởng, đến lúc đi thật, đến lúc plan đó được người khác tin và copy lại.

*(Giai đoạn này chưa dùng AI — mọi tính năng đều thao tác thủ công/rule-based. AI sẽ được cân nhắc phát triển ở giai đoạn sau.)*

---

## 1. Người Dùng Mục Tiêu

| Persona | Nhu cầu |
|---|---|
| Người Việt đi tự túc lần đầu | Cần plan dễ hiểu, checklist giấy tờ, chi phí rõ |
| Nhóm bạn 3–8 người | Cần vote địa điểm, chia tiền, chốt lịch |
| Gia đình có trẻ nhỏ/người lớn tuổi | Cần lịch trình nhẹ, ít đổi phương tiện, có nghỉ |
| Người hay đi công tác kết hợp du lịch | Cần gom booking, calendar, expense |
| Travel creator/agency nhỏ | Cần tạo template itinerary, xây uy tín, kiếm tiền từ plan được copy nhiều |
| **Người "săn plan hay"** | Muốn tìm plan đã được nhiều người copy/đi thật, tin tưởng hơn là tự mò từ đầu |

---

## 2. Core Promise

Người dùng điền form nhanh:

> Điểm đến: Seoul — Số ngày: 5 — Số người: 4 (có bé 9 tuổi) — Ngân sách: 45 triệu — Sở thích: ăn uống, công viên, mua sắm — Nhịp độ: nhẹ nhàng.

TripBase trả ra:

- **Danh sách plan có sẵn khớp tiêu chí** (từ Explore/Plan Marketplace, xếp theo CopyPlan Score) để copy về chỉnh sửa, hoặc một **template rỗng** để tự dựng từ đầu bằng Timeline/Map/Budget
- Bản đồ các điểm
- Ước tính chi phí VND
- Checklist visa/giấy tờ/SIM/app cần cài
- Phương án di chuyển
- Chỗ nào cần booking trước
- Bộ lọc plan nhẹ hơn nếu có trẻ em/người lớn tuổi
- Link chia sẻ cho cả nhóm cùng chỉnh
- **Điểm uy tín (Trust Score) của plan, của từng địa điểm/tip trong plan, và của người tạo plan**

---

## 3. Ý Tưởng Lõi Mới: CopyPlan & Trust Score

Đây là phần khác biệt hoá lớn nhất so với v1. Lấy cảm hứng từ cơ chế **copy-trade**:

- Trong copy-trade, một "trader" giỏi có nhiều người copy lệnh → điểm uy tín tăng theo **số vốn thực sự được copy theo**, không phải theo số follower.
- Trong TripBase, một **plan hay** có nhiều người **CopyPlan** (nhân bản về workspace của mình rồi chỉnh sửa/đi thật) → điểm uy tín của **plan** và của **người tạo plan** tăng theo số lượt copy thực chất, không phải theo lượt xem hay like.
- Tương tự, một **địa điểm, cửa hàng, tip** được nhiều plan uy tín trích dẫn (cite) lại → điểm uy tín của địa điểm/tip đó tăng.

Hai cơ chế điểm số song song:

| Cơ chế | Áp dụng cho | Ý nghĩa |
|---|---|---|
| **CopyPlan Score** | Trip Plan, Creator | Plan/người tạo càng được copy nhiều, càng đáng tin |
| **Cite Trust Score** | Place, Shop, Tip | Địa điểm/tip càng được nhiều plan uy tín trích dẫn, càng đáng tin |

Cả hai đều **chống spam bằng trọng số theo chất lượng**, không chỉ đếm số lượng thô (chi tiết ở mục 7–8).

### 3.1 Trạng Thái Plan

Mỗi plan có một trong các trạng thái sau, hiển thị dưới dạng badge trên Explore và trên chính plan:

| Trạng thái | Ý nghĩa | Ai đặt |
|---|---|---|
| 💭 **Ý tưởng** | Mới lên khung, chưa có ngày cụ thể hoặc chưa từng đi | Mặc định khi tạo plan |
| 📅 **Đã lên lịch** | Có ngày đi cụ thể, đang chuẩn bị (booking, checklist) | Owner tự cập nhật khi điền ngày đi |
| ✅ **Đã đi** | Owner xác nhận đã hoàn thành chuyến đi thực tế | Owner tự đánh dấu, khuyến khích kèm bằng chứng (Travel Memory: ảnh, booking đã dùng) |

Trạng thái **Đã đi** là một tín hiệu uy tín riêng (khác với Completion Rate của người *copy* plan ở mục 7) — plan do chính owner đã đi thật được cộng thêm badge **"Verified by Author"**, và được ưu tiên hiển thị hơn plan "Ý tưởng" thuần tuý khi CopyPlan Score đang ngang nhau.

### 3.2 Ba Tầng Tương Tác: Like / Bookmark / Copy

Không phải tương tác nào cũng có giá trị như nhau. TripBase tách rõ 3 tầng:

| Tương tác | Ý nghĩa với người dùng | Có tính vào điểm uy tín? |
|---|---|---|
| ❤️ **Like** | Tín hiệu nhẹ, "tôi thấy plan này hay" | **Không** — chỉ hiển thị số lượt thích, không cộng vào CopyPlan Score/Trust Score |
| 🔖 **Bookmark** | Lưu vào thư viện cá nhân để xem/dùng lại sau, chưa chắc đã copy | **Không** — chỉ là tiện ích cá nhân, không phải xác nhận độc lập |
| 📋 **Copy** | Nhân bản về workspace, chỉnh sửa, có thể đi thật | **Có** — đây là tín hiệu nặng nhất, đúng nguyên tắc "copy-trade" đã nêu ở mục 3 |

Việc giữ Like/Bookmark tách khỏi điểm uy tín là chủ đích: tránh lặp lại vấn đề của mạng xã hội thông thường, nơi like/save có thể bị mua bán hoặc farm hàng loạt mà không phản ánh việc ai đó thật sự tin và dùng theo plan.

### 3.3 Cơ Chế Chia Sẻ Plan

Chia sẻ (share) là **độc lập** với việc plan có public trên Explore hay không — một plan có thể chỉ chia sẻ riêng cho vài người bạn mà không bao giờ xuất hiện công khai. Có 3 hình thức:

| Hình thức | Cách hoạt động | Quyền |
|---|---|---|
| **Invite đích danh** | Owner mời cụ thể một người qua email/username | Owner chọn quyền cho từng người: **Viewer** (chỉ xem) hoặc **Editor** (xem + chỉnh sửa) |
| **Link chỉ xem (View Link)** | Bất kỳ ai có link đều xem được plan (Timeline/Map/Budget), không sửa được | Read-only, không cần là bạn bè được invite; muốn Like/Bookmark/CopyPlan thì cần đăng nhập |
| **Link chỉnh sửa (Edit Link)** | Bất kỳ ai có link đều chỉnh sửa được plan như một Editor | Rủi ro cao hơn nếu lộ link — owner có thể **thu hồi (revoke)** và **tạo lại link mới** bất kỳ lúc nào |

Ba mức **visibility** tổng thể của một plan (áp dụng song song với 3 hình thức share ở trên):

| Visibility | Ai thấy plan |
|---|---|
| 🔒 **Riêng tư** | Chỉ owner |
| 👥 **Bạn bè/nhóm** | Owner + người được Invite hoặc có link (View/Edit) |
| 🌐 **Public** | Bất kỳ ai, hiện trên Explore/Marketplace, có thể được Like/Bookmark/CopyPlan bởi người lạ |

Một plan ở visibility "Riêng tư" hoặc "Bạn bè/nhóm" vẫn dùng được đầy đủ Invite/View Link/Edit Link để cộng tác nhóm nhỏ — chỉ khi owner chuyển sang **Public** thì plan mới tham gia vào Explore, CopyPlan Score và Cite Trust Score công khai.

---

## 4. Module Chính

| Module | Chức năng |
|---|---|
| Trip Builder | Tạo lịch trình thủ công theo form: điểm đến, ngày, số người, ngân sách, gu du lịch — kéo thả để sắp xếp |
| Template Library | Bộ khung lịch trình mẫu theo điểm đến (rỗng hoặc gợi ý sẵn cấu trúc ngày), không sinh tự động, chỉ là khung để user điền vào |
| **Plan Marketplace / Explore** | Khám phá plan public, lọc theo điểm đến/ngân sách/CopyPlan Score/trạng thái (Ý tưởng, Đã lên lịch, Đã đi); mỗi plan có nút Like, Bookmark, CopyPlan |
| **Saved Library** | Thư viện cá nhân chứa các plan đã Bookmark, để xem/dùng lại sau mà chưa cần copy ngay |
| **CopyPlan Engine** | Nhân bản 1-click một plan (toàn bộ hoặc từng ngày) về workspace riêng, giữ liên kết "forked from"; hiển thị diff các thay đổi so với bản gốc bằng so sánh field-by-field (không dùng AI) |
| Map Planner | Hiển thị điểm đến theo ngày, gom theo khu vực, cảnh báo đi vòng |
| Budget Board | Vé máy bay, khách sạn, ăn uống, vé tham quan, di chuyển, shopping, dự phòng |
| Booking Vault | Upload/forward email/PDF/screenshot vé, khách sạn, tour |
| **Share & Permission** | Chia sẻ plan theo 3 hình thức: mời đích danh bạn bè (Invite), link chỉ xem (View Link), link chỉnh sửa (Edit Link) — độc lập với việc plan có public trên Explore hay không |
| Group Mode | Vote địa điểm, comment, assign task giữa những người đã được mời/có quyền truy cập plan |
| Checklist | Visa, hộ chiếu, bảo hiểm, SIM/eSIM, app địa phương, tiền mặt |
| Smart Timeline | Lịch trình theo giờ, travel time, buffer, giờ mở cửa |
| Local Tips | Tip theo điểm đến: app tàu, thẻ giao thông, ổ cắm, tax refund, khu nên ở — **mỗi tip có Cite Trust Score** |
| **Tag & Tip Library** | Kho location tag/tip dùng chung, có thể load lại khi lập plan; tự phát hiện trùng lặp và gợi ý dùng lại thay vì tạo mới |
| **Reputation Engine** | Tính CopyPlan Score cho plan/creator, Cite Trust Score cho place/shop/tip |
| Export | PDF, Google Calendar, Google Maps list, share public/private link |
| Travel Memory | Sau chuyến đi: album, note, tổng kết chi phí, review itinerary → **feed lại vào Reputation Engine** |

---

## 5. Tính Năng MVP

| Ưu tiên | Tính năng |
|---|---|
| P0 | Tạo trip: điểm đến, ngày, số người, ngân sách, style |
| P0 | Tạo itinerary theo ngày bằng form + kéo thả thủ công (không AI) |
| P0 | Bản đồ địa điểm + gom điểm theo ngày |
| P0 | Budget VND + chia tiền cơ bản |
| P0 | Share link cho nhóm xem/chỉnh — gồm Invite đích danh (viewer/editor), View Link, Edit Link |
| P0 | Checklist giấy tờ và chuẩn bị |
| **P0** | **Nút "CopyPlan" — fork 1 plan public về workspace riêng** |
| **P0** | **Trạng thái Plan: Ý tưởng / Đã lên lịch / Đã đi, hiển thị badge trên plan** |
| **P1** | **CopyPlan Score hiển thị trên mỗi plan public (badge: số lượt copy thực)** |
| **P1** | **Like & Bookmark trên plan public (không tính vào điểm uy tín)** |
| **P1** | **Saved Library — danh sách plan đã bookmark** |
| P1 | Upload booking PDF/screenshot |
| P1 | Vote địa điểm trong nhóm |
| P1 | Export PDF/Calendar |
| **P1** | **Cite Trust Score cho Place/Shop/Tip (badge trên map & local tips)** |
| **P2** | **Creator Profile công khai, tổng hợp CopyPlan Score toàn bộ plan đã tạo** |
| P2 | Flight alert, live delay |
| P2 | eSIM/affiliate booking |
| P2 | Marketplace itinerary trả phí của creator (mở khoá khi CopyPlan Score đủ ngưỡng) |

---

## 6. Luồng Người Dùng Chính

### 6a. Luồng tạo mới
1. User tạo chuyến đi → điền form nhanh (điểm đến, ngày, số người, ngân sách, style).
2. App gợi ý: (a) plan có sẵn khớp tiêu chí từ Explore để copy về, hoặc (b) template rỗng theo điểm đến để tự dựng.
3. User chọn một phương án → app hiện 3 view song song: Timeline, Map, Budget.
4. User kéo thả địa điểm giữa các ngày; app cảnh báo đi vòng (dựa trên khoảng cách toạ độ, không phải AI).
5. Mời bạn bè/người thân vào → vote, comment, chốt.
6. Xuất PDF hoặc dùng PWA khi đi.
7. Sau chuyến đi: đánh giá lại plan → dữ liệu này nạp vào Reputation Engine nếu plan là public.

### 6b. Luồng CopyPlan (mới)
1. User vào **Explore**, lọc theo điểm đến/ngân sách/số ngày/CopyPlan Score/trạng thái (ưu tiên xem "Đã đi" nếu muốn plan đã kiểm chứng thật).
2. Xem plan mẫu: Timeline + Map + Budget + badge trạng thái + badge "Đã được copy 1.240 lần, hoàn thành thực tế 76%".
3. User có thể **Like** (thích nhanh) hoặc **Bookmark** (lưu vào Saved Library để xem lại sau) mà chưa cần copy ngay.
4. Khi sẵn sàng, bấm **CopyPlan** → toàn bộ plan (hoặc chỉ 1-2 ngày) được nhân bản vào workspace riêng, giữ nguyên tag "forked from [creator]".
5. User chỉnh sửa theo nhu cầu riêng (đổi khách sạn, thêm/bớt điểm, đổi ngân sách).
6. App tự tính **Retention Rate** — mức độ giữ nguyên so với bản gốc — dùng để tính điểm cho bản gốc (xem mục 7).
7. Sau khi đi thật, user tự cập nhật trạng thái plan của mình thành **Đã đi** và đánh giá plan đã copy → điểm này cộng dồn ngược lại uy tín plan gốc.

---

## 7. Cơ Chế CopyPlan Score (chi tiết)

CopyPlan Score của **một plan** và của **một creator** được tính từ các yếu tố sau, không chỉ đếm số lượt bấm nút:

| Yếu tố | Vai trò | Ghi chú chống gian lận |
|---|---|---|
| **Copy Volume** | Số lượt CopyPlan thực từ tài khoản khác nhau | Không tính nhiều lần copy từ cùng 1 người/1 thiết bị |
| **Retention Rate** | % nội dung giữ nguyên sau khi copy (địa điểm, thứ tự ngày) | Copy rồi xoá sạch sửa lại gần như 100% thì tính là plan mới, không cộng điểm cho bản gốc |
| **Completion Rate** | % người copy plan có đánh dấu "đã đi" chuyến đó | Loại các plan chỉ được lưu nhưng không ai thực sự dùng |
| **Post-trip Rating** | Đánh giá sau chuyến đi thực tế của người đã copy | Chỉ tính rating từ tài khoản đã xác nhận hoàn thành trip |
| **Decay theo thời gian** | Điểm giảm dần nếu không có lượt copy mới | Tránh một plan "hit" một lần rồi đứng yên mãi ở top |
| **Diversity Bonus** | Copy đến từ nhiều nhóm người dùng khác nhau (ngân sách, số người, khu vực) | Ưu tiên plan phổ quát, giảm ưu tiên plan chỉ hợp 1 nhóm hẹp |

Công thức tham khảo (v1, sẽ tinh chỉnh bằng dữ liệu thật):

```
CopyPlanScore = (CopyVolume_hiệu_chỉnh × 0.4)
              + (CompletionRate × 0.25)
              + (PostTripRating × 0.25)
              + (DiversityBonus × 0.1)
              − Decay(thời_gian_từ_lần_copy_gần_nhất)
```

**Creator Reputation** = tổng hợp CopyPlan Score của toàn bộ plan họ tạo, có trọng số theo plan mới nhất (giống copy-trader vẫn phải duy trì performance, không sống mãi bằng phong độ cũ).

---

## 8. Cơ Chế Cite Trust Score (Place / Shop / Tip)

Áp dụng cho từng **địa điểm, cửa hàng, hoặc tip** (ví dụ: quán ăn, thẻ giao thông, app đặt taxi địa phương):

| Yếu tố | Vai trò |
|---|---|
| **Cite Count** | Số plan khác nhau có trích dẫn/đưa địa điểm này vào itinerary |
| **Cite Quality Weight** | Trích dẫn từ plan/creator có CopyPlan Score cao được tính trọng số cao hơn trích dẫn từ plan mới toanh, chưa ai copy |
| **Verified Visit** | Số người dùng đã đánh dấu "đã ghé thực tế" sau chuyến đi, không chỉ đưa vào plan cho có |
| **Cross-plan Consistency** | Địa điểm được cite giống nhau bởi nhiều creator độc lập (không cùng 1 nhóm) → tăng uy tín |
| **Negative Signal** | Review xấu sau khi đi thực tế ("đóng cửa", "giá khác xa dự kiến") → trừ điểm |

Kết quả hiển thị dưới dạng badge trên Map View và Local Tips, ví dụ:

- 🟢 **Verified Local Pick** — cite ≥ ngưỡng cao, từ nhiều creator độc lập, verified visit cao
- 🟡 **Emerging** — mới được vài plan cite, chưa đủ dữ liệu
- ⚪ **Chưa xác thực** — chỉ 1 nguồn, chưa ai xác nhận ghé thực tế

---

### 8.1 Luồng Tạo Location Tag / Tip Khi Lập Plan

Khi user đang lập plan và cần thêm một địa điểm hoặc một tip, họ có 2 cách:

1. **Load có sẵn** — gõ tên/khu vực, hệ thống gợi ý các Location Tag / Tip đã tồn tại trong Tag & Tip Library (kèm badge Cite Trust Score, số lần đã được cite).
2. **Tự tạo mới** — nếu không có sẵn, user tạo Location Tag / Tip mới, trở thành **chủ sở hữu (owner)** của tag/tip đó.

**Cơ chế phát hiện trùng lặp (không dùng AI — thuật toán so khớp thông thường):**

- Khi user gõ tag/tip mới, hệ thống chạy dedup matching bằng **rule-based matching**: so khớp tên (fuzzy string matching / Levenshtein) + khoảng cách toạ độ trong bán kính cho phép + cùng danh mục (cho Location Tag); hoặc so khớp độ tương đồng chuỗi văn bản (string similarity, không phải AI hiểu nghĩa) cho Tip.
- Nếu tìm thấy tag/tip đã tồn tại gần giống → hiện gợi ý ngay trong lúc gõ:

  > "Đã có tag **'Ban Mai Cafe – Quận 1'** (được cite 34 lần, Trust Score cao) — Dùng lại tag này thay vì tạo mới?"

- Nếu user bấm **Dùng lại** → plan của họ liên kết (cite) đến tag/tip gốc, không tạo bản sao. Cite Trust Score của tag/tip gốc **tăng**, và **chủ sở hữu gốc được cộng điểm**.
- Nếu user vẫn cố tạo mới dù trùng → hệ thống vẫn cho tạo (tránh chặn cứng gây khó chịu), nhưng gắn cờ `possible_duplicate_of` để Reputation Engine không tính đây là một nguồn độc lập khi tính Cross-plan Consistency (mục 8), tránh 1 địa điểm bị "chia nhỏ" thành nhiều bản ghi ảo để né dedup.

**Quy tắc tự-copy (self-cite):**

- Nếu tag/tip trùng đó **do chính user hiện tại sở hữu** (họ tạo ở plan trước, giờ dùng lại ở plan khác) → họ **vẫn được dùng lại bình thường**, nhưng **không cộng thêm điểm Cite Trust Score cho chính mình**. Tự dùng lại đồ của mình không phải là một xác nhận độc lập, nên không tính là tín hiệu uy tín.
- Quy tắc này áp dụng đối xứng với CopyPlan Score ở mục 7: copy plan/tag/tip của chính mình (multi-account hoặc cùng 1 tài khoản) không sinh ra điểm.

---

## 9. Điểm Khác Biệt Nên Đánh

TripBase không chỉ "gợi ý đi đâu", mà trả lời:

- Đi như vậy có mệt không?
- Tổng tiền khoảng bao nhiêu?
- Cần chuẩn bị giấy tờ gì?
- Nhóm đã chốt chưa?
- Lịch này có hợp với trẻ em/người lớn tuổi không?
- Điểm nào cần book trước?
- Nếu trời mưa thì đổi plan nào?
- **Plan này có đáng tin không — bao nhiêu người đã thực sự đi theo và đánh giá thế nào?**
- **Địa điểm/tip này có phải chỉ 1 người tự khai không, hay đã được nhiều người xác nhận?**

Đây là chỗ app generic — và cả các trip planner khác — còn yếu: họ cho ra plan, nhưng không ai biết plan đó có ai đi thật chưa.

---

## 10. Định Hướng Tương Lai (Chưa Làm Ở Giai Đoạn Này)

Giai đoạn hiện tại **không có tính năng AI**. Toàn bộ itinerary, route, budget, checklist đều do user tự thao tác (form, kéo thả, template, thư viện tag/tip có sẵn). Khi sản phẩm đã có đủ dữ liệu hành vi thật (plan, copy, cite, rating sau chuyến đi), có thể cân nhắc bổ sung ở giai đoạn sau:

- Gợi ý itinerary tự động dựa trên dữ liệu plan/copy đã tích luỹ
- Tối ưu tuyến đường tự động
- Ước tính ngân sách thông minh hơn dựa trên dữ liệu thật
- Gợi ý phương án thay thế khi thời tiết xấu

*(Không đưa các mục này vào MVP hay roadmap 10 tuần — chỉ ghi lại làm định hướng dài hạn.)*

---

## 11. Web App UI

Layout ưu tiên desktop web/PWA:

| Khu vực | Nội dung |
|---|---|
| Left Sidebar | Ngày 1, Ngày 2, Ngày 3; checklist; budget |
| Center | Timeline kéo thả theo giờ; khi thêm địa điểm/tip mới, hiện gợi ý inline "Đã có tag này — dùng lại?" nếu trùng |
| Right | Map + tổng chi phí + cảnh báo |
| Top Bar | **Share** (menu: Invite bạn bè, copy View Link, copy Edit Link), Export, Save, **CopyPlan** |

3 chế độ xem chính:

| View | Dùng khi |
|---|---|
| Plan View | Lên lịch từng ngày |
| Map View | Xem tuyến đường, khoảng cách, badge Trust Score của từng điểm |
| Money View | Tính tiền, chia tiền, đặt cọc |

Thêm 2 màn hình mới:

| Màn hình | Nội dung |
|---|---|
| **Explore/Marketplace** | Feed plan public, lọc theo điểm đến/ngân sách/trạng thái, sắp xếp mặc định theo CopyPlan Score; mỗi card có badge trạng thái + nút Like/Bookmark/CopyPlan |
| **Saved Library** | Danh sách plan đã Bookmark, riêng tư cho từng user |
| **Creator Profile** | Tổng lượt CopyPlan nhận được, danh sách plan, biểu đồ uy tín theo thời gian |

Mobile vẫn là PWA companion: xem lịch, tick checklist, mở map, xem booking, xem badge uy tín. Việc plan nặng và duyệt Explore vẫn ưu tiên desktop web.

---

## 12. Data Model

| Entity | Field chính |
|---|---|
| Trip / Plan | id, name, destination, dates, currency, owner_id, `visibility` (private / friends / public), `forked_from_plan_id`, `status` (idea / scheduled / completed), `verified_by_author` |
| Traveler | name, role, age_group, preferences |
| Place | name, location, category, opening_hours, cost_estimate, `cite_trust_score` |
| **LocationTag / Tip** | id, `owner_id`, title, content/category, location (nếu là địa điểm), `possible_duplicate_of`, `cite_trust_score`, created_at |
| ItineraryItem | trip_id, day, start_time, end_time, place_id, `location_tag_id`/`tip_id` (nếu dùng lại từ library), notes |
| Booking | type, provider, confirmation_code, file_url, date_time |
| Expense | category, amount, paid_by, split_between |
| ChecklistItem | title, due_date, assigned_to, status |
| Vote | place_id/item_id, user_id, vote_type |
| Comment | target_type, target_id, user_id, content |
| **Collaborator** | plan_id, user_id, `role` (viewer / editor), invited_by, invited_at |
| **ShareLink** | plan_id, token, `type` (view / edit), created_by, expires_at, `revoked_at` |
| **Interaction** | plan_id, user_id, `type` (like / bookmark), created_at — *không dùng để tính CopyPlan Score* |
| **PlanCopy** | plan_id, original_plan_id, copier_user_id, copied_at, `retention_rate`, `completed`, `post_trip_rating` |
| **CreatorReputation** | user_id, `copyplan_score`, `total_plans`, `total_copies`, last_updated |
| **Citation** | place_id/tip_id, plan_id, citer_user_id, `owner_id_of_tag`, `is_self_cite` (true nếu citer_user_id = owner_id_of_tag → không cộng điểm), `verified_visit`, created_at |

---

## 13. Guardrail Chống Gian Lận

Vì điểm số ảnh hưởng trực tiếp đến uy tín và tiền (creator payout), cần chặn:

- **Copy ảo**: nhiều tài khoản/thiết bị copy plan của chính mình → phát hiện qua device fingerprint, IP, thời gian bất thường.
- **Tự-copy tag/tip**: `is_self_cite = true` (citer_user_id = owner của tag/tip, kể cả qua nhiều plan khác nhau của cùng một user) → luôn bị loại khỏi Cite Trust Score, dù vẫn cho phép dùng lại bình thường trong lúc lập plan.
- **Cite-stuffing**: nhồi nhét địa điểm vào plan chỉ để tăng cite count → chỉ tính cite nếu địa điểm thực sự nằm trong itinerary có ngày/giờ cụ thể, không phải danh sách rời rạc.
- **Rating giả sau chuyến đi**: yêu cầu xác nhận hoàn thành trip (check-in, upload ảnh/booking) trước khi rating được tính vào điểm.
- **Vòng lặp tự copy giữa nhóm quen biết**: giới hạn trọng số cho các cụm tài khoản có hành vi copy lẫn nhau bất thường (giống cụm "wash trading" trong copy-trade).
- **Giả mạo trạng thái "Đã đi"**: badge "Verified by Author" chỉ hiện khi owner đính kèm bằng chứng tối thiểu (ảnh Travel Memory, booking đã dùng, hoặc check-in ngày cụ thể); tự đánh dấu "Đã đi" mà không có gì kèm theo vẫn hiển thị trạng thái nhưng không có badge verified và không cộng thêm trọng số uy tín.
- **Farm Like/Bookmark**: vì hai tương tác này không tính vào CopyPlan Score/Trust Score nên động lực farm thấp, nhưng vẫn rate-limit theo tài khoản/thiết bị để tránh làm nhiễu thứ hạng hiển thị mặc định trên Explore (dù không phải thứ hạng chính).
- **Edit Link bị lộ ngoài ý muốn**: cho phép owner revoke và tạo lại Edit Link bất kỳ lúc nào; nên có tuỳ chọn đặt hạn dùng (expiry) cho Edit Link để giảm rủi ro nếu quên thu hồi. Edit Link/View Link không đồng nghĩa với việc plan trở thành Public — chỉ ảnh hưởng CopyPlan Score/Explore khi owner chủ động chuyển visibility sang Public.

---

## 14. Kiếm Tiền

| Model | Ghi chú |
|---|---|
| Freemium | Miễn phí 2–3 trip active |
| Pro cá nhân | Export, unlimited trip, upload document nhiều hơn |
| Group trip pass | Một chuyến đi trả phí một lần |
| Creator template | Bán itinerary mẫu — **mở khoá bán khi CopyPlan Score đạt ngưỡng, giống trader đủ AUM mới được nhận follower trả phí** |
| **Copy Royalty** | Creator có plan được copy nhiều nhận % hoa hồng khi người copy nâng cấp Pro hoặc đặt booking qua affiliate trong plan đó |
| Affiliate | eSIM, bảo hiểm du lịch, tour, vé tham quan, hotel — ưu tiên gợi ý affiliate có Cite Trust Score cao |
| B2B nhỏ | Travel agency nhỏ dùng để gửi plan cho khách, xây uy tín agency qua CopyPlan Score |

---

## 15. Tech Stack Gợi Ý

| Layer | Gợi ý |
|---|---|
| Frontend | Next.js hoặc Remix |
| UI | Tailwind + shadcn/ui |
| Map | Mapbox hoặc Google Maps API |
| Backend | NestJS/FastAPI hoặc Next.js server actions |
| DB | PostgreSQL + PostGIS |
| Auth | Clerk/Supabase/Auth.js |
| Realtime | Supabase Realtime/Pusher |
| File Storage | S3-compatible |
| Export | React PDF / server-side PDF |
| PWA | Offline cache cho itinerary, booking, checklist |
| **Scoring Jobs** | Background worker (cron/queue) tính lại CopyPlan Score & Cite Trust Score định kỳ (không tính real-time để tránh gaming tức thời) |

---

## 16. MVP Trong 2 Tuần

| Tuần | Việc |
|---|---|
| 1 | Research UX + data model + wireframe (bao gồm PlanCopy, Citation) |
| 2 | Auth, create trip, trip dashboard |
| 3 | Itinerary timeline kéo thả |
| 4 | Map + place search + route grouping |
| 5 | Template Library theo điểm đến + hoàn thiện luồng tạo trip thủ công |
| 6 | Budget + checklist |
| 7 | Share/collaboration cơ bản |
| 8 | **CopyPlan: fork plan, PlanCopy record, Retention Rate cơ bản** |
| 9 | **Reputation Engine v1: CopyPlan Score, Cite Trust Score, Explore feed** |
| 10 | Export PDF + PWA offline itinerary + guardrail chống gian lận cơ bản |

---

## Kết Luận

Không đặt tên là "AI Travel Planner". Giai đoạn này thậm chí không dùng AI — AI sẽ phát triển sau khi đã có đủ dữ liệu hành vi thật.

Định vị:

> **TripBase: web app lập kế hoạch du lịch tự túc cho người Việt, nơi lịch trình hay được copy lại như copy-trade — càng nhiều người đi theo và đi thật, càng uy tín.**

Cạnh tranh bằng workflow thật + mạng lưới uy tín thật, không phải bằng công nghệ sinh nội dung tự động. Điểm ăn tiền là: **Việt Nam-first + group planning + budget VND + checklist giấy tờ + CopyPlan Score + Cite Trust Score** — thứ mà app generic không có, vì nó cần dữ liệu hành vi thật tích luỹ theo thời gian, không sinh ra chỉ bằng một prompt.
