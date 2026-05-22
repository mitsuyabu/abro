/**
 * Supabase生データを 1.0〜5.0 のスコアに正規化する関数群
 */

/** 生活費スコア：家賃が安いほど高スコア */
export function normalizeCost(rentAud: number | null): number {
  if (rentAud === null) return 3.0;
  const MIN = 800;   // 最安想定（AUD/月）
  const MAX = 2500;  // 最高想定（AUD/月）
  const clamped = Math.min(MAX, Math.max(MIN, rentAud));
  // 逆転換算：安いほど高スコア
  return 1 + ((MAX - clamped) / (MAX - MIN)) * 4;
}

/** 治安スコア：Numbeo安全指数（0〜100）を 1〜5 に変換 */
export function normalizeSafety(safetyIndex: number | null): number {
  if (safetyIndex === null) return 3.0;
  const clamped = Math.min(100, Math.max(0, safetyIndex));
  return 1 + (clamped / 100) * 4;
}

/** 気候スコア：年間日照時間が長いほど高スコア */
export function normalizeClimate(sunshineHours: number | null): number {
  if (sunshineHours === null) return 3.0;
  // 実データ範囲: Melbourne 2381h 〜 Perth 3222h
  const MIN = 2200;
  const MAX = 3300;
  const clamped = Math.min(MAX, Math.max(MIN, sunshineHours));
  return 1 + ((clamped - MIN) / (MAX - MIN)) * 4;
}

/**
 * 仕事スコア：英語力によって参照先を変える
 * - beginner/unknown: 日本語求人スコア（score_japanese_jobs）
 * - intermediate: 50:50 混合
 * - advanced: 一般求人スコア（score_jobs）
 */
export function normalizeJobs(
  scoreJobs: number | null,
  scoreJapaneseJobs: number | null,
  englishLevel: 'beginner' | 'intermediate' | 'advanced' | 'unknown'
): number {
  const g = Math.min(5, Math.max(1, scoreJobs ?? 3));
  const j = Math.min(5, Math.max(1, scoreJapaneseJobs ?? 3));

  switch (englishLevel) {
    case 'beginner':
    case 'unknown':
      return j;
    case 'intermediate':
      return (j + g) / 2;
    case 'advanced':
      return g;
  }
}

/** 語学学校スコア：学校数を 1〜5 に変換 */
export function normalizeSchools(schoolCount: number): number {
  const MAX = 150;
  const clamped = Math.min(MAX, Math.max(0, schoolCount));
  return 1 + (clamped / MAX) * 4;
}
