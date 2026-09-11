/**
 * Rule-based dedup cho LocationTag/Tip — mục 8.1 của spec.
 * Không dùng AI: chuẩn hoá chuỗi + Levenshtein + token similarity.
 */

export const DUPLICATE_THRESHOLD = 0.72;

export function normalizeDedupText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function levenshteinDistance(a: string, b: string): number {
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;

    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + cost);
    }

    for (let j = 0; j <= b.length; j += 1) previous[j] = current[j];
  }

  return previous[b.length];
}

function levenshteinSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (!maxLength) return 1;
  return 1 - levenshteinDistance(a, b) / maxLength;
}

function tokenSimilarity(a: string, b: string): number {
  const left = new Set(a.split(" ").filter(Boolean));
  const right = new Set(b.split(" ").filter(Boolean));

  if (!left.size || !right.size) return 0;

  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;

  const union = new Set([...left, ...right]).size;
  return union ? intersection / union : 0;
}

/** 1 = trùng tuyệt đối, 0 = hoàn toàn khác. */
export function titleSimilarity(a: string, b: string): number {
  const left = normalizeDedupText(a);
  const right = normalizeDedupText(b);

  if (!left || !right) return 0;
  if (left === right) return 1;

  const editScore = levenshteinSimilarity(left, right);
  const wordScore = tokenSimilarity(left, right);

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length > right.length ? left : right;
  const containmentScore = longer.includes(shorter) ? shorter.length / longer.length : 0;

  return Math.max(editScore, wordScore, containmentScore);
}

export interface DuplicateMatch<T> {
  candidate: T;
  score: number;
}

/** Trả về ứng viên tốt nhất kèm điểm similarity. */
export function findBestPossibleDuplicate<T extends { title: string }>(
  candidates: T[],
  title: string,
  threshold = DUPLICATE_THRESHOLD,
): DuplicateMatch<T> | null {
  const normalizedTitle = normalizeDedupText(title);
  if (!normalizedTitle) return null;

  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = titleSimilarity(candidate.title, title);

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best && bestScore >= threshold ? { candidate: best, score: bestScore } : null;
}

/** API cũ vẫn được giữ để location-tag.service.ts không phải đổi cách gọi. */
export function findPossibleDuplicate<T extends { title: string }>(
  candidates: T[],
  title: string,
  threshold = DUPLICATE_THRESHOLD,
): T | null {
  return findBestPossibleDuplicate(candidates, title, threshold)?.candidate ?? null;
}