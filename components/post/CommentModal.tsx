import { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { usePosts } from '@/hooks/usePosts';
import { useAuthStore } from '@/stores/auth';
import type { PostComment } from '@/types';

interface CommentModalProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

export function CommentModal({ postId, visible, onClose }: CommentModalProps) {
  const { user } = useAuthStore();
  const { fetchComments, addComment } = usePosts();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments(postId).then(setComments);
    }
  }, [visible, postId, fetchComments]);

  const handleSend = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !user) return;
    setIsSending(true);
    const comment = await addComment(postId, trimmed);
    if (comment) {
      setComments((prev) => [...prev, { ...comment, user: { id: user.id, nickname: user.nickname, avatar_url: user.avatar_url } }]);
    }
    setInputText('');
    setIsSending(false);
  }, [inputText, isSending, user, addComment, postId]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <View className="w-8" />
            <Text className="font-semibold text-primary text-sm">コメント</Text>
            <Pressable className="w-8 items-end active:opacity-60" onPress={onClose}>
              <Text className="text-muted text-sm">✕</Text>
            </Pressable>
          </View>

          {/* コメント一覧 */}
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 py-3 gap-3"
            ListEmptyComponent={
              <View className="py-10 items-center">
                <Text className="text-muted text-sm">まだコメントがありません</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View className="flex-row gap-2">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
                  <Text className="text-xs font-bold text-primary">
                    {item.user?.nickname?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
                <View className="flex-1 bg-white border border-border rounded-2xl px-3 py-2">
                  <View className="flex-row items-center gap-2 mb-0.5">
                    <Text className="text-primary font-semibold text-xs">{item.user?.nickname ?? '名無し'}</Text>
                    <Text className="text-muted text-xs">{formatRelativeTime(item.created_at)}</Text>
                  </View>
                  <Text className="text-primary text-sm">{item.content}</Text>
                </View>
              </View>
            )}
          />

          {/* 入力 */}
          <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
            <TextInput
              className="flex-1 bg-white border border-border rounded-2xl px-3 py-2 text-primary text-sm"
              placeholder="コメントを書く..."
              placeholderTextColor="#A0A0A0"
              value={inputText}
              onChangeText={setInputText}
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <Pressable
              className={`w-8 h-8 rounded-full items-center justify-center ${inputText.trim() && !isSending ? 'bg-primary' : 'bg-border'}`}
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
            >
              <Text className="text-white text-xs">→</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
