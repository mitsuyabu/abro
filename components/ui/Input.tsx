import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
}

export function Input({ label, error, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-sm font-medium text-primary">{label}</Text>
      )}
      <TextInput
        className={[
          'bg-white border rounded-xl px-4 py-3.5 text-base text-primary',
          focused ? 'border-primary' : 'border-border',
          error ? 'border-danger' : '',
        ].join(' ')}
        placeholderTextColor="#A0A0A0"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        accessibilityLabel={label}
        {...props}
      />
      {error && (
        <Text className="text-xs text-danger">{error}</Text>
      )}
    </View>
  );
}
