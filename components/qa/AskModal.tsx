import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { QA_CATEGORY_META } from './QaCard';
import { useQa } from '@/hooks/useQa';
import type { QaCategory, QaThread } from '@/types';

const CATEGORIES: QaCategory[] = ['visa', 'life', 'school', 'work', 'money', 'housing', 'accident', 'other'];

interface AskModalProps {
  visible: boolean;
  onClose: () => void;
  onAsked: (thread: QaThread) => void;
}

export function AskModal({ visible, onClose, onAsked }: AskModalProps) {
  const { createThread } = useQa();
  const [category, setCategory] = useState<QaCategory>('life');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  const canPost = title.trim().length > 0 && content.trim().length > 0;

  const handlePost = async () => {
    if (!canPost || isPosting) return;
    setIsPosting(true);
    const thread = await createThread({ category, title, content, isAnonymous });
    setIsPosting(false);
    if (thread) {
      reset();
      onAsked(thread);
    }
  };

  const reset = () => {
    setTitle(''); setContent(''); setCategory('life'); setIsAnonymous(false);
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView className="flex-1 bg-background">
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* ヘッダー */}
          <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
            <Pressable className="py-1 active:opacity-60" onPress={handleClose}>
              <Text className="text-muted text-sm">キャンセル</Text>
            </Pressable>
            <Text className="font-semibold text-primary text-sm">先輩に質問する</Text>
            <Pressable
              className={`px-4 py-1.5 rounded-full ${canPost && !isPosting ? 'bg-primary' : 'bg-border'}`}
              onPress={handlePost}
              disabled={!canPost || isPosting}
            >
              <Text className={`text-xs font-semibold ${canPost && !isPosting ? 'text-white' : 'text-muted'}`}>
                {isPosting ? '投稿中...' : '投稿する'}
              </Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-4 py-4" keyboardShouldPersistTaps="handled">

            {/* カテゴリ */}
            <Text className="text-xs font-semibold text-muted mb-2">カテゴリ</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {CATEGORIES.map((c) => {
                const meta = QA_CATEGORY_META[c];
                const selected = category === c;
                return (
                  <Pressable
                    key={c}
                    className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${selected ? 'bg-primary border-primary' : 'bg-white border-border'}`}
                    onPress={() => setCategory(c)}
                  >
                    <Text className="text-xs">{meta.emoji}</Text>
                    <Text className={`text-xs font-medium ${selected ? 'text-white' : 'text-primary'}`}>{meta.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* タイトル */}
            <Text className="text-xs font-semibold text-muted mb-1.5">タイトル（一言で） <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="例: ビザの申請に何日かかりましたか？"
              placeholderTextColor="#A0A0A0"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />

            {/* 詳細 */}
            <Text className="text-xs font-semibold text-muted mb-1.5">詳しい内容 <Text className="text-red-500">*</Text></Text>
            <TextInput
              className="bg-white border border-border rounded-xl px-4 py-3 text-primary text-sm mb-4"
              placeholder="状況、背景、具体的に知りたいことを書いてください"
              placeholderTextColor="#A0A0A0"
              value={content}
              onChangeText={setContent}
              maxLength={1000}
              multiline
              numberOfLines={6}
              style={{ minHeight: 120, textAlignVertical: 'top' }}
            />

            {/* 匿名 */}
            <View className="flex-row items-center justify-between bg-white border border-border rounded-xl px-4 py-3 mb-4">
              <View className="gap-0.5">
                <Text className="text-primary text-sm font-medium">匿名で投稿する</Text>
                <Text className="text-muted text-xs">名前を表示せずに質問できます</Text>
              </View>
              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ true: '#1A1A1A', false: '#E8E8E8' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text className="text-muted text-xs leading-relaxed">
              💡 具体的な状況を書くと、より詳しい回答がもらえます。{'\n'}
              失敗談・やらかし話も大歓迎です！みんなの役に立ちます。
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
