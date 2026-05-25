'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { ChatInput } from '@/components/chat/ChatInput';
import { DynamicSidebar, SidebarContext, COUNTRY_DATA, CITY_DATA, AVATAR_STYLE, SchoolItem, CityItem } from '@/components/chat/DynamicSidebar';
import { CostSimulator, type ChatSync } from '@/components/chat/CostSimulator';
import { AgentContactModal } from '@/components/AgentContactModal';
import { getInitialState, advancePhase, type ConversationState } from '@/utils/conversationManager';

const SidebarMapMobile = dynamic(() => import('@/components/chat/SidebarMap'), { ssr: false });

const ACTION_CHIPS = [
  { id: 'plan',  emoji: '✨', label: 'プランを作る',    prompt: 'ワーホリ・留学のプランを一緒に考えたいです。' },
  { id: 'cost',  emoji: '💰', label: '費用シミュレート', prompt: '留学・ワーホリの費用をシミュレーションしたいです。' },
  { id: 'visa',  emoji: '📄', label: 'ビザについて',    prompt: 'ワーホリ・留学のビザ申請について教えてください。' },
  { id: 'agent', emoji: '🎓', label: 'エージェント相談', prompt: 'おすすめのエージェントを教えてください。' },
];

const DEFAULT_SUGGESTIONS = [
  'オーストラリアでワーホリしたい',
  '費用の目安を教えて',
  '英語力が低くても大丈夫？',
  '何から始めればいい？',
];

const SCHOOL_PREF_OPTIONS = [
  { id: 'cheap',   label: 'コスパ重視',      emoji: '💰', prompt: 'コスパが良く学費が安い' },
  { id: 'small',   label: '少人数クラス',     emoji: '👥', prompt: '少人数クラスで丁寧に教えてくれる' },
  { id: 'career',  label: '就職サポート',     emoji: '💼', prompt: '就職・キャリアサポートが充実している' },
  { id: 'fewJP',   label: '日本人が少ない',   emoji: '🌏', prompt: '日本人が少なく英語漬けになれる' },
  { id: 'beach',   label: '観光地・海近く',   emoji: '🏖️', prompt: 'ビーチや観光地の近くにある' },
  { id: 'popular', label: '人気・評判がいい', emoji: '⭐', prompt: '評判が良く人気がある' },
] as const;

function SchoolPreferenceChips({
  selected,
  onToggle,
  onSearch,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSearch: () => void;
}) {
  return (
    <div className="bg-gray-50 border border-border/60 rounded-2xl px-3 py-3 max-w-md">
      <p className="text-[11px] font-semibold text-muted mb-2">どんな学校を探していますか？（複数選択可）</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SCHOOL_PREF_OPTIONS.map(p => (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              selected.has(p.id)
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-primary border-border hover:border-primary/50 hover:bg-primary/5'
            }`}
          >
            <span>{p.emoji}</span>
            <span>{p.label}</span>
          </button>
        ))}
      </div>
      <button
        onClick={onSearch}
        disabled={selected.size === 0}
        className="w-full bg-primary text-white text-xs font-semibold py-2 rounded-xl disabled:opacity-40 hover:opacity-80 transition-all disabled:cursor-not-allowed"
      >
        {selected.size === 0 ? '条件を選んで学校を探す' : `選んだ条件（${selected.size}個）で学校を探す →`}
      </button>
    </div>
  );
}

interface GeneratedPlan {
  title: string;
  destination_country: string;
  destination_city: string;
  duration_label: string;
  budget_min_jpy: number;
  budget_max_jpy: number;
  initial_plan: string;
  reason: string;
  pre_departure: Record<string, string>;
  timeline: { period: string; tasks: string[] }[];
}

type QuickSelectType = 'school-duration' | 'stay-duration' | 'month' | null;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: SidebarContext;
  planData?: { id: string; plan: GeneratedPlan };
  quickSelect?: QuickSelectType;
}

// ── セッション管理 ────────────────────────────────────────────────────

interface SessionSummary {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
}

interface StoredSession {
  messages: Message[];
  conversationState: ConversationState;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function getSessionTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return '新しいチャット';
  const t = first.content.trim();
  return t.length > 28 ? t.slice(0, 28) + '…' : t;
}

function lsGetSessions(): SessionSummary[] {
  try {
    const raw = localStorage.getItem('abro-chat-sessions');
    return raw ? (JSON.parse(raw) as SessionSummary[]) : [];
  } catch { return []; }
}

function lsSaveSessions(sessions: SessionSummary[]): void {
  try { localStorage.setItem('abro-chat-sessions', JSON.stringify(sessions)); } catch { /* ignore */ }
}

function lsSaveSession(id: string, messages: Message[], conversationState: ConversationState): void {
  try {
    const stored: StoredSession = { messages, conversationState };
    localStorage.setItem(`abro-chat-session-${id}`, JSON.stringify(stored));
    const sessions = lsGetSessions();
    const title = getSessionTitle(messages);
    const idx = sessions.findIndex(s => s.id === id);
    const summary: SessionSummary = { id, title, updatedAt: Date.now(), messageCount: messages.length };
    if (idx >= 0) sessions[idx] = summary; else sessions.unshift(summary);
    lsSaveSessions(sessions);
  } catch { /* ignore */ }
}

function lsLoadSession(id: string): StoredSession | null {
  try {
    const raw = localStorage.getItem(`abro-chat-session-${id}`);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch { return null; }
}

function lsDeleteSession(id: string): void {
  try {
    localStorage.removeItem(`abro-chat-session-${id}`);
    lsSaveSessions(lsGetSessions().filter(s => s.id !== id));
  } catch { /* ignore */ }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function SessionDropdown({
  sessions,
  currentId,
  onNew,
  onLoad,
  onDelete,
}: {
  sessions: SessionSummary[];
  currentId: string;
  onNew: () => void;
  onLoad: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}) {
  return (
    <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="p-2 border-b border-border">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-primary/5 transition-colors text-left"
        >
          <span className="text-sm">✏️</span>
          <span className="text-sm font-semibold text-primary">新しいチャット</span>
        </button>
      </div>
      <div className="max-h-72 overflow-y-auto">
        {sessions.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">まだチャット履歴がありません</p>
        ) : (
          sessions.map(session => (
            <div
              key={session.id}
              onClick={() => onLoad(session.id)}
              className={`flex items-center group px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition-colors border-b border-border/40 last:border-0 ${
                session.id === currentId ? 'bg-primary/5' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-primary font-medium truncate">{session.title}</p>
                <p className="text-[10px] text-muted mt-0.5">{timeAgo(session.updatedAt)}</p>
              </div>
              <button
                onClick={(e) => onDelete(session.id, e)}
                className="ml-2 flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 text-muted hover:text-red-500 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────

function InlineCityCards({ cities, onSend }: { cities: CityItem[]; onSend: (text: string) => void }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
      {cities.map(city => (
        <button
          key={city.name}
          onClick={() => onSend(`${city.name}での留学・ワーホリについて詳しく教えてください。`)}
          className="flex-shrink-0 w-32 rounded-2xl overflow-hidden shadow-sm border border-border/60 hover:shadow-md hover:scale-[1.02] transition-all text-left"
        >
          <div className="relative h-20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={city.images[0]} alt={city.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
            <div className="absolute bottom-1.5 left-2 text-white text-[11px] font-bold leading-tight">
              {city.flag} {city.name}
            </div>
          </div>
          <div className="px-2 py-1.5 bg-white">
            <div className="text-[10px] text-muted">{city.country}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function InlineSchoolCards({ schools, onSelectSchool }: { schools: SchoolItem[]; onSelectSchool: (school: SchoolItem) => void }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
      {schools.map(school => {
        const photo = school.google_photos?.[0];
        return (
          <button
            key={school.id}
            onClick={() => onSelectSchool(school)}
            className="flex-shrink-0 w-64 rounded-2xl border border-border bg-white shadow-sm hover:shadow-md hover:scale-[1.01] transition-all text-left overflow-hidden"
          >
            {/* 画像 */}
            <div className="relative h-36 bg-gray-100">
              {photo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={photo} alt={school.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">🎓</div>
              )}
              {school.is_partner && (
                <span className="absolute top-2 left-2 text-[9px] bg-primary text-white px-2 py-0.5 rounded-full">提携校</span>
              )}
              {school.rating != null && (
                <span className="absolute top-2 right-2 text-[11px] font-semibold bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-amber-500">
                  ★ {Number(school.rating).toFixed(1)}
                </span>
              )}
            </div>
            {/* コンテンツ */}
            <div className="p-3">
              <div className="text-xs font-bold text-primary leading-snug line-clamp-2">{school.name}</div>
              <div className="text-[10px] text-muted mt-0.5">{school.city} · {school.type}</div>
              {school.review_count != null && (
                <div className="text-[10px] text-muted mt-0.5">{Number(school.review_count).toLocaleString()}件のレビュー</div>
              )}
              {school.fee_per_week && (
                <div className="text-sm font-bold text-primary mt-1.5">
                  ¥{school.fee_per_week.toLocaleString()}<span className="text-[10px] font-normal text-muted">/週</span>
                </div>
              )}
              <div className="mt-2 w-full bg-primary text-white text-[11px] font-semibold py-1.5 rounded-xl text-center">
                詳細を見る →
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function QuickSelectDuration({ type, onSend }: { type: 'school-duration' | 'stay-duration'; onSend: (text: string) => void }) {
  const schoolOptions = ['〜1ヶ月', '2〜3ヶ月', '4〜6ヶ月', '6ヶ月以上', '決まっていない'];
  const stayOptions = ['〜1ヶ月', '〜3ヶ月', '〜6ヶ月', '〜1年', '1年以上', '決まっていない'];
  const options = type === 'school-duration' ? schoolOptions : stayOptions;
  const label = type === 'school-duration' ? '学校に通う期間を選んでください' : '滞在期間を選んでください';
  const prefix = type === 'school-duration' ? '語学学校に通う期間は' : '滞在期間は';

  return (
    <div className="mt-2 pl-9 sm:pl-11">
      <p className="text-[11px] text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => onSend(`${prefix}${opt}です`)}
            className="px-4 py-2 rounded-full border border-border text-sm text-primary hover:border-primary hover:bg-primary/5 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickSelectMonth({ onSend }: { onSend: (text: string) => void }) {
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    return {
      label: `${d.getMonth() + 1}月`,
      year: d.getFullYear(),
      text: `${d.getFullYear()}年${d.getMonth() + 1}月頃に行きたいです`,
    };
  });

  return (
    <div className="mt-2 pl-9 sm:pl-11">
      <p className="text-[11px] text-muted mb-2">出発予定月を選んでください</p>
      <div className="grid grid-cols-4 gap-2 max-w-xs">
        {months.map((m, i) => (
          <button
            key={i}
            onClick={() => onSend(m.text)}
            className="flex flex-col items-center py-2 px-1 rounded-xl border border-border text-primary hover:border-primary hover:bg-primary/5 transition-all"
          >
            <span className="text-sm font-semibold">{m.label}</span>
            <span className="text-[10px] text-muted">{m.year}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 推薦・フォーカスを示すパターン
const CITY_FOCUS_PATTERNS = [
  'がおすすめ', 'をおすすめ', 'をご提案', 'をご紹介', 'が候補', 'を候補',
  'での留学', 'でのワーホリ', 'での生活', 'に行く', 'に滞在', 'を選ぶ',
  'に絞', 'を中心', 'を第一候補', 'が有力', 'に注目', 'がぴったり',
];

function cityIsFocused(cityName: string, content: string): boolean {
  const count = (content.match(new RegExp(cityName, 'g')) || []).length;
  if (count >= 2) return true;
  return CITY_FOCUS_PATTERNS.some(pat => {
    const idx = content.indexOf(pat);
    if (idx === -1) return false;
    const window = content.slice(Math.max(0, idx - 50), idx + 50);
    return window.includes(cityName);
  });
}

function detectSidebarContext(content: string, userMessage: string, allSchools: SchoolItem[]): SidebarContext {
  const cities = CITY_DATA.filter(c =>
    userMessage.includes(c.name) || cityIsFocused(c.name, content)
  );

  const cityCountryNames = new Set(cities.map(c => c.country));
  const countries = COUNTRY_DATA.filter(c => content.includes(c.name) && !cityCountryNames.has(c.name));
  const showAgents =
    content.includes('エージェント') &&
    (content.includes('相談') || content.includes('おすすめ') || content.includes('提案') || content.includes('紹介'));
  const lowerContent = content.toLowerCase();

  const mentionsSchoolTopic =
    content.includes('語学学校') || lowerContent.includes('english school') || lowerContent.includes('language school');

  let targetCityNames: Set<string>;
  if (cities.length > 1) {
    const cityCounts = cities.map(c => ({
      name: c.name,
      count: (content.match(new RegExp(c.name, 'g')) || []).length,
    }));
    const maxCount = Math.max(...cityCounts.map(c => c.count));
    const dominant = cityCounts.filter(c => c.count >= maxCount * 0.8);
    targetCityNames = new Set(
      dominant.length === 1 ? [dominant[0].name] : cities.map(c => c.name)
    );
  } else {
    targetCityNames = new Set(cities.map(c => c.name));
  }

  const schoolsByName = targetCityNames.size > 0
    ? allSchools.filter(s => lowerContent.includes(s.name.toLowerCase()) && targetCityNames.has(s.city))
    : allSchools.filter(s => lowerContent.includes(s.name.toLowerCase()));

  const schoolsByCity = mentionsSchoolTopic && targetCityNames.size > 0
    ? allSchools.filter(s => targetCityNames.has(s.city))
    : [];

  const merged = new Map([...schoolsByName, ...schoolsByCity].map(s => [s.id, s]));
  const schools = [...merged.values()];

  return { cities, countries, schools, showAgents };
}

function detectQuickSelect(content: string): QuickSelectType {
  const schoolPatterns = [
    '学校に通う期間', '語学学校の期間', '通う期間', '何ヶ月通', '就学期間', '通学期間',
    '語学学校に通う', '学校期間',
  ];
  const stayPatterns = [
    '滞在期間', 'どのくらい滞在', '何ヶ月滞在', '留学期間', 'ワーホリ期間',
    'どのくらいの期間', '期間を考えて', '期間はどのくらい', '何ヶ月くらい',
    '期間について', 'どれくらいの期間', '何ヶ月お', '何ヶ月間',
  ];
  const monthPatterns = [
    'いつ頃', '何月', '出発時期', '行く時期', '渡航時期', 'いつ出発',
    '何月ごろ', '何月から', '何月に行', '時期はいつ', '出発はいつ', 'いつから',
  ];

  if (schoolPatterns.some(p => content.includes(p))) return 'school-duration';
  if (stayPatterns.some(p => content.includes(p))) return 'stay-duration';
  if (monthPatterns.some(p => content.includes(p))) return 'month';
  return null;
}

function parseChoices(content: string): string[] {
  const regex = /[①②③④⑤⑥]\s*.{2,25}/g;
  return (content.match(regex) || []).slice(0, 6).map(s => s.trim());
}

function getContextSuggestions(context: SidebarContext, latestAI: string): string[] {
  const choices = parseChoices(latestAI);
  if (choices.length >= 2) return choices;
  if (context.cities.length > 0) {
    const city = context.cities[0].name;
    return [`${city}の費用を詳しく教えて`, `${city}での仕事の探し方`, `${city}の語学学校は？`, '他の都市と比べてみて'];
  }
  if (context.countries.length > 0) {
    const country = context.countries[0].name;
    return [`${country}のおすすめ都市は？`, `${country}のビザ申請方法`, `${country}の費用詳細`, '他の国も見たい'];
  }
  return DEFAULT_SUGGESTIONS;
}

const avatarStyle: React.CSSProperties = AVATAR_STYLE; // unused but kept for type compat

const PRE_DEPARTURE_LABELS: Record<string, string> = {
  visa: 'ビザ申請',
  school: '学校選び',
  accommodation: '宿泊・住まい',
  insurance: '保険',
  flights: '航空券',
  local_preparation: '現地準備',
  job_search: '仕事探し',
  english_study: '英語学習',
};

function PlanCard({ planId, plan }: { planId: string; plan: GeneratedPlan }) {
  const [expanded, setExpanded] = useState(false);
  const budgetMin = Math.round(plan.budget_min_jpy / 10000);
  const budgetMax = Math.round(plan.budget_max_jpy / 10000);

  return (
    <div className="mt-2 pl-9 sm:pl-11">
      <div className="border border-primary/20 rounded-2xl overflow-hidden bg-white shadow-sm max-w-md">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-primary/90 to-primary px-4 py-3">
          <p className="text-white text-[11px] font-semibold uppercase tracking-wide opacity-80">AI プラン</p>
          <h3 className="text-white text-sm font-bold leading-snug mt-0.5">{plan.title}</h3>
        </div>

        {/* 概要 */}
        <div className="px-4 py-3 flex flex-col gap-2">
          <div className="flex flex-wrap gap-3 text-[12px] text-primary/80">
            <span>📍 {plan.destination_country} / {plan.destination_city}</span>
            <span>🗓 {plan.duration_label}</span>
            <span>💰 {budgetMin}〜{budgetMax}万円</span>
          </div>

          {plan.initial_plan && (
            <p className="text-xs text-muted leading-relaxed">{plan.initial_plan}</p>
          )}

          {plan.reason && (
            <div className="bg-primary/5 rounded-xl px-3 py-2">
              <p className="text-xs text-primary leading-relaxed">{plan.reason}</p>
            </div>
          )}

          {/* 渡航前準備トグル */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center justify-between w-full text-xs font-semibold text-primary mt-1 hover:opacity-70 transition-opacity"
          >
            <span>渡航前準備を見る</span>
            <span>{expanded ? '▲' : '▼'}</span>
          </button>

          {expanded && plan.pre_departure && (
            <div className="flex flex-col gap-2 mt-1">
              {Object.entries(plan.pre_departure).map(([key, val]) => (
                <div key={key} className="border border-border rounded-xl px-3 py-2">
                  <p className="text-[11px] font-bold text-primary mb-0.5">{PRE_DEPARTURE_LABELS[key] ?? key}</p>
                  <p className="text-[11px] text-muted leading-relaxed">{val}</p>
                </div>
              ))}
            </div>
          )}

          <a
            href="/plans"
            className="mt-1 w-full bg-primary text-white text-xs font-semibold py-2 rounded-xl text-center block hover:opacity-80 transition-opacity"
          >
            プランページで確認する →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [showCostSimulator, setShowCostSimulator] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<SidebarContext>({ countries: [], cities: [], schools: [], showAgents: false });
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [agentBannerDismissed, setAgentBannerDismissed] = useState(false);
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const [sidebarFocusedSchool, setSidebarFocusedSchool] = useState<SchoolItem | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>(getInitialState());
  const [chatLoaded, setChatLoaded] = useState(false);

  // 学校絞り込み条件
  const [schoolPreferences, setSchoolPreferences] = useState<Set<string>>(new Set());

  // セッション管理
  const sessionIdRef = useRef<string>(generateId());
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [showSessionDropdown, setShowSessionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const msgCountRef = useRef(0);

  // 起動時：セッション読み込み（旧フォーマットからの移行も対応）
  useEffect(() => {
    try {
      const savedSessions = lsGetSessions();

      if (savedSessions.length === 0) {
        // 旧フォーマット（abro-chat-messages）から移行
        const savedMsgs = localStorage.getItem('abro-chat-messages');
        const savedState = localStorage.getItem('abro-conversation-state');
        if (savedMsgs) {
          const parsed = JSON.parse(savedMsgs) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            const state: ConversationState = savedState ? JSON.parse(savedState) : getInitialState();
            lsSaveSession(sessionIdRef.current, parsed, state);
            setMessages(parsed);
            setConversationState(state);
            msgCountRef.current = parsed.length;
            localStorage.removeItem('abro-chat-messages');
            localStorage.removeItem('abro-conversation-state');
            setSessions(lsGetSessions());
          }
        }
      } else {
        // 最新セッションを読み込む
        const latest = savedSessions[0];
        sessionIdRef.current = latest.id;
        const data = lsLoadSession(latest.id);
        if (data) {
          setMessages(data.messages);
          setConversationState(data.conversationState);
          msgCountRef.current = data.messages.length;
        }
        setSessions(savedSessions);
      }
    } catch { /* ignore */ }
    setChatLoaded(true);
  }, []);

  // メッセージ・会話状態が変わったら自動保存
  useEffect(() => {
    if (!chatLoaded) return;
    if (messages.length === 0) return;
    lsSaveSession(sessionIdRef.current, messages, conversationState);
  }, [messages, conversationState, chatLoaded]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      lsSaveSession(sessionIdRef.current, messages, conversationState);
    }
    sessionIdRef.current = generateId();
    setMessages([]);
    setConversationState(getInitialState());
    setSidebarContext({ countries: [], cities: [], schools: [], showAgents: false });
    setPlanError(null);
    msgCountRef.current = 0;
    setShowSessionDropdown(false);
    setSessions(lsGetSessions());
  };

  const handleLoadSession = (id: string) => {
    if (id === sessionIdRef.current) {
      setShowSessionDropdown(false);
      return;
    }
    if (messages.length > 0) {
      lsSaveSession(sessionIdRef.current, messages, conversationState);
    }
    const data = lsLoadSession(id);
    if (!data) return;
    sessionIdRef.current = id;
    setMessages(data.messages);
    setConversationState(data.conversationState);
    setSidebarContext({ countries: [], cities: [], schools: [], showAgents: false });
    setPlanError(null);
    msgCountRef.current = data.messages.length;
    setShowSessionDropdown(false);
    setSessions(lsGetSessions());
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    lsDeleteSession(id);
    const updated = lsGetSessions();
    setSessions(updated);
    // 現在のセッションを削除した場合は新規作成
    if (id === sessionIdRef.current) {
      sessionIdRef.current = generateId();
      setMessages([]);
      setConversationState(getInitialState());
      setSidebarContext({ countries: [], cities: [], schools: [], showAgents: false });
      setPlanError(null);
      msgCountRef.current = 0;
    }
  };

  const handleToggleDropdown = () => {
    if (!showSessionDropdown) {
      setSessions(lsGetSessions()); // 開く前に最新を取得
    }
    setShowSessionDropdown(v => !v);
  };

  const toggleSchoolPreference = (id: string) => {
    setSchoolPreferences(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSchoolPreferenceSearch = () => {
    if (schoolPreferences.size === 0) return;
    const conditions = SCHOOL_PREF_OPTIONS
      .filter(p => schoolPreferences.has(p.id))
      .map(p => p.prompt)
      .join('、');
    const cityPrefix = conversationState.proposedCity ? `${conversationState.proposedCity}で` : '';
    handleSend(`${cityPrefix}${conditions}語学学校を具体的に教えてください`);
    setSchoolPreferences(new Set());
  };

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    if (!showSessionDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSessionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSessionDropdown]);

  useEffect(() => {
    fetch('/api/schools').then(r => r.json()).then(data => {
      if (Array.isArray(data)) {
        setAllSchools(data);
        console.log('[Abro] schools loaded:', data.length, data.map((s: SchoolItem) => s.name));
      } else {
        console.warn('[Abro] schools API returned non-array:', data);
      }
    }).catch(e => console.error('[Abro] schools fetch error:', e));
  }, []);

  // メッセージ数が増えた時だけ最下部へスクロール
  useEffect(() => {
    if (messages.length > msgCountRef.current) {
      msgCountRef.current = messages.length;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    const aiId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: aiId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          collectedInfo: conversationState.collectedInfo,
          currentPhase:  conversationState.currentPhase,
        }),
      });

      const metaHeader = res.headers.get('X-Abro-Meta');
      if (metaHeader) {
        try {
          const meta = JSON.parse(metaHeader) as {
            collectedInfo: ConversationState['collectedInfo'];
            currentPhase:  ConversationState['currentPhase'];
            scoreResult:   { city: string; city_en: string; totalScore: number; rank: number }[] | null;
          };
          setConversationState(prev => ({
            ...prev,
            collectedInfo:   meta.collectedInfo,
            currentPhase:    meta.currentPhase,
            proposedCity:    meta.scoreResult?.[0]?.city ?? prev.proposedCity,
            proposedCountry: 'オーストラリア',
          }));
        } catch { /* メタ解析失敗は無視 */ }
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullContent += chunk;
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, content: m.content + chunk } : m));
      }

      setConversationState(prev => {
        const nextPh = advancePhase(prev, fullContent);
        return nextPh !== prev.currentPhase ? { ...prev, currentPhase: nextPh } : prev;
      });

      const ctx = detectSidebarContext(fullContent, text, allSchools);
      const quickSelect = detectQuickSelect(fullContent);
      setSidebarContext(ctx);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, context: ctx, quickSelect } : m));

      const extractMsgs = [...newMessages, { role: 'assistant', content: fullContent }];
      fetch('/api/extract-travel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: extractMsgs.map(m => ({ role: m.role, content: m.content })) }),
      }).catch(() => {/* 失敗しても無視 */});
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === aiId ? { ...m, content: 'エラーが発生しました。もう一度お試しください。' } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.map(m => ({ role: m.role, content: m.content })) }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({})) as { error?: string };
        if (res.status === 401) {
          setPlanError('セッションが切れています。再ログインしてください。');
        } else {
          setPlanError(errData.error ?? 'プランの作成に失敗しました。もう一度お試しください。');
        }
        return;
      }

      const data = await res.json() as { id: string; plan: GeneratedPlan };
      if (data.id && data.plan) {
        const planMsg: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'プランを作成しました！内容を確認してください。',
          planData: { id: data.id, plan: data.plan },
        };
        setMessages(prev => [...prev, planMsg]);
      } else {
        setPlanError('プランの作成に失敗しました。もう一度お試しください。');
      }
    } catch {
      setPlanError('ネットワークエラーが発生しました。接続を確認してください。');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const isEmpty = messages.length === 0;
  const latestAI = messages.filter(m => m.role === 'assistant').at(-1)?.content ?? '';
  const suggestions = isEmpty ? DEFAULT_SUGGESTIONS : getContextSuggestions(sidebarContext, latestAI);

  // チャット内容からシミュレーター連動データを抽出
  const chatSyncData = useMemo((): ChatSync => {
    const toHalf = (s: string) =>
      s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFF10 + 0x30));

    const extractWeeks = (text: string): number | null => {
      const t = toHalf(text);
      if (/1年|１年/.test(t))                         return 52;
      if (/半年|6ヶ月|6か月|6カ月|6ヵ月/.test(t))    return 26;
      const m = t.match(/(\d+)\s*(?:ヶ月|か月|カ月|ヵ月|箇月)/);
      if (m) {
        const months = parseInt(m[1]);
        const raw = Math.round(months * 4.3);
        return Math.min(52, Math.max(4, Math.round(raw / 2) * 2));
      }
      return null;
    };

    const userMessages = messages.filter(m => m.role === 'user');

    // 都市：proposedCity → ユーザーメッセージ走査 → AI返答（2回以上言及）の順で検索
    const SYNC_CITIES = ['シドニー', 'メルボルン', 'ブリスベン', 'ゴールドコースト', 'ケアンズ', 'パース'];
    let city: string | null = conversationState.proposedCity ?? null;
    if (!city) {
      outer:
      for (const msg of [...userMessages].reverse().slice(0, 5)) {
        for (const c of SYNC_CITIES) {
          if (msg.content.includes(c)) { city = c; break outer; }
        }
      }
    }
    if (!city && latestAI) {
      for (const c of SYNC_CITIES) {
        if ((latestAI.match(new RegExp(c, 'g')) || []).length >= 2) { city = c; break; }
      }
    }

    // 滞在期間：ユーザーメッセージのみ走査（AIの「最大1年のビザ」等の誤検知を防ぐ）
    let totalWeeks: number | null = null;
    for (const msg of [...userMessages].reverse().slice(0, 5)) {
      const w = extractWeeks(msg.content);
      if (w !== null) { totalWeeks = w; break; }
    }

    // 語学学校週数：最新AI返答から抽出
    let schoolWeeks: number | null = null;
    if (latestAI) {
      const halfAI = toHalf(latestAI);
      const sMatch = halfAI.match(/(\d+)\s*週間?.*?(?:語学学校|学校)|(?:語学学校|学校).*?(\d+)\s*週間?/);
      if (sMatch) {
        const w = parseInt(sMatch[1] ?? sMatch[2] ?? '0');
        if (w >= 1 && w <= 52) schoolWeeks = w;
      }
    }

    return { city, totalWeeks, schoolWeeks };
  }, [conversationState.proposedCity, messages, latestAI]);

  const sidebarLabel =
    sidebarContext.showAgents ? 'エージェント' :
    sidebarContext.schools.length > 0 ? '語学学校' :
    sidebarContext.cities.length > 0 ? '候補の都市' :
    sidebarContext.countries.length > 0 ? '候補の国' : 'おすすめ';

  const hasRightContent =
    sidebarContext.cities.length > 0 ||
    sidebarContext.countries.length > 0 ||
    sidebarContext.schools.length > 0 ||
    sidebarContext.showAgents;

  const currentSessionTitle = messages.length > 0
    ? (messages.find(m => m.role === 'user')?.content.trim().slice(0, 25) ?? '新しいチャット')
    : '新しいチャット';

  // 学校を含む最後のAIメッセージID（絞り込みチップをそこだけ表示するため）
  const lastSchoolMsgId = messages
    .filter(m => m.role === 'assistant' && (m.context?.schools?.length ?? 0) > 0)
    .at(-1)?.id ?? null;

  return (
    <div className="flex h-full relative">
      {/* チャットエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* トップバー */}
        <div className="h-12 border-b border-border flex items-center px-4 md:px-5 bg-white gap-2">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={handleToggleDropdown}
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              <span className="text-sm font-semibold text-primary truncate max-w-[180px] sm:max-w-[240px]">
                {currentSessionTitle}
              </span>
              <span className="text-muted text-xs flex-shrink-0">▾</span>
            </button>
            {showSessionDropdown && (
              <SessionDropdown
                sessions={sessions}
                currentId={sessionIdRef.current}
                onNew={handleNewChat}
                onLoad={handleLoadSession}
                onDelete={handleDeleteSession}
              />
            )}
          </div>
          <span className="ml-auto text-xs font-medium text-primary/60 italic tracking-wide hidden sm:block">留学を、もっと自分らしく</span>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 overflow-y-auto bg-white">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-5 sm:px-8 pt-6">
              <div className="text-center gap-3 flex flex-col">
                <div className="flex justify-center mb-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/hero.png" alt="留学イラスト" className="w-40 sm:w-64 h-auto object-contain" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-primary">今日は何する？</h1>
                <p className="text-primary leading-relaxed text-sm sm:text-lg">
                  AI があなたの留学・ワーホリをまるごとサポートします。<br className="hidden sm:block" />
                  何でも気軽に聞いてみてください。
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-md">
                {ACTION_CHIPS.map(chip => (
                  <button
                    key={chip.id}
                    onClick={() => {
                      if (chip.id === 'cost') {
                        setShowCostSimulator(true);
                      } else {
                        handleSend(chip.prompt);
                      }
                    }}
                    className="bg-white border border-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:border-primary/40 hover:shadow-sm transition-all flex items-center gap-2 sm:gap-3"
                  >
                    <span className="text-lg sm:text-xl flex-shrink-0">{chip.emoji}</span>
                    <span className="text-xs sm:text-sm font-medium text-primary">{chip.label}</span>
                  </button>
                ))}
              </div>

              <div className="w-full max-w-lg px-0">
                <ChatInput onSend={handleSend} disabled={isLoading} />
                <p className="text-xs text-muted text-center mt-2 hidden sm:block">Shift+Enter で送信 · Enter で改行</p>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 sm:px-5 py-6 flex flex-col gap-5">
              {messages.map((msg, msgIndex) => (
                <div key={msg.id}>
                  <div className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src="/mascot.png"
                        alt="Abro"
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 mt-0.5 object-contain bg-white"
                      />
                    )}
                    <div
                      className={`max-w-[80%] sm:max-w-[75%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-primary text-white rounded-br-md'
                          : 'text-primary rounded-bl-md'
                      }`}
                      style={{ fontSize: '14px' }}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:my-2 prose-h1:text-[17px] prose-h2:text-[17px] prose-h3:text-[17px] sm:prose-h1:text-[18.75px] sm:prose-h2:text-[18.75px] sm:prose-h3:text-[18.75px] prose-h1:font-bold prose-h2:font-bold prose-h3:font-bold prose-p:text-[14px] prose-li:text-[14px] sm:prose-p:text-[15px] sm:prose-li:text-[15px]">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : msg.content}
                    </div>
                  </div>
                  {/* プランカード */}
                  {msg.role === 'assistant' && msg.planData && (
                    <PlanCard planId={msg.planData.id} plan={msg.planData.plan} />
                  )}
                  {/* インラインカード（AI返答の下） */}
                  {msg.role === 'assistant' && msg.context && !msg.planData && (
                    (msg.context.cities.length > 0 || msg.context.schools.length > 0) && (
                      <div className="mt-2 pl-9 sm:pl-11 flex flex-col gap-2">
                        {msg.context.cities.length > 0 && (
                          <InlineCityCards cities={msg.context.cities} onSend={handleSend} />
                        )}
                        {msg.context.schools.length > 0 && (
                          <>
                            <InlineSchoolCards
                              schools={msg.context.schools}
                              onSelectSchool={(school) => {
                                setSidebarFocusedSchool(school);
                                setShowRightPanel(true);
                              }}
                            />
                            {msg.id === lastSchoolMsgId && (
                              <SchoolPreferenceChips
                                selected={schoolPreferences}
                                onToggle={toggleSchoolPreference}
                                onSearch={handleSchoolPreferenceSearch}
                              />
                            )}
                          </>
                        )}
                      </div>
                    )
                  )}
                  {/* クイック選択UI（期間・月）：ユーザーがまだ返信していない場合のみ表示 */}
                  {msg.role === 'assistant' && msg.quickSelect && !msg.planData &&
                    !messages.slice(msgIndex + 1).some(m => m.role === 'user') && (
                    msg.quickSelect === 'month' ? (
                      <QuickSelectMonth onSend={handleSend} />
                    ) : (
                      <QuickSelectDuration type={msg.quickSelect} onSend={handleSend} />
                    )
                  )}
                </div>
              ))}

              {isLoading && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/mascot.png" alt="Abro" className="w-8 h-8 rounded-full flex-shrink-0 object-contain bg-white" />
                  <div className="bg-white border border-border rounded-2xl rounded-bl-md px-4 py-2.5 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* 入力欄（チャットあり） */}
        {!isEmpty && (
          <div className="border-t border-border bg-white px-4 sm:px-5 py-3 sm:py-4">
            <div className="max-w-2xl mx-auto">
              {/* モバイル：Mapボタン */}
              {hasRightContent && (
                <div className="lg:hidden flex justify-center mb-3">
                  <button
                    onClick={() => setShowMapView(true)}
                    className="flex items-center gap-2 bg-primary text-white rounded-full px-5 py-2 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity"
                  >
                    <span>🗺</span>
                    <span>Map</span>
                  </button>
                </div>
              )}
              {/* エージェントバナー（6件以上の会話で表示） */}
              {messages.length >= 6 && !agentBannerDismissed && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 mb-2">
                  <span className="text-xl flex-shrink-0">🎓</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-800">専門エージェントに相談しませんか？</p>
                    <p className="text-[11px] text-amber-700">無料カウンセリングでプランをより具体的に</p>
                  </div>
                  <button
                    onClick={() => setShowAgentModal(true)}
                    className="flex-shrink-0 bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full hover:opacity-80 transition-opacity"
                  >
                    相談する
                  </button>
                  <button onClick={() => setAgentBannerDismissed(true)} className="text-amber-400 hover:text-amber-600 flex-shrink-0 text-sm">✕</button>
                </div>
              )}

              {planError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mb-2 text-xs text-red-700">
                  <span>⚠️</span>
                  <span>{planError}</span>
                  <button onClick={() => setPlanError(null)} className="ml-auto text-red-400 hover:text-red-600">✕</button>
                </div>
              )}
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 sm:mb-3 scrollbar-hide">
                {messages.length >= 4 && (
                  <button
                    onClick={handleGeneratePlan}
                    disabled={isLoading || isGeneratingPlan}
                    className="flex-shrink-0 bg-primary text-white border border-primary rounded-full px-3 py-1.5 text-xs font-semibold hover:opacity-80 transition-all disabled:opacity-50 flex items-center gap-1"
                  >
                    {isGeneratingPlan ? (
                      <><span className="animate-spin inline-block">⏳</span> 作成中...</>
                    ) : (
                      <>✨ プランを作成する</>
                    )}
                  </button>
                )}
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    disabled={isLoading}
                    className="flex-shrink-0 bg-background border border-border rounded-full px-3 py-1.5 text-xs text-primary hover:border-primary/40 hover:bg-white transition-all disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <ChatInput onSend={handleSend} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>

      {/* デスクトップ固定右パネル */}
      <div className="hidden lg:flex w-96 xl:w-[420px] border-l border-border bg-background flex-shrink-0 flex-col h-full overflow-hidden">
        {showCostSimulator ? (
          <CostSimulator onClose={() => setShowCostSimulator(false)} chatSync={chatSyncData} />
        ) : (
          <>
            <div className="h-12 border-b border-border flex items-center px-5 bg-white flex-shrink-0">
              <span className="text-xs font-semibold text-muted uppercase tracking-wide">{sidebarLabel}</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <DynamicSidebar
                context={sidebarContext}
                focusedSchool={sidebarFocusedSchool}
                onFocusedSchoolChange={setSidebarFocusedSchool}
              />
            </div>
          </>
        )}
      </div>

      {/* エージェント相談モーダル */}
      <AgentContactModal
        isOpen={showAgentModal}
        onClose={() => setShowAgentModal(false)}
        context={messages.length > 0 ? messages.filter(m => m.role === 'user').slice(-3).map(m => m.content).join('、') : undefined}
      />

      {/* モバイル：費用シミュレーターオーバーレイ */}
      {showCostSimulator && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <CostSimulator onClose={() => setShowCostSimulator(false)} chatSync={chatSyncData} />
        </div>
      )}

      {/* モバイル：全画面マップオーバーレイ */}
      {showMapView && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div className="flex-1 min-h-0">
            <SidebarMapMobile
              cities={sidebarContext.cities}
              schools={sidebarContext.schools}
              onSelectCity={(city) => {
                setShowMapView(false);
                handleSend(`${city.name}での留学・ワーホリについて詳しく教えてください。`);
              }}
              onSelectSchool={(school) => {
                setShowMapView(false);
                handleSend(`${school.name}（${school.city}）について詳しく教えてください。`);
              }}
            />
          </div>
          <div className="flex-shrink-0 bg-black/90 backdrop-blur-sm px-6 py-5 flex justify-center">
            <button
              onClick={() => setShowMapView(false)}
              className="text-white text-sm font-semibold tracking-wide"
            >
              ← Back to chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
