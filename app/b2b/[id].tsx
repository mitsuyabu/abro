import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Card } from '@/components/ui/Card';
import { useB2B } from '@/hooks/useB2B';
import type { B2BClient, B2BWidget } from '@/types';

export default function B2BClientScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { fetchClient, fetchWidgets, createWidget, updateWidget, fetchSessionStats } = useB2B();

  const [client, setClient] = useState<B2BClient | null>(null);
  const [widgets, setWidgets] = useState<B2BWidget[]>([]);
  const [stats, setStats] = useState<Record<string, { total: number; signups: number; avgMessages: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingWidget, setIsCreatingWidget] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [c, ws] = await Promise.all([fetchClient(id), fetchWidgets(id)]);
    setClient(c);
    setWidgets(ws);
    const statsMap: typeof stats = {};
    await Promise.all(ws.map(async (w) => {
      statsMap[w.id] = await fetchSessionStats(w.id);
    }));
    setStats(statsMap);
  }, [id, fetchClient, fetchWidgets, fetchSessionStats]);

  useEffect(() => {
    load().finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateWidget = async () => {
    if (!id || isCreatingWidget) return;
    setIsCreatingWidget(true);
    const w = await createWidget(id);
    setIsCreatingWidget(false);
    if (w) setWidgets((prev) => [...prev, w]);
  };

  const handleToggleWidget = async (widget: B2BWidget) => {
    await updateWidget(widget.id, { is_active: !widget.is_active });
    setWidgets((prev) => prev.map((w) => w.id === widget.id ? { ...w, is_active: !w.is_active } : w));
  };

  const getEmbedCode = (widget: B2BWidget) =>
    `<script src="https://cdn.abro.app/widget.js" data-key="${widget.embed_key}"></script>`;

  const handleCopyEmbedCode = (widget: B2BWidget) => {
    Alert.alert('埋め込みコード', getEmbedCode(widget), [{ text: 'OK' }]);
  };

  if (isLoading || !client) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">{isLoading ? '読み込み中...' : 'クライアントが見つかりません'}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm" numberOfLines={1}>{client.name}</Text>
        <View className="w-9" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 gap-4">

        {/* クライアント概要 */}
        <Card className="gap-3">
          <Text className="text-base font-bold text-primary">{client.name}</Text>
          {client.description && <Text className="text-muted text-xs leading-relaxed">{client.description}</Text>}
          <View className="gap-1.5">
            {client.country && <InfoRow label="所在地" value={`${client.country}${client.city ? ` / ${client.city}` : ''}`} />}
            {client.website_url && <InfoRow label="WEB" value={client.website_url} />}
            {client.contact_email && <InfoRow label="メール" value={client.contact_email} />}
            <InfoRow label="プラン" value={client.plan.toUpperCase()} />
            <InfoRow label="ステータス" value={client.is_active ? '稼働中' : '停止中'} />
          </View>
        </Card>

        {/* ウィジェット */}
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-primary">AI ウィジェット</Text>
            <Pressable
              className={`px-3 py-1.5 rounded-full border border-primary ${isCreatingWidget ? 'opacity-50' : 'active:opacity-70'}`}
              onPress={handleCreateWidget}
              disabled={isCreatingWidget}
            >
              <Text className="text-primary text-xs font-medium">{isCreatingWidget ? '作成中...' : '+ 新規作成'}</Text>
            </Pressable>
          </View>

          {widgets.length === 0 ? (
            <Pressable
              className="bg-white border border-dashed border-border rounded-2xl p-5 items-center gap-2 active:opacity-70"
              onPress={handleCreateWidget}
            >
              <Text className="text-2xl">🤖</Text>
              <Text className="text-muted text-sm text-center">ウィジェットを作成して{'\n'}学校サイトに埋め込む</Text>
            </Pressable>
          ) : (
            widgets.map((widget) => {
              const s = stats[widget.id] ?? { total: 0, signups: 0, avgMessages: 0 };
              return (
                <Card key={widget.id} className="gap-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-primary font-semibold text-sm">{widget.name}</Text>
                    <Pressable
                      className={`px-2 py-0.5 rounded-full ${widget.is_active ? 'bg-green-100' : 'bg-gray-100'}`}
                      onPress={() => handleToggleWidget(widget)}
                    >
                      <Text className={`text-xs font-semibold ${widget.is_active ? 'text-green-700' : 'text-gray-500'}`}>
                        {widget.is_active ? '稼働中' : '停止中'}
                      </Text>
                    </Pressable>
                  </View>

                  {/* セッション統計 */}
                  <View className="flex-row gap-3">
                    <StatBox label="セッション" value={String(s.total)} />
                    <StatBox label="登録誘導" value={String(s.signups)} />
                    <StatBox label="平均メッセージ" value={String(s.avgMessages)} />
                  </View>

                  {/* 埋め込みコード */}
                  <Pressable
                    className="bg-gray-50 border border-border rounded-xl px-3 py-2.5 active:opacity-70"
                    onPress={() => handleCopyEmbedCode(widget)}
                    accessibilityLabel="埋め込みコードを表示"
                  >
                    <Text className="text-muted text-xs font-mono" numberOfLines={1}>
                      {`<script src="https://cdn.abro.app/widget.js" data-key="${widget.embed_key.slice(0, 12)}...`}
                    </Text>
                    <Text className="text-primary text-xs font-semibold mt-1">タップでコードを表示 →</Text>
                  </Pressable>
                </Card>
              );
            })
          )}
        </View>

        {/* 使い方 */}
        <Card className="gap-3">
          <Text className="text-sm font-semibold text-primary">📖 導入方法</Text>
          {[
            { step: '1', text: 'ウィジェットを作成して埋め込みコードを取得' },
            { step: '2', text: '学校サイトの</body>直前にコードを貼り付け' },
            { step: '3', text: 'AI が入学相談を自動対応・Abro へ誘導開始' },
          ].map(({ step, text }) => (
            <View key={step} className="flex-row items-start gap-3">
              <View className="w-6 h-6 rounded-full bg-primary items-center justify-center mt-0.5">
                <Text className="text-white text-xs font-bold">{step}</Text>
              </View>
              <Text className="text-primary text-sm flex-1 leading-relaxed">{text}</Text>
            </View>
          ))}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row gap-2">
      <Text className="text-muted text-xs w-16">{label}</Text>
      <Text className="text-primary text-xs flex-1" numberOfLines={1}>{value}</Text>
    </View>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 bg-gray-50 rounded-xl p-3 items-center gap-0.5">
      <Text className="text-primary font-bold text-lg">{value}</Text>
      <Text className="text-muted text-xs text-center">{label}</Text>
    </View>
  );
}
