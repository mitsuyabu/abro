/**
 * ユーザーの回答から語学学校・滞在先・ビザの提案フラグを生成する
 */

import type { UserAnswers } from './weights';

export interface SchoolFlag {
  recommend: boolean;
  duration:  'short' | 'mid' | 'long'; // short: 1〜4週 / mid: 4〜12週 / long: 12週以上
  type:      'general' | 'career' | 'university';
}

export interface AccommodationFlag {
  firstMonth: 'homestay' | 'sharehouse' | 'apartment';
  afterFirst: 'sharehouse' | 'apartment';
  reason:     string;
}

export interface VisaFlag {
  type:     'working_holiday' | 'student' | 'tourist';
  nextStep: string | null;
}

export interface ProposalFlags {
  school:        SchoolFlag;
  accommodation: AccommodationFlag;
  visa:          VisaFlag;
}

/** ユーザーの回答から全フラグを生成する */
export function generateFlags(answers: UserAnswers): ProposalFlags {
  return {
    school:        buildSchoolFlag(answers),
    accommodation: buildAccommodationFlag(answers),
    visa:          buildVisaFlag(answers),
  };
}

function buildSchoolFlag(a: UserAnswers): SchoolFlag {
  // 英語力向上が目的 → 中期・一般コースを強く推奨
  if (a.purpose === 'english') {
    return { recommend: true, duration: 'mid', type: 'general' };
  }
  // キャリア目的 → 長期・キャリアコース
  if (a.purpose === 'career') {
    return { recommend: true, duration: 'long', type: 'career' };
  }
  // 上級者 → 不要（短期は選択肢として提示）
  if (a.english === 'advanced') {
    return { recommend: false, duration: 'short', type: 'general' };
  }
  // 低予算・就労目的 → 短期のみ推奨
  if (a.budget === 'low' || a.purpose === 'work') {
    return { recommend: true, duration: 'short', type: 'general' };
  }
  // 永住権目的 → 中期・キャリアコース
  if (a.purpose === 'pr') {
    return { recommend: true, duration: 'mid', type: 'career' };
  }
  // 初心者 → 中期を推奨
  if (a.english === 'beginner' || a.english === 'unknown') {
    return { recommend: true, duration: 'mid', type: 'general' };
  }
  // デフォルト
  return { recommend: true, duration: 'mid', type: 'general' };
}

function buildAccommodationFlag(a: UserAnswers): AccommodationFlag {
  // 英語初心者・英語向上目的・自己成長 → ホームステイで英語漬け
  if (
    a.english === 'beginner' || a.english === 'unknown' ||
    a.purpose === 'english'  || a.purpose === 'experience'
  ) {
    return {
      firstMonth: 'homestay',
      afterFirst: 'sharehouse',
      reason: '英語環境と生活の安心感のため、最初はホームステイをおすすめします',
    };
  }
  // 低予算・就労目的 → シェアハウスでコスト削減
  if (a.budget === 'low' || a.purpose === 'work') {
    return {
      firstMonth: 'sharehouse',
      afterFirst: 'sharehouse',
      reason: '費用を抑えながら現地生活を始められるシェアハウスが最適です',
    };
  }
  // 高予算 → 選択肢を広く
  if (a.budget === 'high') {
    return {
      firstMonth: 'apartment',
      afterFirst: 'apartment',
      reason: '予算に余裕があるため、アパートやサービスアパートメントなど幅広い選択肢があります',
    };
  }
  // デフォルト：1ヶ月ホームステイ → シェアハウス
  return {
    firstMonth: 'homestay',
    afterFirst: 'sharehouse',
    reason: '最初の1ヶ月はホームステイで生活に慣れてから、シェアハウスに移行するのが一般的です',
  };
}

function buildVisaFlag(a: UserAnswers): VisaFlag {
  if (a.purpose === 'pr') {
    return {
      type: 'working_holiday',
      nextStep: '地方就労88日でセカンドビザを取得し、スキルドビザ（190/491）を目指すルートがあります',
    };
  }
  if (a.purpose === 'career') {
    return {
      type: 'student',
      nextStep: 'Graduate ビザや TSS ビザへの切り替えルートも将来的に検討できます',
    };
  }
  return { type: 'working_holiday', nextStep: null };
}
