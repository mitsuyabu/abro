'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';
import { ChatInput } from '@/components/chat/ChatInput';
import { DynamicSidebar, SidebarContext, COUNTRY_DATA, CITY_DATA, AVATAR_STYLE, SchoolItem, CityItem } from '@/components/chat/DynamicSidebar';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  context?: SidebarContext;
}

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

function InlineSchoolCards({ schools, onSend }: { schools: SchoolItem[]; onSend: (text: string) => void }) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide">
      {schools.map(school => (
        <button
          key={school.id}
          onClick={() => onSend(`${school.name}（${school.city}）について詳しく教えてください。`)}
          className="flex-shrink-0 w-44 rounded-2xl border border-border bg-white p-3 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all text-left"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-base">🎓</span>
            {school.is_partner && (
              <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">提携校</span>
            )}
          </div>
          <div className="text-xs font-semibold text-primary leading-tight line-clamp-2 mb-0.5">{school.name}</div>
          <div className="text-[10px] text-muted">{school.city} · {school.type}</div>
          {school.fee_per_week && (
            <div className="text-xs font-semibold text-primary mt-1.5">¥{school.fee_per_week.toLocaleString()}<span className="text-[10px] font-normal text-muted">/週</span></div>
          )}
        </button>
      ))}
    </div>
  );
}

function detectSidebarContext(content: string, allSchools: SchoolItem[]): SidebarContext {
  const cities = CITY_DATA.filter(c => content.includes(c.name));
  const cityCountryNames = new Set(cities.map(c => c.country));
  const countries = COUNTRY_DATA.filter(c => content.includes(c.name) && !cityCountryNames.has(c.name));
  const showAgents =
    content.includes('エージェント') &&
    (content.includes('相談') || content.includes('おすすめ') || content.includes('提案') || content.includes('紹介'));
  const lowerContent = content.toLowerCase();

  // 名前で一致する学校
  const schoolsByName = allSchools.filter(s => lowerContent.includes(s.name.toLowerCase()));

  // 学校トピックが話されている場合、都市の言及頻度を計算してフォーカス都市を決定
  const mentionsSchoolTopic =
    content.includes('語学学校') || content.includes('学校') || lowerContent.includes('school');

  let targetCityNames: Set<string>;
  if (cities.length > 1) {
    // 複数都市が検出された場合：最も多く言及された都市を優先
    const cityCounts = cities.map(c => ({
      name: c.name,
      count: (content.match(new RegExp(c.name, 'g')) || []).length,
    }));
    const maxCount = Math.max(...cityCounts.map(c => c.count));
    const dominant = cityCounts.filter(c => c.count >= maxCount * 0.8);
    // 1都市が支配的ならその都市のみ、そうでなければ全都市
    targetCityNames = new Set(
      dominant.length === 1 ? [dominant[0].name] : cities.map(c => c.name)
    );
  } else {
    targetCityNames = new Set(cities.map(c => c.name));
  }

  const schoolsByCity = mentionsSchoolTopic && targetCityNames.size > 0
    ? allSchools.filter(s => targetCityNames.has(s.city))
    : [];

  // 重複排除してマージ
  const merged = new Map([...schoolsByName, ...schoolsByCity].map(s => [s.id, s]));
  const schools = [...merged.values()];

  return { cities, countries, schools, showAgents };
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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarContext, setSidebarContext] = useState<SidebarContext>({ countries: [], cities: [], schools: [], showAgents: false });
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [allSchools, setAllSchools] = useState<SchoolItem[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
      });

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

      const ctx = detectSidebarContext(fullContent, allSchools);
      setSidebarContext(ctx);
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, context: ctx } : m));
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === aiId ? { ...m, content: 'エラーが発生しました。もう一度お試しください。' } : m)
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;
  const latestAI = messages.filter(m => m.role === 'assistant').at(-1)?.content ?? '';
  const suggestions = isEmpty ? DEFAULT_SUGGESTIONS : getContextSuggestions(sidebarContext, latestAI);

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

  return (
    <div className="flex h-full relative">
      {/* チャットエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* トップバー */}
        <div className="h-12 border-b border-border flex items-center px-4 md:px-5 bg-white gap-2">
          <span className="text-sm font-semibold text-primary">新しいチャット</span>
          <span className="text-muted text-xs">▾</span>
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
                    onClick={() => handleSend(chip.prompt)}
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
              {messages.map(msg => (
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
                  {/* インラインカード（AI返答の下） */}
                  {msg.role === 'assistant' && msg.context && (
                    (msg.context.cities.length > 0 || msg.context.schools.length > 0) && (
                      <div className="mt-2 pl-9 sm:pl-11 flex flex-col gap-2">
                        {msg.context.cities.length > 0 && (
                          <InlineCityCards cities={msg.context.cities} onSend={handleSend} />
                        )}
                        {msg.context.schools.length > 0 && (
                          <InlineSchoolCards schools={msg.context.schools} onSend={handleSend} />
                        )}
                      </div>
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
              <div className="flex gap-2 overflow-x-auto pb-2 mb-2 sm:mb-3 scrollbar-hide">
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

      {/* 右パネル（デスクトップ：常時表示 / モバイル・タブレット：オーバーレイ） */}

      {/* デスクトップ固定右パネル */}
      <div className="hidden lg:flex w-96 xl:w-[420px] border-l border-border bg-background flex-shrink-0 flex-col h-full overflow-hidden">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white flex-shrink-0">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">{sidebarLabel}</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <DynamicSidebar context={sidebarContext} />
        </div>
      </div>

      {/* モバイル：全画面マップオーバーレイ */}
      {showMapView && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          {/* マップ本体 */}
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
          {/* Back to chat ボタン */}
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
