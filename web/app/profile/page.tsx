'use client';

import { useState } from 'react';

const TABS = ['プロフィール', 'プラン・ステータス', '設定'];

const PHASE_OPTIONS = [
  { value: 'considering',  label: '検討中',   emoji: '🤔', color: 'bg-gray-100 text-gray-600' },
  { value: 'preparing',    label: '準備中',   emoji: '📚', color: 'bg-blue-100 text-blue-700' },
  { value: 'traveling',    label: '渡航中',   emoji: '🌏', color: 'bg-green-100 text-green-700' },
  { value: 'returned',     label: '帰国済み', emoji: '🏡', color: 'bg-purple-100 text-purple-700' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('プロフィール');
  const [currentPhase, setCurrentPhase] = useState('preparing');
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('山田 花子');
  const [bio, setBio] = useState('バンクーバーでワーホリ準備中。英語を伸ばしてカフェで働くのが夢です☕');

  const phase = PHASE_OPTIONS.find((p) => p.value === currentPhase) ?? PHASE_OPTIONS[0];

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        {/* タブ */}
        <div className="sticky top-0 bg-white border-b border-border z-10">
          <div className="px-8 flex items-center gap-1">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-8 py-8">
          {activeTab === 'プロフィール' && (
            <>
              {/* アバター + 基本情報 */}
              <div className="flex items-start gap-6 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-3xl flex-shrink-0">
                    🌸
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs hover:opacity-80 transition-opacity">
                    ✎
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  {editMode ? (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-xl font-bold text-primary border-b border-primary outline-none bg-transparent w-full mb-1"
                    />
                  ) : (
                    <h2 className="text-xl font-bold text-primary mb-1">{name}</h2>
                  )}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${phase.color}`}>
                    {phase.emoji} {phase.label}
                  </span>
                </div>

                <button
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs border border-border rounded-full px-3 py-1.5 text-muted hover:text-primary hover:border-primary/30 transition-colors flex-shrink-0"
                >
                  {editMode ? '保存' : '編集'}
                </button>
              </div>

              {/* 自己紹介 */}
              <div className="bg-white border border-border rounded-2xl p-5 mb-6">
                <p className="text-xs text-muted font-semibold mb-2">自己紹介</p>
                {editMode ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full text-sm text-primary outline-none resize-none border border-border rounded-xl p-3"
                  />
                ) : (
                  <p className="text-sm text-primary leading-relaxed">{bio}</p>
                )}
              </div>

              {/* 統計 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: '投稿', value: 12 },
                  { label: 'フォロワー', value: 48 },
                  { label: 'いいね',   value: 213 },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white border border-border rounded-2xl p-4 text-center">
                    <p className="text-xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* 渡航情報 */}
              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs text-muted font-semibold mb-3">渡航情報</p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: '渡航先', value: '🇨🇦 カナダ / バンクーバー' },
                    { label: '滞在期間', value: '1年間（2025年11月〜）' },
                    { label: '目的', value: 'ワーキングホリデー' },
                    { label: '予算',   value: '¥2,800,000' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-20 flex-shrink-0">{item.label}</span>
                      <span className="text-sm text-primary font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'プラン・ステータス' && (
            <>
              <h2 className="text-lg font-bold text-primary mb-4">現在のステータス</h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {PHASE_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setCurrentPhase(p.value)}
                    className={`border-2 rounded-2xl p-4 text-left transition-all ${
                      currentPhase === p.value ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-primary/30'
                    }`}
                  >
                    <span className="text-2xl block mb-2">{p.emoji}</span>
                    <p className="text-sm font-semibold text-primary">{p.label}</p>
                  </button>
                ))}
              </div>

              <div className="bg-white border border-border rounded-2xl p-5">
                <p className="text-xs text-muted font-semibold mb-3">関連プラン</p>
                <div className="flex flex-col gap-3">
                  {[
                    { title: 'カナダ・バンクーバーワーホリ', status: '下書き', updatedAt: '2025-04-20' },
                  ].map((plan) => (
                    <button
                      key={plan.title}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-primary">{plan.title}</p>
                        <p className="text-xs text-muted">更新: {plan.updatedAt}</p>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{plan.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === '設定' && (
            <div className="flex flex-col gap-4">
              {[
                { section: 'アカウント', items: ['メールアドレス変更', 'パスワード変更', '2段階認証'] },
                { section: '通知', items: ['プッシュ通知', 'メール通知', 'コミュニティ通知'] },
                { section: 'プライバシー', items: ['プロフィール公開設定', 'プランの公開設定', 'アカウント削除'] },
              ].map((group) => (
                <div key={group.section} className="bg-white border border-border rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-border">
                    <p className="text-xs text-muted font-semibold uppercase tracking-wide">{group.section}</p>
                  </div>
                  {group.items.map((item, i) => (
                    <button
                      key={item}
                      className={`w-full px-5 py-4 text-left text-sm text-primary font-medium hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        i > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <span className={item === 'アカウント削除' ? 'text-red-500' : ''}>{item}</span>
                      <span className="text-muted text-xs">›</span>
                    </button>
                  ))}
                </div>
              ))}

              <button className="w-full py-3 text-sm text-red-500 font-semibold border border-red-100 rounded-2xl hover:bg-red-50 transition-colors">
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">あなたの進捗</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <div className="bg-white border border-border rounded-2xl p-4">
            <p className="text-xs text-muted font-semibold mb-3">準備チェックリスト</p>
            <div className="flex flex-col gap-2">
              {[
                { label: 'ビザ申請',   done: true },
                { label: '航空券予約', done: true },
                { label: '保険加入',   done: false },
                { label: '住居確保',   done: false },
                { label: '銀行口座',   done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                    item.done ? 'bg-green-500 text-white' : 'border-2 border-gray-200'
                  }`}>
                    {item.done && '✓'}
                  </div>
                  <span className={`text-xs ${item.done ? 'text-muted line-through' : 'text-primary'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted">完了率</span>
                <span className="text-xs font-semibold text-primary">40%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
