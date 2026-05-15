import { format, isPast, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Alert, Pressable, Text, View } from 'react-native';

import { CATEGORY_ICONS } from '@/lib/task/defaults';
import type { Task } from '@/types';

interface Props {
  task: Task;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: Props) {
  const isCompleted = !!task.completed_at;
  const icon = CATEGORY_ICONS[task.category ?? 'other'] ?? '📌';
  const isOverdue = task.due_date && !isCompleted && isPast(parseISO(task.due_date));

  const handleDelete = () => {
    Alert.alert('削除', `「${task.title}」を削除しますか?`, [
      { text: 'キャンセル', style: 'cancel' },
      { text: '削除', style: 'destructive', onPress: () => onDelete(task.id) },
    ]);
  };

  return (
    <View className={`flex-row items-center py-3.5 px-4 border-b border-border ${isCompleted ? 'opacity-50' : ''}`}>
      {/* チェックボタン */}
      <Pressable
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
          isCompleted ? 'bg-primary border-primary' : 'border-border'
        }`}
        onPress={() => onToggle(task)}
        accessibilityLabel={isCompleted ? '未完了に戻す' : '完了にする'}
      >
        {isCompleted && <Text className="text-white text-xs font-bold">✓</Text>}
      </Pressable>

      {/* コンテンツ */}
      <View className="flex-1">
        <View className="flex-row items-center gap-1.5">
          {task.is_milestone && <Text className="text-sm">⭐</Text>}
          <Text className={`text-sm font-medium ${isCompleted ? 'line-through text-muted' : 'text-primary'}`}>
            {task.title}
          </Text>
        </View>
        {task.due_date && (
          <Text className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500' : 'text-muted'}`}>
            {isOverdue ? '⚠️ ' : ''}
            {format(parseISO(task.due_date), 'M月d日(E)', { locale: ja })}
          </Text>
        )}
      </View>

      {/* アイコン + 削除 */}
      <View className="flex-row items-center gap-2">
        <Text className="text-base">{icon}</Text>
        <Pressable onPress={handleDelete} accessibilityLabel="削除" className="active:opacity-60 p-1">
          <Text className="text-muted text-xs">✕</Text>
        </Pressable>
      </View>
    </View>
  );
}
