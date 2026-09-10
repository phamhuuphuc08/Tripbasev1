/**
 * Rule-based geo helpers cho Map Planner / Smart Timeline.
 * Không gọi API bên ngoài, chỉ dùng lat/lng có sẵn trong LocationTag.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface TravelEstimate {
  distanceKm: number;
  estimatedMinutes: number;
}

const EARTH_RADIUS_KM = 6371;
const BACKTRACK_RATIO_THRESHOLD = 1.3;
const MIN_POINTS_TO_CHECK = 3;

/** Kiểm tra tọa độ hợp lệ. */
export function isValidGeoPoint(point: GeoPoint): boolean {
  return Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    point.latitude >= -90 &&
    point.latitude <= 90 &&
    point.longitude >= -180 &&
    point.longitude <= 180;
}

/** Khoảng cách đường chim bay giữa 2 tọa độ, đơn vị km. */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  if (!isValidGeoPoint(a) || !isValidGeoPoint(b)) return 0;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/**
 * Ước tính thời gian di chuyển dựa trên khoảng cách.
 *
 * < 1 km: khoảng 12 phút/km, giả định đi bộ.
 * 1–5 km: khoảng 5 phút/km + 5 phút đệm.
 * > 5 km: khoảng 3 phút/km + 10 phút đệm.
 *
 * Đây chỉ là rule-based estimate, không phải thời gian giao thông thực tế.
 */
export function estimateTravelTimeMinutes(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  if (distanceKm < 1) return Math.max(1, Math.ceil(distanceKm * 12));
  if (distanceKm <= 5) return Math.ceil(distanceKm * 5 + 5);
  return Math.ceil(distanceKm * 3 + 10);
}

/** Tính khoảng cách + thời gian di chuyển ước tính giữa hai điểm. */
export function estimateTravelBetween(a: GeoPoint, b: GeoPoint): TravelEstimate {
  const distanceKm = haversineDistanceKm(a, b);

  return {
    distanceKm,
    estimatedMinutes: estimateTravelTimeMinutes(distanceKm),
  };
}

/** Làm tròn khoảng cách để hiển thị trên giao diện. */
export function formatDistanceKm(distanceKm: number): number {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return 0;
  return Math.round(distanceKm * 10) / 10;
}

function totalRouteDistanceKm(points: GeoPoint[]): number {
  let total = 0;

  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }

  return total;
}

/** Thứ tự tham lam: từ điểm hiện tại, luôn đi tới điểm chưa ghé gần nhất. */
function nearestNeighborDistanceKm(points: GeoPoint[]): number {
  if (points.length < 2) return 0;

  const remaining = points.slice(1);
  const route: GeoPoint[] = [points[0]];

  while (remaining.length > 0) {
    const current = route[route.length - 1];
    let closestIndex = 0;
    let closestDistance = Infinity;

    remaining.forEach((point, index) => {
      const distance = haversineDistanceKm(current, point);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    route.push(remaining[closestIndex]);
    remaining.splice(closestIndex, 1);
  }

  return totalRouteDistanceKm(route);
}

/**
 * So quãng đường thực tế theo lịch trình với quãng đường theo thứ tự
 * "gần nhau trước".
 *
 * Nếu đường thực tế dài hơn 30% thì cảnh báo lịch trình có khả năng đi vòng.
 */
export function detectBacktrack(pointsInOrder: GeoPoint[]): boolean {
  if (pointsInOrder.length < MIN_POINTS_TO_CHECK) return false;

  const actual = totalRouteDistanceKm(pointsInOrder);
  const optimized = nearestNeighborDistanceKm(pointsInOrder);

  if (optimized === 0) return false;

  return actual > optimized * BACKTRACK_RATIO_THRESHOLD;
}