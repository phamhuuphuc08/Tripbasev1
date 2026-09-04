/**
 * Rule-based dedup cho LocationTag/Tip — mục 8.1 của spec: "so khớp tên
 * (fuzzy string matching / Levenshtein) ... cùng danh mục". Không dùng AI.
 */

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist: number[][] = Array.from({ length: rows }, (_, i) => [
    i,
    ...Array(cols - 1).fill(0),
  ]);
  for (let j = 0; j < cols; j += 1) dist[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(
        dist[i - 1][j] + 1,
        dist[i][j - 1] + 1,
        dist[i - 1][j - 1] + cost,
      );
    }
  }
  return dist[rows - 1][cols - 1];
}

/** 1 = trùng khớp tuyệt đối, 0 = hoàn toàn khác. */
export function titleSimilarity(a: string, b: string): number {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return 0;
  const maxLen = Math.max(left.length, right.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(left, right) / maxLen;
}

/** Trên ngưỡng này thì coi là "có thể trùng" và gợi ý dùng lại. */
export const DUPLICATE_THRESHOLD = 0.72;

export function findPossibleDuplicate<T extends { title: string }>(
  candidates: T[],
  title: string,
): T | null {
  let best: T | null = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const score = titleSimilarity(candidate.title, title);
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return bestScore >= DUPLICATE_THRESHOLD ? best : null;
}
