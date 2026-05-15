import { differenceInDays, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { TaskItem } from '@/components/task/TaskItem';
import { supabase } from '@/lib/supabase';
import { useTasks } from '@/hooks/useTasks';
import { useTaskStore } from '@/stores/task';
import type { Plan, Task } from '@/types';

export default function PlanTabScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);

  const { fetchTasks, generateTasksForPlan, toggleComplete, deleteTask } = useTasks();
  const { tasks, isLoading: isLoadingTasks } = useTaskStore();

  useEffect(() => {
    fetchPlans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    setIsLoadingPlans(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoadingPlans(false); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from('plans') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data && (data as Plan[]).length > 0) {
      setPlans(data as Plan[]);
      const firstPlan = (data as Plan[])[0];
      setSelectedPlanId(firstPlan.id);
      await fetchTasks(firstPlan.id);
      await generateTasksForPlan(firstPlan.id, firstPlan.start_date);
    }
    setIsLoadingPlans(false);
  };

  const handleSelectPlan = useCallback(async (plan: Plan) => {
    setSelectedPlanId(plan.id);
    await fetchTasks(plan.id);
    await generateTasksForPlan(plan.id, plan.start_date);
  }, [fetchTasks, generateTasksForPlan]);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  // 出発までの日数
  const daysUntilDeparture = useMemo(() => {
    if (!selectedPlan?.start_date) return null;
    return differenceInDays(parseISO(selectedPlan.start_date), new Date());
  }, [selectedPlan]);

  // タスクを分類
  const { upcoming, future, completed } = useMemo(() => {
    const now = new Date();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const upcoming: Task[] = [];
    const future: Task[] = [];
    const completed: Task[] = [];

    for (const task of tasks) {
      if (task.completed_at) {
        completed.push(task);
      } else if (!task.due_date || parseISO(task.due_date) <= endOfMonth) {
        upcoming.push(task);
      } else {
        future.push(task);
      }
    }
    return { upcoming, future, completed };
  }, [tasks]);

  const completedCount = tasks.filter((t) => !!t.completed_at).length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (isLoadingPlans) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted text-sm">読み込み中...</Text>
      </SafeAreaView>
    );
  }

  if (plans.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="px-6 pt-6 pb-2">
          <Text className="text-2xl font-bold text-primary">プラン</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6 gap-4">
          <Text className="text-4xl">📋</Text>
          <Text className="text-primary font-medium text-center">まだプランがありません</Text>
          <Text className="text-muted text-sm text-center">
            「チャット」タブで AI に相談してプランを作成しましょう。
          </Text>
          <Pressable
            className="bg-primary rounded-xl px-6 py-3 active:opacity-80"
            onPress={() => router.push('/(tabs)/chats' as never)}
            accessibilityLabel="チャットへ"
          >
            <Text className="text-white font-semibold text-sm">✨ プランを作る</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <FlatList
        data={[...upcoming, ...future, ...completed]}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            {/* ヘッダー */}
            <View className="px-4 pt-4 pb-2">
              <Text className="text-2xl font-bold text-primary">出発までのタスク</Text>
            </View>

            {/* プラン選択(複数プランがある場合) */}
            {plans.length > 1 && (
              <FlatList
                horizontal
                data={plans}
                keyExtractor={(p) => p.id}
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 py-2 gap-2"
                renderItem={({ item }) => (
                  <Pressable
                    className={`px-3 py-1.5 rounded-full border ${
                      selectedPlanId === item.id ? 'bg-primary border-primary' : 'bg-white border-border'
                    }`}
                    onPress={() => handleSelectPlan(item)}
                    accessibilityLabel={item.title}
                  >
                    <Text className={`text-xs font-medium ${selectedPlanId === item.id ? 'text-white' : 'text-primary'}`}>
                      {item.title}
                    </Text>
                  </Pressable>
                )}
              />
            )}

            {/* プラン概要カード */}
            {selectedPlan && (
              <View className="mx-4 mb-3 bg-white border border-border rounded-2xl p-4 gap-3">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-primary font-bold text-base">{selectedPlan.title}</Text>
                    {selectedPlan.destination_country && (
                      <Text className="text-muted text-xs mt-0.5">🌏 {selectedPlan.destination_country}</Text>
                    )}
                  </View>
                  {daysUntilDeparture !== null && (
                    <View className="items-end">
                      <Text className="text-2xl font-bold text-primary">
                        {daysUntilDeparture > 0 ? daysUntilDeparture : 0}
                      </Text>
                      <Text className="text-muted text-xs">日後に出発</Text>
                    </View>
                  )}
                </View>

                {/* 進捗バー */}
                {tasks.length > 0 && (
                  <View className="gap-1.5">
                    <View className="flex-row justify-between">
                      <Text className="text-xs text-muted">進捗</Text>
                      <Text className="text-xs text-primary font-medium">{completedCount}/{tasks.length} 完了</Text>
                    </View>
                    <View className="h-2 bg-border rounded-full">
                      <View
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </View>
                  </View>
                )}

                <Pressable
                  className="border border-border rounded-xl py-2 items-center active:opacity-70"
                  onPress={() => router.push(`/plan/${selectedPlan.id}` as never)}
                  accessibilityLabel="プラン詳細を見る"
                >
                  <Text className="text-primary text-xs font-medium">プラン詳細・費用を見る →</Text>
                </Pressable>
              </View>
            )}

            {/* 今月やること */}
            {upcoming.length > 0 && (
              <View className="mx-4 mb-1">
                <Text className="text-xs font-semibold text-muted py-2">
                  ▼ 今月やること({upcoming.length}件)
                </Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => {
          const allItems = [...upcoming, ...future, ...completed];
          const isFutureHeader = index === upcoming.length && future.length > 0;
          const isCompletedHeader = index === upcoming.length + future.length && completed.length > 0;

          return (
            <View>
              {isFutureHeader && (
                <View className="mx-4 mt-3 mb-1">
                  <Text className="text-xs font-semibold text-muted py-2">▼ 来月以降({future.length}件)</Text>
                </View>
              )}
              {isCompletedHeader && (
                <View className="mx-4 mt-3 mb-1">
                  <Text className="text-xs font-semibold text-muted py-2">▼ 完了済み({completed.length}件)</Text>
                </View>
              )}
              <View className="bg-white mx-4 rounded-xl overflow-hidden mb-0.5">
                <TaskItem
                  task={item}
                  onToggle={toggleComplete}
                  onDelete={deleteTask}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          isLoadingTasks ? (
            <View className="py-10 items-center">
              <Text className="text-muted text-sm">タスクを読み込み中...</Text>
            </View>
          ) : null
        }
        contentContainerClassName="pb-8"
      />
    </SafeAreaView>
  );
}
