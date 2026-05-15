import { useCallback, useState } from 'react';
import {
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

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onPosted: () => void;
}

export function CreatePostModal({ visible, onClose, onPosted }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { createPost } = usePosts();

  const handlePost = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed || isPosting) return;
    setIsPosting(true);
    await createPost(trimmed);
    setContent('');
    setIsPosting(false);
    onPosted();
  }, [content, isPosting, createPost, onPosted]);

  const handleClose = () => {
    setContent('');
    onClose();
  };

  const remaining = 500 - content.length;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={handleClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">新しい投稿</Text>
            <Pressable
              className={`px-4 py-1.5 rounded-full ${content.trim() && !isPosting ? 'bg-primary' : 'bg-border'}`}
              onPress={handlePost}
              disabled={!content.trim() || isPosting}
            >
              <Text className={`text-sm font-semibold ${content.trim() && !isPosting ? 'text-white' : 'text-muted'}`}>
                {isPosting ? '投稿中...' : '投稿する'}
              </Text>
            </Pressable>
          </View>

          {/* 入力エリア */}
          <View className="flex-1 px-4 pt-4">
            <TextInput
              className="flex-1 text-primary text-base leading-relaxed"
              placeholder="いまどんなこと考えてる？留学・ワーホリのこと、なんでも投稿しよう"
              placeholderTextColor="#A0A0A0"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={500}
              autoFocus
              textAlignVertical="top"
            />
          </View>

          {/* フッター */}
          <View className="px-4 py-3 border-t border-border flex-row justify-end">
            <Text className={`text-xs ${remaining < 50 ? 'text-red-500' : 'text-muted'}`}>
              {remaining}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
