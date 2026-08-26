import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PersonaMode } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';

interface HudOverlayProps {
  mode: PersonaMode;
  children?: React.ReactNode;
}

export const IronManHudOverlay: React.FC<HudOverlayProps> = ({ mode, children }) => {
  const theme = getThemeForMode(mode);
  const [heading, setHeading] = useState(42);
  const [alt, setAlt] = useState(10420);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeading((h) => (h + 1) % 360);
      setAlt((a) => a + Math.floor((Math.random() - 0.5) * 40));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Top Left Bracket */}
      <View style={[styles.cornerTL, { borderColor: theme.colors.primary }]} />
      {/* Top Right Bracket */}
      <View style={[styles.cornerTR, { borderColor: theme.colors.primary }]} />
      {/* Bottom Left Bracket */}
      <View style={[styles.cornerBL, { borderColor: theme.colors.primary }]} />
      {/* Bottom Right Bracket */}
      <View style={[styles.cornerBR, { borderColor: theme.colors.primary }]} />

      {/* Top HUD Telemetry Ribbon */}
      <View style={[styles.topRibbon, { borderBottomColor: theme.colors.border }]}>
        <Text style={[styles.telemetryText, { color: theme.colors.textSecondary }]}>
          HDG {heading.toString().padStart(3, '0')}° // ALT {alt}M
        </Text>
        <Text style={[styles.telemetryTag, { color: theme.colors.primary }]}>
          [{mode} CORE]
        </Text>
        <Text style={[styles.telemetryText, { color: theme.colors.textSecondary }]}>
          SYS: NOMINAL
        </Text>
      </View>

      {/* Background Tech Watermark */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  content: {
    flex: 1,
  },
  cornerTL: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    zIndex: 10,
    pointerEvents: 'none',
  },
  cornerTR: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderTopWidth: 2,
    borderRightWidth: 2,
    zIndex: 10,
    pointerEvents: 'none',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    zIndex: 10,
    pointerEvents: 'none',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    zIndex: 10,
    pointerEvents: 'none',
  },
  topRibbon: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    backgroundColor: '#00000033',
  },
  telemetryText: {
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  telemetryTag: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
});
