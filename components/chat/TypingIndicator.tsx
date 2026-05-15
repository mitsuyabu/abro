import { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export function TypingIndicator() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 150),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - i * 150),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View className="flex-row items-center gap-1 px-4 py-3 bg-white rounded-2xl rounded-tl-sm self-start border border-border">
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted"
          style={{ opacity: dot }}
        />
      ))}
    </View>
  );
}
