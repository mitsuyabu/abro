/**
 * 語学学校スコアリングのメイン関数
 * ユーザー条件 + 学校データ → 100点満点のスコアを返す
 */

import type { UserAnswers } from './weights';

/** Supabaseから取得する学校データ */
export interface SchoolData {
  school_id: string;
  name: string;
  name_ja: string | null;
  city: string;
  country: string;

  // 価格
  price_min_aud: number | null;
  price_max_aud: number | null;
  enrollment_fee_aud: number | null;

  // 学校特徴
  japanese_ratio: number | null;
  total_students: number | null;
  nationality_diversity: string | null;

  // サポート
  support_japanese: boolean;
  support_job: boolean;
  support_accommodation: boolean;

  // 評価
  rating: number | null;
  review_count: number | null;

  // その他
  accredited: boolean;

  // コース情報（JOIN済み）
  courses?: Array<{
    course_id: string;
    name: string;
    price_per_week_aud: number;
    time_slot: string;
    level_min: string;
    level_max: string;
    purpose: string[];
    recommended: boolean;
  }>;

  // ラベル（JOIN済み）
  labels?: string[];
}

export interface ScoreBreakdown {
  budget: number;        // 予算適合度（30点）
  level: number;         // 英語レベル適合度（20点）
  support: number;       // サポート充実度（20点）
  environment: number;   // 学習環境（15点）
  rating: number;        // 評価・信頼性（15点）
}

export interface SchoolScoreResult {
  school_id: string;
  name: string;
  name_ja: string | null;
  city: string;
  totalScore: number;        // 100点満点
  breakdown: ScoreBreakdown;
  rank: number;              // 1始まり
  matchReasons: string[];    // マッチ理由
}

/** 週予算をAUDに変換（概算） */
function getWeeklyBudgetAUD(budget: string | null): number {
  switch (budget) {
    case 'low':    return 200;  // 月8万円 ≈ 週200AUD
    case 'medium': return 350;  // 月15万円 ≈ 週350AUD
    case 'high':   return 500;  // 月20万円 ≈ 週500AUD
    default:       return 300;  // デフォルト
  }
}

/** 英語レベルをCEFRに変換 */
function englishLevelToCEFR(level: string | null): string[] {
  switch (level) {
    case 'beginner':     return ['A1', 'A2'];
    case 'intermediate': return ['B1', 'B2'];
    case 'advanced':     return ['C1', 'C2'];
    default:             return ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  }
}

/** 目的からコースタイプを抽出 */
function purposeToCourseTypes(purpose: string | null): string[] {
  switch (purpose) {
    case 'english':       return ['general'];
    case 'work_and_study': return ['general', 'work_and_study'];
    case 'university':    return ['academic', 'university_prep'];
    case 'career':        return ['business', 'career'];
    default:              return ['general'];
  }
}

/** 1校のスコアを計算する */
export function calculateSchoolScore(
  school: SchoolData,
  userAnswers: UserAnswers,
  targetCity?: string
): Omit<SchoolScoreResult, 'rank'> {
  const breakdown: ScoreBreakdown = {
    budget: 0,
    level: 0,
    support: 0,
    environment: 0,
    rating: 0
  };

  const matchReasons: string[] = [];
  const weeklyBudget = getWeeklyBudgetAUD(userAnswers.budget);
  const cefrLevels = englishLevelToCEFR(userAnswers.english);
  const courseTypes = purposeToCourseTypes(userAnswers.purpose);

  // ==========================================
  // 1. 予算スコア（30点）
  // ==========================================
  if (school.price_min_aud !== null) {
    if (school.price_min_aud <= weeklyBudget) {
      const margin = weeklyBudget - school.price_min_aud;

      if (margin >= 100) {
        breakdown.budget = 30;
        matchReasons.push('予算に十分な余裕あり');
      } else if (margin >= 50) {
        breakdown.budget = 25;
        matchReasons.push('予算内で余裕あり');
      } else if (margin >= 0) {
        breakdown.budget = 20;
        matchReasons.push('予算ギリギリ');
      }
    } else {
      // 予算オーバー（少しならマイナス少なめ）
      const over = school.price_min_aud - weeklyBudget;
      if (over <= 50) {
        breakdown.budget = 10;
        matchReasons.push('予算を少しオーバー');
      } else {
        breakdown.budget = 0;
      }
    }
  } else {
    breakdown.budget = 15; // データなし
  }

  // ==========================================
  // 2. 英語レベル適合度（20点）
  // ==========================================
  if (school.courses && school.courses.length > 0) {
    const matchingCourses = school.courses.filter(c =>
      cefrLevels.some(level =>
        c.level_min <= level && level <= c.level_max
      )
    );

    if (matchingCourses.length > 0) {
      breakdown.level = 20;
      matchReasons.push('レベルに合うコースあり');
    } else {
      breakdown.level = 5;
    }
  } else {
    breakdown.level = 10; // データなし
  }

  // ==========================================
  // 3. サポート充実度（20点）
  // ==========================================
  let supportScore = 0;

  // 初心者向けサポート
  if (userAnswers.english === 'beginner' || userAnswers.english === null) {
    if (school.support_japanese) {
      supportScore += 8;
      matchReasons.push('日本語サポートあり');
    }
  }

  // 仕事サポート
  if (userAnswers.purpose === 'work' || userAnswers.purpose === 'career') {
    if (school.support_job) {
      supportScore += 7;
      matchReasons.push('就職サポートあり');
    }
  }

  // 住居サポート
  if (school.support_accommodation) {
    supportScore += 5;
    matchReasons.push('住居サポートあり');
  }

  breakdown.support = Math.min(20, supportScore);

  // ==========================================
  // 4. 学習環境（15点）
  // ==========================================
  let envScore = 0;

  // 日本人比率（英語環境重視の場合）
  if (userAnswers.purpose === 'english' || userAnswers.priority === 'schools') {
    if (school.japanese_ratio !== null) {
      if (school.japanese_ratio <= 0.1) {
        envScore += 7;
        matchReasons.push('日本人比率10%以下');
      } else if (school.japanese_ratio <= 0.2) {
        envScore += 5;
      } else {
        envScore += 2;
      }
    }
  } else if (userAnswers.english === 'beginner') {
    // 初心者には日本人がいる方が安心
    if (school.japanese_ratio !== null && school.japanese_ratio >= 0.05) {
      envScore += 5;
      matchReasons.push('日本人学生もいて安心');
    }
  }

  // 国籍多様性
  if (school.nationality_diversity === '多国籍') {
    envScore += 5;
    matchReasons.push('多国籍環境');
  }

  // 認定校
  if (school.accredited) {
    envScore += 3;
  }

  breakdown.environment = Math.min(15, envScore);

  // ==========================================
  // 5. 評価・信頼性（15点）
  // ==========================================
  if (school.rating !== null && school.review_count !== null) {
    // レビュー数で信頼度を調整
    const trustFactor = Math.min(school.review_count / 100, 1);
    const ratingScore = (school.rating / 5.0) * 15 * trustFactor;
    breakdown.rating = Math.round(ratingScore);
  } else {
    breakdown.rating = 5; // データなし
  }

  // ==========================================
  // ボーナス・ペナルティ
  // ==========================================

  // 都市一致ボーナス
  if (targetCity && school.city === targetCity) {
    breakdown.budget += 5;
    matchReasons.push(`${targetCity}に所在`);
  }

  // 推奨コースがあるボーナス
  if (school.courses?.some(c => c.recommended)) {
    breakdown.level += 3;
  }

  // 目的に合うコース
  if (school.courses?.some(c => c.purpose.some(p => courseTypes.includes(p)))) {
    breakdown.level += 2;
    matchReasons.push('目的に合うコースあり');
  }

  // 働きながら学びたい場合、夜間コースがあるか
  if (userAnswers.purpose === 'work') {
    if (school.courses?.some(c => c.time_slot === 'evening')) {
      breakdown.budget += 3;
      matchReasons.push('夜間コースあり');
    }
  }

  // ==========================================
  // 合計スコア計算
  // ==========================================
  const totalScore = Math.min(100,
    breakdown.budget +
    breakdown.level +
    breakdown.support +
    breakdown.environment +
    breakdown.rating
  );

  return {
    school_id: school.school_id,
    name: school.name,
    name_ja: school.name_ja,
    city: school.city,
    totalScore: Math.round(totalScore),
    breakdown,
    matchReasons
  };
}

/** 全学校をスコアリングして順位付けする */
export function rankSchools(
  schools: SchoolData[],
  userAnswers: UserAnswers,
  targetCity?: string
): SchoolScoreResult[] {
  return schools
    .map(school => calculateSchoolScore(school, userAnswers, targetCity))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, i) => ({ ...result, rank: i + 1 }));
}
