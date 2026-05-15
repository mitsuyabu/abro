import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  uri?: string | null;
  nickname?: string | null;
  size?: Size;
}

const sizeMap: Record<Size, { container: string; text: string; px: number }> = {
  sm: { container: 'w-8 h-8 rounded-full', text: 'text-xs font-semibold', px: 32 },
  md: { container: 'w-12 h-12 rounded-full', text: 'text-sm font-semibold', px: 48 },
  lg: { container: 'w-20 h-20 rounded-full', text: 'text-xl font-semibold', px: 80 },
};

function getInitial(nickname?: string | null) {
  return nickname ? nickname.charAt(0).toUpperCase() : '?';
}

export function Avatar({ uri, nickname, size = 'md' }: Props) {
  const { container, text, px } = sizeMap[size];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        className={container}
        contentFit="cover"
        accessibilityLabel={`${nickname ?? 'ユーザー'}のアバター`}
        style={{ width: px, height: px, borderRadius: px / 2 }}
      />
    );
  }

  return (
    <View
      className={`${container} bg-border items-center justify-center`}
      accessibilityLabel={`${nickname ?? 'ユーザー'}のアバター`}
    >
      <Text className={`${text} text-muted`}>{getInitial(nickname)}</Text>
    </View>
  );
}
