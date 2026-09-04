/**
 * Badge hiển thị trên Map View & Local Tips — mục 8 của spec. Ngưỡng tạm
 * thời (chưa tinh chỉnh bằng dữ liệu thật); `citeTrustScore` hiện chỉ được
 * set qua seed/tay, Reputation Engine (M09) chưa tính tự động.
 */
export type TrustTier = "verified" | "emerging" | "unverified";

const VERIFIED_THRESHOLD = 10;

export function getTrustTier(citeTrustScore: number): TrustTier {
  if (citeTrustScore >= VERIFIED_THRESHOLD) return "verified";
  if (citeTrustScore > 0) return "emerging";
  return "unverified";
}
