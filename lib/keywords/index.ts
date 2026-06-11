import { KEYWORD_PAIRS, KeywordPair, CATEGORIES } from "./data";

export { KEYWORD_PAIRS, CATEGORIES };
export type { KeywordPair };

/** Lọc danh sách cặp từ theo danh mục & độ khó. */
export function filterPairs(category: string, difficulty: string): KeywordPair[] {
  return KEYWORD_PAIRS.filter((p) => {
    const okCat = category === "ALL" || p.category === category;
    const okDiff = difficulty === "ALL" || p.difficulty === difficulty;
    return okCat && okDiff;
  });
}

/** Chọn ngẫu nhiên 1 cặp từ phù hợp. Trả về fallback nếu rỗng. */
export function pickRandomPair(category: string, difficulty: string): KeywordPair {
  const pool = filterPairs(category, difficulty);
  const list = pool.length > 0 ? pool : KEYWORD_PAIRS;
  return list[Math.floor(Math.random() * list.length)];
}
