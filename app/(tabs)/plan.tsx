import { SafeAreaView, Text, View } from 'react-native';

export default function PlanScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-6">
        <View className="mb-6">
          <Text className="text-2xl font-bold text-primary">プラン</Text>
          <Text className="text-muted text-sm mt-1">留学プランを管理する</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          <Text className="text-4xl">📋</Text>
          <Text className="text-muted text-sm text-center">
            プラン機能は次のフェーズで実装されます
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
