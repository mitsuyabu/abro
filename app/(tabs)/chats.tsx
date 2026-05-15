import { SafeAreaView, Text, View } from 'react-native';

import { useAuthStore } from '@/stores/auth';

export default function ChatsScreen() {
  const { user } = useAuthStore();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-6">

        {/* ヘッダー */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-primary">
            {user?.nickname ? `こんにちは、${user.nickname}さん` : 'こんにちは'}
          </Text>
          <Text className="text-muted text-sm mt-1">
            留学について、何でも聞いてください
          </Text>
        </View>

        {/* チャット入力エリア(Prompt 03 で実装) */}
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-4xl">💬</Text>
          <Text className="text-muted text-sm text-center">
            AI チャット機能は次のフェーズで実装されます
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
