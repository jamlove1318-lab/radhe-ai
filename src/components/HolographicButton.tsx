import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { PersonaMode } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { soundFx } from '../audio/soundEngine';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: PersonaMode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const HolographicButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'JARVIS',
  variant = 'primary',
  icon,
  style,
  textStyle,
  disabled = false,
}) => {
  const theme = getThemeForMode(mode);

  const handlePress = () => {
    soundFx.playHudClick();
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return '#1A2332';
    if (variant === 'primary') return theme.colors.surfaceElevated;
    if (variant === 'danger') return 'rgba(255, 0, 60, 0.2)';
    if (variant === 'secondary') return theme.colors.surface;
    return 'transparent';
  };

  const getBorderColor = () => {
    if (disabled) return '#2B394A';
    if (variant === 'danger') return theme.colors.danger;
    return theme.colors.primary;
  };

  const getTextColor = () => {
    if (disabled) return '#5A6F87';
    if (variant === 'danger') return theme.colors.danger;
    return theme.colors.textPrimary;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          shadowColor: theme.colors.primary,
        },
        style,
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
});
