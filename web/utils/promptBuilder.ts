/**
 * 会話フェーズ・収集済み情報・スコアリング結果に基づいて
 * チャットAPIのシステムプロンプト追加セクションを構築する
 */

import type { ConversationState, CollectedInfo } from './conversationManager';
import type { CityScoreResult }                  from './scoring';
import type { SchoolFlag, AccommodationFlag }     from './flags';

/** 会話状態とスコア結果を受け取り、フェーズ専用の追加プロンプトを返す */
export function buildConversationPrompt(
  state:         ConversationState,
  scoreResults?: CityScoreResult[]
): string {
  const parts: string[] = [];
  const { collectedInfo, currentPhase } = state;

  // 収集済み情報のサマリー
  const infoLines: string[] = [];
  if (collectedInfo.purpose)  infoLines.push(`目的: ${purposeLabel(collectedInfo.purpose)}`);
  if (collectedInfo.budget)   infoLines.push(`予算: ${budgetLabel(collectedInfo.budget)}`);
  if (collectedInfo.english)  infoLines.push(`英語力: ${englishLabel(collectedInfo.english)}`);
  if (collectedInfo.priority) infoLines.push(`重視条件: ${priorityLabel(collectedInfo.priority)}`);
  if (collectedInfo.period)   infoLines.push(`滞在期間: ${collectedInfo.period}`);
  if (collectedInfo.timing)   infoLines.push(`出発時期: ${collectedInfo.timing}`);

  if (infoLines.length > 0) {
    parts.push(`\n\n# このユーザーの収集済み情報\n${infoLines.join('\n')}`);
  }

  parts.push(`\n\n# 現在の会話フェーズ: ${phaseLabel(currentPhase)}`);

  // フェーズ別の詳細指示
  switch (currentPhase) {
    case 'greeting':
      parts.push('\nまず共感の一言を述べ、「どんなことを叶えたいですか？」と最初の質問をしてください。');
      break;

    case 'info_gathering':
      parts.push('\n' + buildInfoGatheringInstruction(collectedInfo));
      break;

    case 'country':
      parts.push('\nオーストラリアのワーホリ・留学を自信を持っておすすめし、次に都市を絞りましょうと自然につなげてください。');
      break;

    case 'city':
      if (scoreResults && scoreResults.length > 0) {
        parts.push('\n' + buildCityProposalInstruction(scoreResults, collectedInfo));
      }
      break;

    case 'school':
      if (scoreResults && scoreResults.length > 0) {
        parts.push('\n' + buildSchoolInstruction(scoreResults[0].flags.school, collectedInfo));
      }
      break;

    case 'accommodation':
      if (scoreResults && scoreResults.length > 0) {
        parts.push('\n' + buildAccommodationInstruction(scoreResults[0].flags.accommodation, state.proposedCity));
      }
      break;

    case 'summary':
      parts.push('\n' + buildSummaryInstruction(state, scoreResults));
      break;
  }

  return parts.join('');
}

// ── フェーズ別指示ビルダー ──────────────────────────────────

function buildInfoGatheringInstruction(info: CollectedInfo): string {
  const missing: string[] = [];
  if (!info.purpose)  missing.push('目的（英語力向上・お金を稼ぐ・キャリア・海外体験・永住権）');
  if (!info.budget)   missing.push('予算（100万未満・100〜200万・200万以上・未定）');
  if (!info.english)  missing.push('英語力（初心者・日常会話・ビジネスレベル）');
  if (!info.priority) missing.push('重視条件（生活費・治安・仕事・気候・日本人コミュニティなど）');

  if (missing.length === 0) {
    return '必要な情報が揃いました。オーストラリアを提案するフェーズに進んでください。';
  }

  const current = missing[0];
  let prompt = `\n**重要**: あなたには最適な都市・学校を提案するために、以下の情報が必要です：\n${missing.join('、')}\n\n`;

  // 具体的な質問例を提示
  if (current.includes('目的')) {
    prompt += `まず「${current}」を確認してください。\n\n質問例：「留学・ワーホリの目的を教えてください😊」\n① 英語力を上げたい\n② 働いてお金を貯めたい\n③ キャリアアップしたい\n④ 海外生活を経験したい\n⑤ 永住権を目指したい\n\nこのような選択肢を使って、明確に質問してください。`;
  } else if (current.includes('予算')) {
    prompt += `次に「${current}」を確認してください。\n\n質問例：「予算はどれくらいを考えていますか？💰」\n① 100万円未満（節約重視）\n② 100〜200万円（一般的）\n③ 200万円以上（余裕あり）\n④ まだ決めていない\n\nこのような選択肢を使って、明確に質問してください。`;
  } else if (current.includes('英語力')) {
    prompt += `次に「${current}」を確認してください。\n\n質問例：「現在の英語力を教えてください📚」\n① 全く話せない（初心者）\n② 日常会話ができる（中級）\n③ ビジネスレベル（上級）\n\nこのような選択肢を使って、明確に質問してください。`;
  } else if (current.includes('重視条件')) {
    prompt += `最後に「${current}」を確認してください。\n\n質問例：「何を一番重視しますか？✨」\n① 生活費の安さ\n② 治安の良さ\n③ 仕事の見つけやすさ\n④ 気候・過ごしやすさ\n⑤ 日本人コミュニティ\n⑥ 学校の選択肢\n\nこのような選択肢を使って、明確に質問してください。`;
  }

  prompt += `\n\n**注意**: すでに会話から読み取れる情報は質問せずスキップしてください。\n例：「お金がなくて不安」→ 予算は低めと判断、「英語が全然できなくて」→ 初心者と判断。`;

  return prompt;
}

function buildCityProposalInstruction(results: CityScoreResult[], info: CollectedInfo): string {
  const top    = results[0];
  const second = results[1];

  // スコアが高い項目を理由として使う
  const topContribs = Object.entries(top.breakdown)
    .sort((a, b) => b[1].contribution - a[1].contribution)
    .slice(0, 2)
    .map(([k, v]) => `${scoreKeyLabel(k)}（${v.score.toFixed(1)}/5）`);

  const rankList = results.slice(0, 4)
    .map(r => `${r.rank}位: ${r.city}（${r.city_en}）= ${r.totalScore}点`)
    .join('\n');

  return `スコアリング結果（あなたの条件での100点満点）:
${rankList}

【都市提案の指示】
1. 「あなたには${top.city}が最適です」と結論を先に断言してください
2. 主な理由を2〜3文で説明: ${info.priority ? priorityLabel(info.priority) + 'を重視 + ' : ''}${topContribs.join('と')}が高評価
3. ${second ? `「${second.city}との違い」を一言で述べてください` : ''}
4. ${top.city}で気をつけることを一言添えてください
5. 語学学校の話に自然につなげてください`;
}

function buildSchoolInstruction(flag: SchoolFlag, info: CollectedInfo): string {
  const dur  = { short: '1〜4週間', mid: '4〜12週間', long: '12週間以上' }[flag.duration];
  const type = { general: '一般英語コース', career: 'ビジネス英語・職業英語コース', university: '大学付属語学コース' }[flag.type];

  if (!flag.recommend) {
    return `語学学校は必須ではありませんが、最初の1〜2週間だけ通うと現地に馴染みやすいことを伝えてください。リストにある学校から1〜2校名を挙げて「選択肢として」提案してください。`;
  }

  return `語学学校に通うことを${info.purpose === 'english' ? '強く' : ''}おすすめしてください。
推奨期間: ${dur} / おすすめコースタイプ: ${type}
費用目安も一言添えてください（週約A$200〜400）。
システムプロンプトの語学学校リストから具体的な学校名を必ず1〜2校挙げて提案してください。`;
}

function buildAccommodationInstruction(flag: AccommodationFlag, city: string | null): string {
  const firstLabel = { homestay: 'ホームステイ', sharehouse: 'シェアハウス', apartment: 'アパート' }[flag.firstMonth];
  const afterLabel = { sharehouse: 'シェアハウス', apartment: 'アパート' }[flag.afterFirst];
  const cityName   = city ?? '選んだ都市';

  return `滞在先として最初は「${firstLabel}」をおすすめしてください。
理由: ${flag.reason}
${cityName}の相場も一言添えてください（ホームステイ: 週A$250〜350 / シェアハウス: 週A$150〜250）。
その後「${afterLabel}」への移行案も伝えてください。`;
}

function buildSummaryInstruction(state: ConversationState, results?: CityScoreResult[]): string {
  const city  = state.proposedCity ?? results?.[0]?.city ?? '（都市）';
  const flags = results?.[0]?.flags;
  const visa  = flags?.visa.type === 'student' ? '学生ビザ' : 'ワーキングホリデービザ';

  return `全ての提案が終わったので、以下の形式でわかりやすくまとめてください:

📍 行き先: ${city}（オーストラリア）
🎓 語学学校: [フラグに基づく期間と費用目安]
🏠 滞在先: [最初と移行先]
📄 ビザ: ${visa}
${flags?.visa.nextStep ? `⬆️ 将来のビザ: ${flags.visa.nextStep}` : ''}

最後に「次にやることをリストにしましょうか？」と聞いてください。`;
}

// ── ラベル変換ヘルパー ─────────────────────────────────────

function purposeLabel(p: string)  { return ({ english: '英語力向上', work: 'お金を稼ぐ', career: 'キャリア', experience: '海外体験・自己成長', pr: '永住権' } as Record<string, string>)[p] ?? p; }
function budgetLabel(b: string)   { return ({ low: '100万円未満', mid: '100〜200万円', high: '200万円以上', unknown: '未定' } as Record<string, string>)[b] ?? b; }
function englishLabel(e: string)  { return ({ beginner: '初心者', intermediate: '中級（日常会話）', advanced: '上級（ビジネス）', unknown: 'わからない' } as Record<string, string>)[e] ?? e; }
function priorityLabel(p: string) { return ({ cost: '生活費の安さ', jobs: '仕事の見つけやすさ', safety: '治安の良さ', climate: '気候・過ごしやすさ', japanese: '日本人コミュニティ', career: 'キャリア接続', schools: '学校の選択肢', experience: '体験重視' } as Record<string, string>)[p] ?? p; }
function phaseLabel(p: string)    { return ({ greeting: '挨拶', info_gathering: '情報収集', country: '国の提案', city: '都市の提案', school: '語学学校の提案', accommodation: '滞在先の提案', summary: 'まとめ' } as Record<string, string>)[p] ?? p; }
function scoreKeyLabel(k: string) { return ({ cost: '生活費', safety: '治安', climate: '気候・日照', jobs: '仕事', school: '語学学校の選択肢' } as Record<string, string>)[k] ?? k; }
