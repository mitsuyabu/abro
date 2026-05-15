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
  password: z.string().min(8, 'パスワードは8文字以上で設定してください'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (error) {
      Alert.alert(
        '登録できませんでした',
        error.message.includes('already registered')
          ? 'このメールアドレスはすでに登録されています。サインインしてみてください。'
          : '少し時間をおいて、もう一度お試しください。',
      );
      return;
    }

    router.push({ pathname: '/(auth)/verify', params: { email: data.email } });
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
            <Text className="text-2xl font-bold text-primary">アカウントを作成</Text>
            <Text className="text-muted text-sm">無料で始められます</Text>
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
                  placeholder="8文字以上"
                  secureTextEntry
                  autoComplete="new-password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="パスワード（確認）"
                  placeholder="もう一度入力"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.confirmPassword?.message}
                />
              )}
            />
          </View>

          {/* 登録ボタン */}
          <Button
            label="登録する"
            onPress={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
          />

          {/* サインインリンク */}
          <View className="flex-row justify-center gap-1">
            <Text className="text-muted text-sm">すでにアカウントをお持ちですか?</Text>
            <Pressable onPress={() => router.push('/(auth)/signin')}>
              <Text className="text-primary text-sm font-semibold">サインイン</Text>
            </Pressable>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
