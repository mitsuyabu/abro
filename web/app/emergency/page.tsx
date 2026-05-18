'use client';

import { useState } from 'react';

const COUNTRIES = [
  { code: 'AU', flag: '🇦🇺', name: 'オーストラリア', police: '000', ambulance: '000', embassy: '+61-2-6273-3244' },
  { code: 'CA', flag: '🇨🇦', name: 'カナダ',         police: '911', ambulance: '911', embassy: '+1-613-241-8541' },
  { code: 'GB', flag: '🇬🇧', name: 'イギリス',       police: '999', ambulance: '999', embassy: '+44-20-7465-6500' },
  { code: 'NZ', flag: '🇳🇿', name: 'ニュージーランド', police: '111', ambulance: '111', embassy: '+64-4-473-1540' },
  { code: 'IE', flag: '🇮🇪', name: 'アイルランド',   police: '999', ambulance: '999', embassy: '+353-1-202-2300' },
];

const CATEGORIES = [
  { emoji: '🏥', label: '医療・病院',   color: 'from-red-100 to-red-50',    textColor: 'text-red-700' },
  { emoji: '🚨', label: '犯罪・盗難',   color: 'from-orange-100 to-orange-50', textColor: 'text-orange-700' },
  { emoji: '😟', label: 'メンタル相談', color: 'from-purple-100 to-purple-50', textColor: 'text-purple-700' },
  { emoji: '⚠️', label: 'トラブル全般', color: 'from-yellow-100 to-yellow-50', textColor: 'text-yellow-700' },
];

const CONTACTS = [
  { name: 'お父さん', relationship: '親', phone: '+81-90-1234-5678' },
  { name: '田中 (エージェント)', relationship: 'エージェント', phone: '+81-3-1234-5678' },
];

export default function EmergencyPage() {
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [sosPressed, setSosPressed] = useState(false);

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-8">
          <h1 className="text-2xl font-bold text-primary mb-2">緊急サポート</h1>
          <p className="text-muted text-sm mb-6">困ったときはいつでも使えるサポート機能です</p>

          {/* SOSボタン */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 rounded-3xl p-8 text-center mb-8">
            <button
              onClick={() => setSosPressed(!sosPressed)}
              className={`w-28 h-28 rounded-full mx-auto flex items-center justify-center text-4xl font-bold text-white shadow-lg transition-all ${
                sosPressed
                  ? 'bg-red-400 scale-95'
                  : 'bg-red-500 hover:bg-red-600 hover:scale-105 active:scale-95'
              }`}
            >
              SOS
            </button>
            <p className="text-sm font-semibold text-red-700 mt-4">
              {sosPressed ? '緊急チャットに繋いでいます...' : 'タップして緊急 AI チャットへ'}
            </p>
            <p className="text-xs text-red-500 mt-1">現在地・状況を AI が聞き取ります</p>
          </div>

          {/* カテゴリ */}
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-3">状況を選ぶ</h2>
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  className={`bg-gradient-to-br ${cat.color} border border-transparent rounded-2xl p-5 text-left hover:shadow-sm transition-all`}
                >
                  <span className="text-3xl block mb-2">{cat.emoji}</span>
                  <p className={`text-sm font-semibold ${cat.textColor}`}>{cat.label}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 渡航先の緊急番号 */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">緊急連絡先</h2>
              <select
                className="text-xs border border-border rounded-lg px-2 py-1 bg-white text-primary"
                value={selectedCountry.code}
                onChange={(e) => setSelectedCountry(COUNTRIES.find((c) => c.code === e.target.value) ?? COUNTRIES[0])}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white border border-border rounded-2xl overflow-hidden">
              {[
                { label: '警察',     number: selectedCountry.police, emoji: '🚔' },
                { label: '救急',     number: selectedCountry.ambulance, emoji: '🚑' },
                { label: '在外大使館', number: selectedCountry.embassy, emoji: '🏛️' },
                { label: '外務省海外安全', number: '+81-3-5501-8000', emoji: '🇯🇵' },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-5 py-4 ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji}</span>
                    <div>
                      <p className="text-sm font-semibold text-primary">{item.label}</p>
                      <p className="text-xs text-muted font-mono">{item.number}</p>
                    </div>
                  </div>
                  <a
                    href={`tel:${item.number}`}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-full font-medium hover:opacity-80 transition-opacity"
                  >
                    電話する
                  </a>
                </div>
              ))}
            </div>
          </section>

          {/* 個人の緊急連絡先 */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-wide">個人の連絡先</h2>
              <button className="text-xs text-primary font-medium border border-primary rounded-full px-3 py-1 hover:bg-primary/5 transition-colors">
                ＋ 追加
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {CONTACTS.map((c) => (
                <div key={c.name} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg flex-shrink-0">
                    👤
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{c.name}</p>
                    <p className="text-xs text-muted">{c.relationship} · {c.phone}</p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded-full font-medium hover:opacity-80 transition-opacity flex-shrink-0"
                  >
                    電話
                  </a>
                </div>
              ))}

              {CONTACTS.length === 0 && (
                <div className="text-center py-8 text-muted text-sm">
                  緊急連絡先を登録しておきましょう
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* 右パネル */}
      <div className="w-72 xl:w-80 border-l border-border flex-shrink-0 bg-background overflow-y-auto">
        <div className="h-12 border-b border-border flex items-center px-5 bg-white">
          <span className="text-xs font-semibold text-muted uppercase tracking-wide">安全のヒント</span>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {[
            { emoji: '📱', title: '事前に登録を', body: '渡航前に緊急連絡先と大使館の電話番号を保存しておきましょう' },
            { emoji: '🏥', title: '保険証を持ち歩く', body: '保険証のコピーとポリシー番号は常に携帯してください' },
            { emoji: '🤝', title: 'エージェントに相談', body: 'トラブル時はエージェントに連絡するとサポートが受けられます' },
            { emoji: '🇯🇵', title: '大使館に登録', body: '外務省の在留届を出しておくと緊急時に連絡が取りやすくなります' },
          ].map((tip) => (
            <div key={tip.title} className="bg-white border border-border rounded-xl p-4">
              <p className="text-sm font-semibold text-primary mb-1">{tip.emoji} {tip.title}</p>
              <p className="text-xs text-muted leading-relaxed">{tip.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
