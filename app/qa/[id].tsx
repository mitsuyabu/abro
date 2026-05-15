import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { QA_CATEGORY_META } from '@/components/qa/QaCard';
import { useQa } from '@/hooks/useQa';
import { useAuthStore } from '@/stores/auth';
import type { QaAnswer, QaThread, UserPhase } from '@/types';

const PHASE_BADGE_BG: Record<UserPhase, string> = {
  considering: 'bg-gray-100', preparing: 'bg-blue-100', abroad: 'bg-green-100', returned: 'bg-purple-100',
};
const PHASE_BADGE_TEXT: Record<UserPhase, string> = {
  considering: 'text-gray-600', preparing: 'text-blue-700', abroad: 'text-green-700', returned: 'text-purple-700',
};
const PHASE_LABELS: Record<UserPhase, string> = {
  considering: '考え中', preparing: '準備中', abroad: '渡航中', returned: '帰国済',
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'たった今';
  if (minutes < 60) return `${minutes}分前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前`;
  return `${Math.floor(hours / 24)}日前`;
}

function AnswerCard({
  answer,
  isQuestioner,
  onVote,
  onMarkBest,
}: {
  answer: QaAnswer;
  isQuestioner: boolean;
  onVote: () => void;
  onMarkBest: () => void;
}) {
  const phase = (answer.answerer?.phase ?? 'considering') as UserPhase;
  const initial = answer.answerer?.nickname?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <View className={`bg-white border rounded-2xl p-4 gap-2.5 ${answer.is_best ? 'border-green-400' : 'border-border'}`}>
      {answer.is_best && (
        <View className="flex-row items-center gap-1">
          <Text className="text-green-600 text-xs font-bold">✓ ベスト回答</Text>
        </View>
      )}

      {/* 回答者 */}
      <View className="flex-row items-center gap-2">
        <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-xs font-bold text-primary">{initial}</Text>
        </View>
        <View className="flex-row items-center gap-1.5 flex-1">
          <Text className="text-primary font-semibold text-xs">{answer.answerer?.nickname ?? '名無し'}</Text>
          <View className={`rounded-full px-1.5 py-0.5 ${PHASE_BADGE_BG[phase]}`}>
            <Text className={`text-xs ${PHASE_BADGE_TEXT[phase]}`}>{PHASE_LABELS[phase]}</Text>
          </View>
        </View>
        <Text className="text-muted text-xs">{formatRelativeTime(answer.created_at)}</Text>
      </View>

      {/* 本文 */}
      <Text className="text-primary text-sm leading-relaxed">{answer.content}</Text>

      {/* アクション */}
      <View className="flex-row items-center gap-3 pt-1">
        <Pressable
          className="flex-row items-center gap-1 active:opacity-60"
          onPress={onVote}
        >
          <Text className={`text-sm ${answer.voted_by_me ? 'text-primary' : 'text-muted'}`}>
            {answer.voted_by_me ? '👍' : '👍'}
          </Text>
          <Text className={`text-xs font-medium ${answer.voted_by_me ? 'text-primary' : 'text-muted'}`}>
            参考になった {answer.vote_count > 0 ? `(${answer.vote_count})` : ''}
          </Text>
        </Pressable>
        {isQuestioner && !answer.is_best && (
          <Pressable className="active:opacity-60" onPress={onMarkBest}>
            <Text className="text-green-600 text-xs font-medium">✓ ベスト回答にする</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export default function QaDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { fetchThread, fetchAnswers, addAnswer, toggleVote, markBestAnswer } = useQa();

  const [thread, setThread] = useState<QaThread | null>(null);
  const [answers, setAnswers] = useState<QaAnswer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    const [t, a] = await Promise.all([fetchThread(id), fetchAnswers(id)]);
    if (t) setThread(t);
    setAnswers(a);
    setIsLoading(false);
  }, [id, fetchThread, fetchAnswers]);

  useEffect(() => { load(); }, [load]);

  const handleAddAnswer = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isSending || !id) return;
    setIsSending(true);
    const answer = await addAnswer(id, trimmed);
    if (answer) {
      setAnswers((prev) => [...prev, answer]);
      setInputText('');
      setThread((t) => t ? { ...t, answer_count: t.answer_count + 1 } : t);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setIsSending(false);
  };

  const handleVote = async (answerId: string, currentlyVoted: boolean) => {
    await toggleVote(answerId, currentlyVoted);
    setAnswers((prev) =>
      prev.map((a) =>
        a.id === answerId
          ? { ...a, voted_by_me: !currentlyVoted, vote_count: currentlyVoted ? Math.max(0, a.vote_count - 1) : a.vote_count + 1 }
          : a
      )
    );
  };

  const handleMarkBest = (answerId: string) => {
    Alert.alert('ベスト回答', 'この回答をベスト回答として選びますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '選ぶ',
        onPress: async () => {
          await markBestAnswer(id!, answerId);
          setAnswers((prev) => prev.map((a) => ({ ...a, is_best: a.id === answerId })));
          setThread((t) => t ? { ...t, is_resolved: true, best_answer_id: answerId } : t);
        },
      },
    ]);
  };

  if (isLoading || !thread) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">{isLoading ? '読み込み中...' : '質問が見つかりません'}</Text>
      </SafeAreaView>
    );
  }

  const meta = QA_CATEGORY_META[thread.category] ?? QA_CATEGORY_META.other;
  const isQuestioner = thread.questioner_id === user?.id;
  const displayName = thread.is_anonymous ? '匿名' : (thread.questioner?.nickname ?? '名無し');
  const initial = thread.is_anonymous ? '?' : (thread.questioner?.nickname?.charAt(0)?.toUpperCase() ?? '?');
  const phase = (thread.questioner?.phase ?? 'considering') as UserPhase;

  const QuestionHeader = (
    <View className="gap-3 px-4 py-5 border-b border-border">
      {/* カテゴリ + 解決済み */}
      <View className="flex-row items-center gap-2">
        <View className={`flex-row items-center gap-1 rounded-full px-2.5 py-1 ${meta.bg}`}>
          <Text className="text-xs">{meta.emoji}</Text>
          <Text className={`text-xs font-semibold ${meta.text}`}>{meta.label}</Text>
        </View>
        {thread.is_resolved && (
          <View className="bg-green-50 rounded-full px-2 py-0.5">
            <Text className="text-green-600 text-xs font-medium">✓ 解決済み</Text>
          </View>
        )}
      </View>

      {/* タイトル */}
      <Text className="text-primary font-bold text-lg leading-snug">{thread.title}</Text>

      {/* 本文 */}
      <Text className="text-primary text-sm leading-relaxed">{thread.content}</Text>

      {/* 質問者 */}
      <View className="flex-row items-center gap-2">
        <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center">
          <Text className="text-xs font-bold text-primary">{initial}</Text>
        </View>
        <Text className="text-muted text-xs">{displayName}</Text>
        {!thread.is_anonymous && (
          <View className={`rounded-full px-1.5 py-0.5 ${PHASE_BADGE_BG[phase]}`}>
            <Text className={`text-xs ${PHASE_BADGE_TEXT[phase]}`}>{PHASE_LABELS[phase]}</Text>
          </View>
        )}
        <Text className="text-muted text-xs">{formatRelativeTime(thread.created_at)}</Text>
      </View>

      {/* 回答数 */}
      <Text className="text-xs font-semibold text-muted">{thread.answer_count}件の回答</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* ヘッダー */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable className="w-9 h-9 items-center justify-center active:opacity-60" onPress={() => router.back()}>
          <Text className="text-primary text-lg">←</Text>
        </Pressable>
        <Text className="flex-1 text-center font-semibold text-primary text-sm">Q&A</Text>
        <View className="w-9" />
      </View>

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatListRef}
          data={answers}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-4 pt-2 pb-4 gap-3"
          ListHeaderComponent={QuestionHeader}
          ListEmptyComponent={
            <View className="py-10 items-center gap-1">
              <Text className="text-muted text-sm">まだ回答がありません。</Text>
              <Text className="text-muted text-xs">あなたが最初に答えてみましょう！</Text>
            </View>
          }
          renderItem={({ item }) => (
            <AnswerCard
              answer={item}
              isQuestioner={isQuestioner}
              onVote={() => handleVote(item.id, !!item.voted_by_me)}
              onMarkBest={() => handleMarkBest(item.id)}
            />
          )}
        />

        {/* 回答入力 */}
        <View className="px-4 py-3 border-t border-border flex-row items-center gap-2">
          <TextInput
            className="flex-1 bg-white border border-border rounded-2xl px-3 py-2.5 text-primary text-sm"
            placeholder={isQuestioner ? '補足を追加する...' : '回答を書く...'}
            placeholderTextColor="#A0A0A0"
            value={inputText}
            onChangeText={setInputText}
            returnKeyType="send"
            onSubmitEditing={handleAddAnswer}
            blurOnSubmit={false}
          />
          <Pressable
            className={`w-9 h-9 rounded-full items-center justify-center ${inputText.trim() && !isSending ? 'bg-primary' : 'bg-border'}`}
            onPress={handleAddAnswer}
            disabled={!inputText.trim() || isSending}
          >
            <Text className="text-white text-sm">→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
