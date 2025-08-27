import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle } from 'react-native';
import Card from './Card';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: boolean;
  delay?: number;
  duration?: number;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  padding = 'medium',
  shadow = true,
  delay = 0,
  duration = 300
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animationSequence = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]);

    animationSequence.start();
  }, []);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
        style,
      ]}
    >
      <Card padding={padding} shadow={shadow}>
        {children}
      </Card>
    </Animated.View>
  );
};

export default AnimatedCard;