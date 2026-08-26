import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text, TouchableOpacity } from 'react-native';
import { PersonaMode, VoiceState } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';

interface ArcReactorProps {
  mode: PersonaMode;
  voiceState: VoiceState;
  onPress?: () => void;
  size?: number;
}

export const ArcReactorVisualizer: React.FC<ArcReactorProps> = ({
  mode,
  voiceState,
  onPress,
  size = 220,
}) => {
  const theme = getThemeForMode(mode);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const reverseSpinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glitchAnim = useRef(new Animated.Value(0)).current;

  // Spin animations
  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: voiceState === 'thinking' ? 2000 : voiceState === 'speaking' ? 4000 : 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    const reverseSpinLoop = Animated.loop(
      Animated.timing(reverseSpinAnim, {
        toValue: 1,
        duration: voiceState === 'thinking' ? 3000 : voiceState === 'speaking' ? 5000 : 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    spinLoop.start();
    reverseSpinLoop.start();

    return () => {
      spinLoop.stop();
      reverseSpinLoop.stop();
    };
  }, [voiceState]);

  // Pulse & Breathing animation based on voice state
  useEffect(() => {
    const duration =
      voiceState === 'listening' ? 600 : voiceState === 'speaking' ? 400 : 1800;
    const maxScale =
      voiceState === 'speaking' ? 1.12 : voiceState === 'listening' ? 1.08 : 1.03;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.96,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [voiceState]);

  // Ultron Glitch jitter
  useEffect(() => {
    if (mode === 'ULTRON') {
      const glitchInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(glitchAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: -3, duration: 40, useNativeDriver: true }),
          Animated.timing(glitchAnim, { toValue: 0, duration: 40, useNativeDriver: true }),
        ]).start();
      }, 3500);
      return () => clearInterval(glitchInterval);
    }
  }, [mode]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const reverseSpin = reverseSpinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.container, { width: size, height: size }]}
    >
      {/* Outer Glow Halo */}
      <Animated.View
        style={[
          styles.outerGlow,
          {
            width: size * 1.15,
            height: size * 1.15,
            borderRadius: (size * 1.15) / 2,
            backgroundColor: theme.colors.primaryGlow,
            transform: [{ scale: pulseAnim }, { translateX: glitchAnim }],
          },
        ]}
      />

      {/* Outer Rotating Segmented Ring */}
      <Animated.View
        style={[
          styles.ringSegmented,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: theme.colors.borderGlow,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        {/* Orbital Tech Notches */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <View
            key={deg}
            style={[
              styles.orbitalNotch,
              {
                backgroundColor: theme.colors.primary,
                transform: [{ rotate: `${deg}deg` }, { translateY: -size / 2 + 6 }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Middle Counter-Rotating Ring */}
      <Animated.View
        style={[
          styles.middleRing,
          {
            width: size * 0.76,
            height: size * 0.76,
            borderRadius: (size * 0.76) / 2,
            borderColor: theme.colors.primary,
            borderStyle: mode === 'ULTRON' ? 'dashed' : 'solid',
            transform: [{ rotate: reverseSpin }, { scale: pulseAnim }],
          },
        ]}
      >
        {/* Inner Tech Nodes */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <View
            key={deg}
            style={[
              styles.innerNode,
              {
                backgroundColor: theme.colors.accent,
                transform: [{ rotate: `${deg}deg` }, { translateY: -(size * 0.76) / 2 + 5 }],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Central Power Core */}
      <Animated.View
        style={[
          styles.coreCenter,
          {
            width: size * 0.44,
            height: size * 0.44,
            borderRadius: mode === 'ULTRON' ? (size * 0.44) / 4 : (size * 0.44) / 2,
            backgroundColor: theme.colors.surfaceElevated,
            borderColor: theme.colors.primary,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        {/* Core Inner Core Light */}
        <View
          style={[
            styles.innerGlowPoint,
            {
              width: size * 0.22,
              height: size * 0.22,
              borderRadius: mode === 'ULTRON' ? 6 : (size * 0.22) / 2,
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOpacity: 0.9,
              shadowRadius: 16,
            },
          ]}
        />
      </Animated.View>

      {/* Voice State Badge */}
      <View style={[styles.stateBadge, { borderColor: theme.colors.primary }]}>
        <Text style={[styles.stateText, { color: theme.colors.primary }]}>
          {voiceState.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  outerGlow: {
    position: 'absolute',
    opacity: 0.35,
  },
  ringSegmented: {
    position: 'absolute',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitalNotch: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  middleRing: {
    position: 'absolute',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerNode: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  coreCenter: {
    position: 'absolute',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  innerGlowPoint: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#030B15E6',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    borderWidth: 1,
  },
  stateText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
});
