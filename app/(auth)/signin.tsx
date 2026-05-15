import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';

const schema = z.object({
  email: z.string().email('メールアドレスの形式が正しくありません'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

type FormData = z.infer<typeof schema>;

export default function SigninScreen() {
  const router = useRouter();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      Alert.alert(
        'サインインできませんでした',
        'メールアドレスまたはパスワードが正しくありません。確認してもう一度お試しください。',
      );
    }
    // 成功時は _layout.tsx の onAuthStateChange がルーティングを制御する
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-8 gap-8"
          keyboardShouldPersistTaps="handled"
        >

          {/* ヘッダー */}
          <View className="gap-1">
            <Text className="text-2xl font-bold text-primary">おかえりなさい</Text>
            <Text className="text-muted text-sm">続きを始めましょう</Text>
          </View>

          {/* フォーム */}
          <View className="gap-4">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="メールアドレス"
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="パスワード"
                  placeholder="パスワードを入力"
                  secureTextEntry
                  autoComplete="current-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          {/* サインインボタン */}
          <Button
            label="サインイン"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          />

          {/* 新規登録リンク */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-muted text-sm">まだアカウントをお持ちでないですか?</Text>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <Text className="text-primary text-sm font-semibold">登録する</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
