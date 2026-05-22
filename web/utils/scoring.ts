/**
 * 都市スコアリングのメイン関数
 * Supabaseの生データ + ユーザー回答 → 100点満点のスコアと提案フラグを返す
 */

import { normalizeCost, normalizeSafety, normalizeClimate, normalizeJobs, normalizeSchools } from './normalize';
import { getWeights, getBudgetCorrection, getEnglishCorrection, type UserAnswers, type Weights } from './weights';
import { generateFlags, type ProposalFlags } from './flags';

/** Supabaseから結合して取得する都市の生データ */
export interface CityRawData {
  city_id:              string;   // 'sydney', 'melbourne' etc.
  city:                 string;   // 日本語名
  city_en:              string;   // 英語名
  rent_1br_city_aud:    number | null; // city_cost_of_living
  safety_index:         number | null; // city_safety
  sunshine_hours:       number | null; // city_climate
  score_jobs:           number | null; // city_jobs（一般求人スコア 1-5）
  score_japanese_jobs:  number | null; // city_jobs（日本語求人スコア 1-5）
  school_count:         number;        // schoolsテーブルの件数
}

export interface ScoreItem {
  score:        number; // 正規化スコア（1〜5）
  weight:       number; // 適用ウェイト
  contribution: number; // score × weight
}

export interface ScoreBreakdown {
  cost:    ScoreItem;
  safety:  ScoreItem;
  climate: ScoreItem;
  jobs:    ScoreItem;
  school:  ScoreItem;
}

export interface CityScoreResult {
  city_id:     string;
  city:        string;
  city_en:     string;
  totalScore:  number;         // 100点満点
  breakdown:   ScoreBreakdown;
  flags:       ProposalFlags;
  rank:        number;         // 1始まり
}

/** 1都市のスコアを計算する */
export function calculateCityScore(
  cityData:    CityRawData,
  userAnswers: UserAnswers
): Omit<CityScoreResult, 'rank'> {
  const englishLevel = (userAnswers.english ?? 'unknown') as 'beginner' | 'intermediate' | 'advanced' | 'unknown';

  const budgetCorr  = getBudgetCorrection(userAnswers.budget);
  const englishCorr = getEnglishCorrection(userAnswers.english);
  const weights: Weights = getWeights(userAnswers);

  // 1. 正規化（1〜5）
  let costScore    = normalizeCost(cityData.rent_1br_city_aud);
  const safetyScore  = normalizeSafety(cityData.safety_index);
  const climateScore = normalizeClimate(cityData.sunshine_hours);
  let jobScore     = normalizeJobs(cityData.score_jobs, cityData.score_japanese_jobs, englishLevel);
  const schoolScore  = normalizeSchools(cityData.school_count);

  // 2. 予算補正
  costScore += budgetCorr.costBonus;
  jobScore  += budgetCorr.jobsBonus;

  // 3. 英語力補正（日本語求人スコアへのボーナス）
  if (englishLevel === 'beginner' || englishLevel === 'unknown') {
    jobScore += englishCorr.japaneseBonus;
  } else if (englishLevel === 'advanced') {
    jobScore += englishCorr.englishBonus;
  }

  // 4. 高家賃ペナルティ（低予算ユーザーのみ）
  if (
    budgetCorr.rentPenaltyThreshold !== null &&
    cityData.rent_1br_city_aud !== null &&
    cityData.rent_1br_city_aud >= budgetCorr.rentPenaltyThreshold
  ) {
    costScore -= 1.0;
  }

  // 5. 1〜5 にクランプ
  const clamp = (v: number) => Math.min(5, Math.max(1, v));
  const s = {
    cost:    clamp(costScore),
    safety:  clamp(safetyScore),
    climate: clamp(climateScore),
    jobs:    clamp(jobScore),
    school:  clamp(schoolScore),
  };

  // 6. 貢献度計算
  const breakdown: ScoreBreakdown = {
    cost:    { score: s.cost,    weight: weights.cost,    contribution: s.cost    * weights.cost    },
    safety:  { score: s.safety,  weight: weights.safety,  contribution: s.safety  * weights.safety  },
    climate: { score: s.climate, weight: weights.climate, contribution: s.climate * weights.climate },
    jobs:    { score: s.jobs,    weight: weights.jobs,    contribution: s.jobs    * weights.jobs    },
    school:  { score: s.school,  weight: weights.school,  contribution: s.school  * weights.school  },
  };

  // 7. 100点換算
  const weightedSum = Object.values(breakdown).reduce((a, v) => a + v.contribution, 0);
  const maxPossible = Object.values(weights).reduce((a, w) => a + 5 * w, 0);
  const totalScore  = Math.round((weightedSum / maxPossible) * 100);

  // 8. フラグ生成
  const flags = generateFlags(userAnswers);

  return { city_id: cityData.city_id, city: cityData.city, city_en: cityData.city_en, totalScore, breakdown, flags };
}

/** 全都市をスコアリングして順位付けする */
export function rankCities(citiesData: CityRawData[], userAnswers: UserAnswers): CityScoreResult[] {
  return citiesData
    .map(city => calculateCityScore(city, userAnswers))
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((result, i) => ({ ...result, rank: i + 1 }));
}
