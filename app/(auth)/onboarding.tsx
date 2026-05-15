import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import type { UserPhase } from '@/types';

const PHASES: { value: UserPhase; label: string; description: string }[] = [
  { value: 'considering', label: '検討中', description: 'まだ行くか迷っている' },
  { value: 'preparing', label: '準備中', description: 'もう行くと決めた' },
  { value: 'abroad', label: '渡航中', description: '現地で生活している' },
  { value: 'returned', label: '帰国済み', description: '帰国して日本にいる' },
];

const COUNTRIES = ['オーストラリア', 'カナダ', 'ニュージーランド', 'イギリス', 'アメリカ', 'アイルランド', '北欧', 'その他'];

const PURPOSES = ['英語力を伸ばしたい', '海外で働きたい', '現地の文化を体験したい', '人生を変えたい', '視野を広げたい', 'キャリアアップしたい'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { session, fetchUser } = useAuthStore();

  const [nickname, setNickname] = useState('');
  const [phase, setPhase] = useState<UserPhase | null>(null);
  const [countries, setCountries] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const handleFinish = async () => {
    if (!session?.user?.id) return;
    if (!nickname.trim()) {
      Alert.alert('ニックネームを入力してください');
      return;
    }
    if (!phase) {
      Alert.alert('現在の状況を選択してください');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('users')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update({
          nickname: nickname.trim(),
          phase,
          interested_countries: countries,
          purposes,
        } as any)
        .eq('id', session.user.id);

      if (error) throw error;

      await fetchUser();
      router.replace('/(tabs)/chats');
    } catch {
      Alert.alert('保存できませんでした', '少し時間をおいて、もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-8 gap-8"
        keyboardShouldPersistTaps="handled"
      >

        {/* ステップインジケーター */}
        <View className="flex-row gap-1.5">
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </View>

        {/* ステップ 1: ニックネーム */}
        {step === 1 && (
          <View className="gap-6">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-primary">ニックネームを教えてください</Text>
              <Text className="text-muted text-sm">あとから変更できます</Text>
            </View>
            <Input
              label="ニックネーム"
              placeholder="例: たろう"
              value={nickname}
              onChangeText={setNickname}
              maxLength={20}
              autoFocus
            />
            <Button
              label="次へ"
              onPress={() => {
                if (!nickname.trim()) { Alert.alert('ニックネームを入力してください'); return; }
                setStep(2);
              }}
            />
          </View>
        )}

        {/* ステップ 2: フェーズ + 興味のある国 */}
        {step === 2 && (
          <View className="gap-6">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-primary">現在の状況を教えてください</Text>
            </View>

            <View className="gap-3">
              <Text className="text-sm font-medium text-primary">状況</Text>
              <View className="gap-2">
                {PHASES.map((p) => (
                  <Chip
                    key={p.value}
                    label={`${p.label} — ${p.description}`}
                    selected={phase === p.value}
                    onPress={() => setPhase(p.value)}
                  />
                ))}
              </View>
            </View>

            <View className="gap-3">
              <Text className="text-sm font-medium text-primary">興味のある国・地域（複数可）</Text>
              <View className="flex-row flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    selected={countries.includes(c)}
                    onPress={() => toggleItem(countries, setCountries, c)}
                  />
                ))}
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="戻る" onPress={() => setStep(1)} variant="secondary" />
              </View>
              <View className="flex-1">
                <Button
                  label="次へ"
                  onPress={() => {
                    if (!phase) { Alert.alert('現在の状況を選択してください'); return; }
                    setStep(3);
                  }}
                />
              </View>
            </View>
          </View>
        )}

        {/* ステップ 3: 目的 */}
        {step === 3 && (
          <View className="gap-6">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-primary">留学・ワーホリの目的は?</Text>
              <Text className="text-muted text-sm">当てはまるものを選んでください（複数可）</Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {PURPOSES.map((p) => (
                <Chip
                  key={p}
                  label={p}
                  selected={purposes.includes(p)}
                  onPress={() => toggleItem(purposes, setPurposes, p)}
                />
              ))}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Button label="戻る" onPress={() => setStep(2)} variant="secondary" />
              </View>
              <View className="flex-1">
                <Button
                  label="はじめる"
                  onPress={handleFinish}
                  isLoading={isSubmitting}
                />
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}
