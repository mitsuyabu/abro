import { Alert, SafeAreaView, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useAuthStore } from '@/stores/auth';

const PHASE_LABELS: Record<string, string> = {
  considering: '検討中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済み',
};

export default function MeScreen() {
  const { user, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert(
      'サインアウト',
      'サインアウトしますか?',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'サインアウト', style: 'destructive', onPress: signOut },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-6 pt-6 gap-6">

        {/* ヘッダー */}
        <Text className="text-2xl font-bold text-primary">マイページ</Text>

        {/* プロフィールカード */}
        <Card className="gap-4">
          <View className="flex-row items-center gap-4">
            <Avatar uri={user?.avatar_url} nickname={user?.nickname} size="lg" />
            <View className="flex-1 gap-1">
              <Text className="text-lg font-bold text-primary">
                {user?.nickname ?? '---'}
              </Text>
              <Text className="text-sm text-muted">{user?.email}</Text>
              {user?.phase && (
                <Chip
                  label={PHASE_LABELS[user.phase] ?? user.phase}
                  selected
                />
              )}
            </View>
          </View>

          {user?.interested_countries && user.interested_countries.length > 0 && (
            <View className="gap-2">
              <Text className="text-xs text-muted font-medium">興味のある国・地域</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {user.interested_countries.map((c) => (
                  <Chip key={c} label={c} />
                ))}
              </View>
            </View>
          )}
        </Card>

        {/* サインアウト */}
        <View className="mt-auto mb-4">
          <Button
            label="サインアウト"
            onPress={handleSignOut}
            variant="ghost"
          />
        </View>

      </View>
    </SafeAreaView>
  );
}
