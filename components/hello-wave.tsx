import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export function HelloWave() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(25, { duration: 150 }),
      4,
      true
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  }));

  return (
    <Animated.Text style={animatedStyle}>
      👋
    </Animated.Text>
  );
}
