import { View } from 'react-native';
import type { ViewProps } from 'react-native';

interface Props extends ViewProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...props }: Props) {
  return (
    <View
      className={`bg-card rounded-2xl p-4 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
