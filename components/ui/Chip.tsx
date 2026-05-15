import { Pressable, Text } from 'react-native';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function Chip({ label, selected = false, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      className={[
        'rounded-full px-4 py-2 border active:opacity-70',
        selected
          ? 'bg-primary border-primary'
          : 'bg-white border-border',
      ].join(' ')}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text
        className={[
          'text-sm font-medium',
          selected ? 'text-white' : 'text-primary',
        ].join(' ')}
      >
        {label}
      </Text>
    </Pressable>
  );
}
