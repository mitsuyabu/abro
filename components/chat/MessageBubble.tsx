import { Text, View } from 'react-native';

import { PlanItemCard } from './PlanItemCard';
import type { Message, StructuredContent } from '@/types';

interface Props {
  message: Message;
  onAdoptPlanItem?: (item: StructuredContent) => void;
}

function cleanContent(content: string): string {
  return content.replace(/```json\n[\s\S]*?\n```/g, '').trim();
}

export function MessageBubble({ message, onAdoptPlanItem }: Props) {
  const isUser = message.role === 'user';
  const displayText = cleanContent(message.content);

  return (
    <View className={`max-w-[85%] gap-2 ${isUser ? 'self-end' : 'self-start'}`}>
      <View
        className={[
          'rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary rounded-tr-sm'
            : 'bg-white border border-border rounded-tl-sm',
        ].join(' ')}
      >
        <Text
          className={`text-sm leading-relaxed ${isUser ? 'text-white' : 'text-primary'}`}
          selectable
        >
          {displayText}
        </Text>
      </View>

      {!isUser && message.structured_content && (
        <PlanItemCard item={message.structured_content} onAdopt={onAdoptPlanItem} />
      )}
    </View>
  );
}
