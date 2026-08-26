import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PersonaMode, VoiceState } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';

interface WaveformProps {
  mode: PersonaMode;
  voiceState: VoiceState;
  barCount?: number;
}

export const WaveformVisualizer: React.FC<WaveformProps> = ({
  mode,
  voiceState,
  barCount = 18,
}) => {
  const theme = getThemeForMode(mode);
  const animValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.2))
  ).current;

  useEffect(() => {
    let isMounted = true;

    const animateBars = () => {
      if (!isMounted) return;

      const animations = animValues.map((val, idx) => {
        let targetHeight = 0.2;
        let speed = 250;

        if (voiceState === 'speaking') {
          // Dynamic soundwave curve
          const wave = Math.sin(idx / 2 + Date.now() / 200) * 0.4 + 0.6;
          targetHeight = Math.max(0.15, Math.min(1.0, wave + (Math.random() - 0.5) * 0.3));
          speed = 90 + Math.random() * 80;
        } else if (voiceState === 'listening') {
          targetHeight = 0.35 + Math.sin(idx + Date.now() / 400) * 0.25;
          speed = 180;
        } else if (voiceState === 'thinking') {
          // Scanning wave pulse
          const progress = (idx / barCount + (Date.now() % 1000) / 1000) % 1;
          targetHeight = Math.sin(progress * Math.PI) * 0.8 + 0.2;
          speed = 120;
        } else {
          // Idle gentle ripple
          targetHeight = 0.15 + Math.sin(idx * 0.4 + Date.now() / 1200) * 0.1;
          speed = 400;
        }

        return Animated.timing(val, {
          toValue: targetHeight,
          duration: speed,
          useNativeDriver: false,
        });
      });

      Animated.parallel(animations).start(() => {
        if (isMounted) {
          animateBars();
        }
      });
    };

    animateBars();

    return () => {
      isMounted = false;
    };
  }, [voiceState]);

  return (
    <View style={styles.container}>
      {animValues.map((val, i) => {
        const heightInterpolate = val.interpolate({
          inputRange: [0, 1],
          outputRange: [4, 42],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.bar,
              {
                height: heightInterpolate,
                backgroundColor: i % 2 === 0 ? theme.colors.primary : theme.colors.secondary,
                shadowColor: theme.colors.primary,
                shadowOpacity: 0.8,
                shadowRadius: 6,
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    gap: 4,
    marginVertical: 8,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
  },
});
