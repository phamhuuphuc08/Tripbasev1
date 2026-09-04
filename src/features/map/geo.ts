/**
 * Rule-based geo helpers cho Map Planner — mục 4/6a của spec: "cảnh báo đi
 * vòng (dựa trên khoảng cách toạ độ, không phải AI)". Không gọi API bên
 * ngoài, chỉ toán học thuần trên lat/lng đã có sẵn trong LocationTag.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371;

/** Khoảng cách đường chim bay giữa 2 toạ độ (km). */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
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

function totalRouteDistanceKm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) {
    total += haversineDistanceKm(points[i - 1], points[i]);
  }
  return total;
}

/** Thứ tự "tham lam": từ điểm hiện tại, luôn đi tới điểm chưa ghé gần nhất. */
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

/** Ngưỡng: đi thật xa hơn 30% so với thứ tự "gần nhau trước" thì coi là đi vòng. */
const BACKTRACK_RATIO_THRESHOLD = 1.3;
const MIN_POINTS_TO_CHECK = 3;

/**
 * So quãng đường thực tế (theo đúng thứ tự giờ trong ngày) với quãng đường
 * nếu đi theo thứ tự gần nhau trước (nearest-neighbor). Thực tế dài hơn
 * đáng kể → khả năng lịch trình đang đi vòng, nên sắp lại theo khu vực.
 */
export function detectBacktrack(pointsInOrder: GeoPoint[]): boolean {
  if (pointsInOrder.length < MIN_POINTS_TO_CHECK) return false;

  const actual = totalRouteDistanceKm(pointsInOrder);
  const optimized = nearestNeighborDistanceKm(pointsInOrder);
  if (optimized === 0) return false;

  return actual > optimized * BACKTRACK_RATIO_THRESHOLD;
}
