import { useRouter } from 'expo-router';
import { SafeAreaView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-between py-12">

        {/* ロゴ・キャッチコピーエリア */}
        <View className="flex-1 items-center justify-center gap-6">
          <View className="items-center gap-3">
            <Text className="text-5xl font-bold text-primary tracking-tight">
              Abro
            </Text>
            <Text className="text-muted text-base text-center leading-relaxed">
              留学・ワーホリの{'\n'}すべてに、伴走する。
            </Text>
          </View>

          <View className="gap-2 mt-4">
            {[
              '行き先を AI と一緒に考える',
              '出発前に仲間と繋がる',
              '現地での生活も、ここで完結',
            ].map((text) => (
              <View key={text} className="flex-row items-center gap-2">
                <View className="w-1.5 h-1.5 rounded-full bg-accent" />
                <Text className="text-sm text-muted">{text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* アクションエリア */}
        <View className="gap-3">
          <Button
            label="はじめる"
            onPress={() => router.push('/(auth)/signup')}
            variant="primary"
          />
          <Button
            label="すでにアカウントをお持ちの方"
            onPress={() => router.push('/(auth)/signin')}
            variant="ghost"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
