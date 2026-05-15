import { Linking, Pressable, Text, View } from 'react-native';

interface ContactRowProps {
  emoji: string;
  label: string;
  value: string;
  type?: 'phone' | 'text';
}

export function ContactRow({ emoji, label, value, type = 'phone' }: ContactRowProps) {
  const handlePress = () => {
    if (type === 'phone') Linking.openURL(`tel:${value}`);
  };

  return (
    <Pressable
      className="flex-row items-center justify-between py-2.5 active:opacity-70"
      onPress={type === 'phone' ? handlePress : undefined}
      accessibilityLabel={`${label}: ${value}`}
    >
      <View className="flex-row items-center gap-2 flex-1">
        <Text className="text-base">{emoji}</Text>
        <Text className="text-primary text-sm">{label}</Text>
      </View>
      {type === 'phone' ? (
        <View className="flex-row items-center gap-2">
          <Text className="text-muted text-xs">{value}</Text>
          <View className="bg-green-500 rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-semibold">電話</Text>
          </View>
        </View>
      ) : (
        <Text className="text-muted text-xs">{value}</Text>
      )}
    </Pressable>
  );
}
