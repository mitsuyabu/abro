import { Alert, Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { InviteParentModal } from '@/components/parent/InviteParentModal';
import { useAuthStore } from '@/stores/auth';
import { useParentLink } from '@/hooks/useParentLink';

const PHASE_LABELS: Record<string, string> = {
  considering: '検討中',
  preparing: '準備中',
  abroad: '渡航中',
  returned: '帰国済み',
};

export default function MeScreen() {
  const { user, signOut } = useAuthStore();
  const { myLinks, fetchMyLinks, revokeLink } = useParentLink();
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    fetchMyLinks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const activeLinks = myLinks.filter((l) => l.status === 'active');

  return (
    <SafeAreaView className="flex-1 bg-background">
      <InviteParentModal
        visible={showInviteModal}
        onClose={() => { setShowInviteModal(false); fetchMyLinks(); }}
      />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pt-6 pb-8 gap-6">

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

        {/* 親子連携 */}
        <Card className="gap-3">
          <Text className="text-sm font-semibold text-primary">👨‍👩‍👧 親子連携</Text>

          {activeLinks.length > 0 ? (
            <View className="gap-2">
              {activeLinks.map((link) => (
                <View key={link.id} className="flex-row items-center justify-between">
                  <Text className="text-sm text-primary">
                    {link.child_user_id === user?.id ? '親と連携中' : '子と連携中'} ✅
                  </Text>
                  <Pressable
                    onPress={() => {
                      Alert.alert('連携を解除', '連携を解除しますか？', [
                        { text: 'キャンセル', style: 'cancel' },
                        { text: '解除', style: 'destructive', onPress: () => revokeLink(link.id) },
                      ]);
                    }}
                    accessibilityLabel="連携解除"
                  >
                    <Text className="text-muted text-xs">解除</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-muted text-xs">まだ連携していません</Text>
          )}

          <Pressable
            className="border border-border rounded-xl py-2.5 items-center active:opacity-70"
            onPress={() => setShowInviteModal(true)}
            accessibilityLabel="親子連携を設定する"
          >
            <Text className="text-primary text-sm font-medium">
              {activeLinks.length > 0 ? '+ さらに連携する' : '親子連携を設定する'}
            </Text>
          </Pressable>
        </Card>

        {/* サインアウト */}
        <View>
          <Button
            label="サインアウト"
            onPress={handleSignOut}
            variant="ghost"
          />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
