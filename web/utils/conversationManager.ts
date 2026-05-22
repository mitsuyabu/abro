/**
 * チャット会話の状態管理
 * フェーズ遷移・情報収集・UserAnswers変換を担当する
 */

import type { UserAnswers, Purpose, Budget, EnglishLevel, Priority } from './weights';

export type ConversationPhase =
  | 'greeting'       // 挨拶
  | 'info_gathering' // 情報収集（目的・予算・英語力・重視条件）
  | 'country'        // 国の提案（オーストラリア）
  | 'city'           // 都市の提案（スコアリング結果をもとに）
  | 'school'         // 語学学校の提案
  | 'accommodation'  // 滞在先の提案
  | 'summary';       // まとめ

export interface CollectedInfo {
  purpose:  Purpose;
  budget:   Budget;
  english:  EnglishLevel;
  priority: Priority;
  period:   string | null; // 滞在期間
  timing:   string | null; // 渡航時期
}

export interface ConversationState {
  collectedInfo:   CollectedInfo;
  currentPhase:    ConversationPhase;
  proposedCountry: string | null;
  proposedCity:    string | null;
}

export function getInitialState(): ConversationState {
  return {
    collectedInfo: {
      purpose: null, budget: null, english: null,
      priority: null, period: null, timing: null,
    },
    currentPhase:    'greeting',
    proposedCountry: null,
    proposedCity:    null,
  };
}

/**
 * ユーザーメッセージから情報を抽出して CollectedInfo を更新する
 * 既に収集済みの項目はスキップ（繰り返し質問しない）
 */
export function extractInfoFromMessage(message: string, current: CollectedInfo): CollectedInfo {
  const updated = { ...current };
  const m = message;

  // 目的
  if (!updated.purpose) {
    if (/英語(力|を|が).*(上げ|向上|伸ば|磨|習得)|語学(力|学校|留学)/.test(m)) {
      updated.purpose = 'english';
    } else if (/稼ぎ|稼ぐ|仕事し|バイト|働き|収入|お金を[稼作]/.test(m)) {
      updated.purpose = 'work';
    } else if (/キャリア|転職|就職|スキル|ビジネス/.test(m)) {
      updated.purpose = 'career';
    } else if (/永住|移住|PR/.test(m)) {
      updated.purpose = 'pr';
    } else if (/経験|自己成長|自分を試|海外体験|挑戦/.test(m)) {
      updated.purpose = 'experience';
    }
  }

  // 予算
  if (!updated.budget) {
    if (/100万/.test(m) || /お金がない|予算.*(少|低|厳)|少な(くて|い)/.test(m)) {
      updated.budget = 'low';
    } else if (/200万|150万|100[〜~から]200/.test(m)) {
      updated.budget = 'mid';
    } else if (/300万|気にしない|問題ない|余裕/.test(m)) {
      updated.budget = 'high';
    }
  }

  // 英語力
  if (!updated.english) {
    if (/全然|全く|初心者|ほとんどできない|できなくて/.test(m)) {
      updated.english = 'beginner';
    } else if (/日常会話|中級|ある程度|少しは/.test(m)) {
      updated.english = 'intermediate';
    } else if (/ビジネス|上級|流暢|ネイティブ/.test(m)) {
      updated.english = 'advanced';
    }
  }

  // 重視条件
  if (!updated.priority) {
    if (/治安|安全/.test(m)) {
      updated.priority = 'safety';
    } else if (/生活費|安く|節約|コスト/.test(m)) {
      updated.priority = 'cost';
    } else if (/仕事を見つけ|就職しやすい|求人/.test(m)) {
      updated.priority = 'jobs';
    } else if (/気候|天気|暖か|過ごしやす/.test(m)) {
      updated.priority = 'climate';
    } else if (/日本人|日本語/.test(m)) {
      updated.priority = 'japanese';
    } else if (/学校.*(多|選び)/.test(m)) {
      updated.priority = 'schools';
    }
  }

  return updated;
}

/** 基本情報（目的・予算・英語力）が揃っているかを判定 */
export function hasBasicInfo(info: CollectedInfo): boolean {
  return info.purpose !== null && info.budget !== null && info.english !== null;
}

/** CollectedInfo を UserAnswers に変換する */
export function toUserAnswers(info: CollectedInfo): UserAnswers {
  return {
    purpose:  info.purpose,
    budget:   info.budget,
    english:  info.english,
    priority: info.priority,
    period:   info.period,
    timing:   info.timing,
  };
}

/**
 * AIの返答テキストを分析してフェーズを次に進めるべきかを判断する
 * フェーズ遷移はサーバーサイドでも行うが、最終確定はクライアントに任せる
 */
export function advancePhase(state: ConversationState, aiResponse: string): ConversationPhase {
  const { currentPhase, collectedInfo } = state;

  switch (currentPhase) {
    case 'greeting':
      return 'info_gathering';

    case 'info_gathering':
      if (hasBasicInfo(collectedInfo)) return 'country';
      return 'info_gathering';

    case 'country':
      if (/どの都市|都市(を|の)|シドニー|メルボルン|ブリスベン/.test(aiResponse)) {
        return 'city';
      }
      return 'country';

    case 'city':
      if (/語学学校|スクール|school/i.test(aiResponse)) return 'school';
      return 'city';

    case 'school':
      if (/ホームステイ|シェアハウス|滞在先|住まい/.test(aiResponse)) return 'accommodation';
      return 'school';

    case 'accommodation':
      if (/まとめ|整理|以上です|次にやること/.test(aiResponse)) return 'summary';
      return 'accommodation';

    case 'summary':
      return 'summary';
  }
}
