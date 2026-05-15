import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, SafeAreaView, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase';

export default function VerifyScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const handleResend = async () => {
    if (!email) return;

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      Alert.alert('送信できませんでした', '少し時間をおいて、もう一度お試しください。');
    } else {
      Alert.alert('送信しました', `${email} に確認メールを再送しました。`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 justify-center gap-8">

        {/* アイコンエリア */}
        <View className="items-center gap-4">
          <View className="w-20 h-20 rounded-full bg-border items-center justify-center">
            <Text className="text-4xl">✉️</Text>
          </View>
          <View className="items-center gap-2">
            <Text className="text-2xl font-bold text-primary text-center">
              メールを確認してください
            </Text>
            {email && (
              <Text className="text-muted text-sm text-center leading-relaxed">
                {email} に確認メールをお送りしました。{'\n'}
                リンクをクリックして登録を完了させてください。
              </Text>
            )}
          </View>
        </View>

        {/* アクション */}
        <View className="gap-3">
          <Button
            label="メールを再送する"
            onPress={handleResend}
            variant="secondary"
          />
          <Button
            label="サインイン画面へ"
            onPress={() => router.replace('/(auth)/signin')}
            variant="ghost"
          />
        </View>

        <Text className="text-xs text-muted text-center">
          メールが届かない場合は、迷惑メールフォルダもご確認ください。
        </Text>

      </View>
    </SafeAreaView>
  );
}
