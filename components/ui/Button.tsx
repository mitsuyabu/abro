import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  isLoading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const styles: Record<Variant, { container: string; text: string }> = {
  primary: {
    container: 'bg-primary rounded-xl px-6 py-4 items-center justify-center active:opacity-80',
    text: 'text-white text-base font-semibold',
  },
  secondary: {
    container: 'bg-white border border-border rounded-xl px-6 py-4 items-center justify-center active:opacity-80',
    text: 'text-primary text-base font-semibold',
  },
  ghost: {
    container: 'px-6 py-4 items-center justify-center active:opacity-60',
    text: 'text-primary text-base',
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  accessibilityLabel,
}: Props) {
  const { container, text } = styles[variant];

  return (
    <Pressable
      className={`${container} ${disabled || isLoading ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#1A1A1A'} />
      ) : (
        <Text className={text}>{label}</Text>
      )}
    </Pressable>
  );
}
