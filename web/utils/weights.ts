/**
 * ユーザーの回答に応じてスコアリングのウェイトを決定するテーブル
 */

export type Purpose  = 'english' | 'work' | 'career' | 'experience' | 'pr' | null;
export type Budget   = 'low' | 'mid' | 'high' | 'unknown' | null;
export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced' | 'unknown' | null;
export type Priority = 'cost' | 'jobs' | 'safety' | 'climate' | 'japanese' | 'career' | 'schools' | 'experience' | null;

export interface UserAnswers {
  purpose:  Purpose;
  budget:   Budget;
  english:  EnglishLevel;
  priority: Priority;
  period:   string | null;
  timing:   string | null;
}

export interface Weights {
  cost:    number;
  safety:  number;
  climate: number;
  jobs:    number;
  school:  number;
}

/** 目的・重視条件に応じたウェイトを計算する */
export function getWeights(answers: UserAnswers): Weights {
  const w: Weights = { cost: 1.0, safety: 1.0, climate: 1.0, jobs: 1.0, school: 1.0 };

  // 目的別ウェイト
  switch (answers.purpose) {
    case 'english':
      w.school  = 2.5;
      w.climate = 2.0; // 英語環境（日照＝活動量の代替指標）
      break;
    case 'work':
      w.jobs = 2.5;
      w.cost = 1.5;
      break;
    case 'career':
      w.school = 2.0;
      w.jobs   = 1.5;
      break;
    case 'experience':
      w.climate = 2.0;
      break;
    case 'pr':
      w.jobs   = 2.0;
      w.school = 1.5;
      break;
  }

  // 重視条件による上書き（目的ウェイトと最大値を取る）
  switch (answers.priority) {
    case 'cost':       w.cost    = Math.max(w.cost,    2.5); break;
    case 'jobs':       w.jobs    = Math.max(w.jobs,    2.5); break;
    case 'safety':     w.safety  = Math.max(w.safety,  2.5); break;
    case 'climate':    w.climate = Math.max(w.climate, 2.5); break;
    case 'japanese':   w.jobs    = Math.max(w.jobs,    2.0); break;
    case 'career':
    case 'schools':    w.school  = Math.max(w.school,  2.5); break;
    case 'experience': w.climate = Math.max(w.climate, 2.0); break;
  }

  return w;
}

export interface BudgetCorrection {
  costBonus:              number;
  jobsBonus:              number;
  rentPenaltyThreshold:   number | null; // この金額以上の都市にペナルティ
  schoolDuration:         'short' | 'mid' | 'long'; // 1-4w / 4-12w / 12w+
  accommodationPrefer:    'sharehouse' | 'homestay' | 'any';
}

/** 予算に応じた補正値を返す */
export function getBudgetCorrection(budget: Budget): BudgetCorrection {
  switch (budget) {
    case 'low':
      return {
        costBonus: 1.0, jobsBonus: 0,
        rentPenaltyThreshold: 1500,
        schoolDuration: 'short',
        accommodationPrefer: 'sharehouse',
      };
    case 'high':
      return {
        costBonus: 0, jobsBonus: 0.5,
        rentPenaltyThreshold: null,
        schoolDuration: 'long',
        accommodationPrefer: 'any',
      };
    default: // mid / unknown
      return {
        costBonus: 0, jobsBonus: 0,
        rentPenaltyThreshold: null,
        schoolDuration: 'mid',
        accommodationPrefer: 'homestay',
      };
  }
}

export interface EnglishCorrection {
  japaneseBonus: number;
  englishBonus:  number;
}

/** 英語力に応じた補正値を返す */
export function getEnglishCorrection(english: EnglishLevel): EnglishCorrection {
  switch (english) {
    case 'beginner':
    case 'unknown':
      return { japaneseBonus: 1.0, englishBonus: 0 };
    case 'advanced':
      return { japaneseBonus: 0,   englishBonus: 0.5 };
    default: // intermediate
      return { japaneseBonus: 0,   englishBonus: 0 };
  }
}
