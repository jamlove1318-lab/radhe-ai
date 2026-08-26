import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { soundFx } from '../audio/soundEngine';
import {
  Box,
  Layers,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Shield,
  Zap,
  Activity,
  Cpu,
} from 'lucide-react-native';

interface ThreeDVisualizerProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const ThreeDVisualizerScreen: React.FC<ThreeDVisualizerProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [modelType, setModelType] = useState<'REACTOR' | 'HELMET' | 'REPULSOR'>('REACTOR');
  const [explodedView, setExplodedView] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>(null);

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pitchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop: Animated.CompositeAnimation | null = null;
    if (autoRotate) {
      animLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 10000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animLoop.start();
    } else {
      rotateAnim.stopAnimation();
    }
    return () => animLoop?.stop();
  }, [autoRotate]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const subsystems = [
    { name: 'Magnetic Confinement Rings', status: '100% NOMINAL', load: '3.5 GJ/s' },
    { name: 'Palladium Catalytic Core', status: 'STABILIZED', load: '98.4%' },
    { name: 'Cryogenic Thermal Shroud', status: '4.2 KELVIN', load: 'OPTIMAL' },
    { name: 'Thermoelectric Converters', status: 'ACTIVE', load: '1.2 GW' },
  ];

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Box size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              3D HOLOGRAPHIC TELEMETRY STUDIO
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Interactive 360° Wireframe Core & Component Inspection
          </Text>
        </View>

        {/* Model Switcher Chips */}
        <View style={styles.modelSwitcher}>
          {(['REACTOR', 'HELMET', 'REPULSOR'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => {
                soundFx.playHudClick();
                setModelType(m);
              }}
              style={[
                styles.modelChip,
                {
                  borderColor: modelType === m ? theme.colors.primary : theme.colors.border,
                  backgroundColor: modelType === m ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                },
              ]}
            >
              <Text
                style={[
                  styles.modelChipText,
                  { color: modelType === m ? theme.colors.primary : theme.colors.textMuted },
                ]}
              >
                {m === 'REACTOR' ? 'ARC REACTOR' : m === 'HELMET' ? 'MK 85 HELMET' : 'REPULSOR GAUGE'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 3D Holographic Viewport */}
        <View
          style={[
            styles.viewportBox,
            {
              borderColor: theme.colors.primary,
              backgroundColor: '#020712',
            },
          ]}
        >
          {/* Animated Rotating 3D Wireframe Rings */}
          <View style={[styles.canvasCenter, { transform: [{ scale: zoomLevel }] }]}>
            {/* Outer Hex Ring */}
            <Animated.View
              style={[
                styles.wireframeOuterRing,
                {
                  borderColor: theme.colors.primaryGlow,
                  transform: [{ rotate: spin }, { scale: explodedView ? 1.3 : 1 }],
                },
              ]}
            >
              {[0, 60, 120, 180, 240, 300].map((deg) => (
                <View
                  key={deg}
                  style={[
                    styles.ringVertex,
                    {
                      backgroundColor: theme.colors.primary,
                      transform: [{ rotate: `${deg}deg` }, { translateY: -85 }],
                    },
                  ]}
                />
              ))}
            </Animated.View>

            {/* Middle Rotating Wireframe Grid */}
            <Animated.View
              style={[
                styles.wireframeInnerRing,
                {
                  borderColor: theme.colors.secondary,
                  borderStyle: 'dashed',
                  transform: [{ rotate: spin }, { scale: explodedView ? 1.15 : 1 }],
                },
              ]}
            />

            {/* Center Core Node */}
            <View
              style={[
                styles.centerCoreNode,
                {
                  backgroundColor: theme.colors.primary,
                  shadowColor: theme.colors.primary,
                  shadowOpacity: 0.9,
                  shadowRadius: 18,
                },
              ]}
            />
          </View>

          {/* Viewport Floating Controls */}
          <View style={styles.floatingControls}>
            <TouchableOpacity
              onPress={() => setAutoRotate(!autoRotate)}
              style={[styles.floatingBtn, { borderColor: theme.colors.border }]}
            >
              <RotateCw size={14} color={autoRotate ? theme.colors.primary : '#5A6F87'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setExplodedView(!explodedView)}
              style={[styles.floatingBtn, { borderColor: theme.colors.border }]}
            >
              <Layers size={14} color={explodedView ? theme.colors.accent : '#5A6F87'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              style={[styles.floatingBtn, { borderColor: theme.colors.border }]}
            >
              <ZoomIn size={14} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
              style={[styles.floatingBtn, { borderColor: theme.colors.border }]}
            >
              <ZoomOut size={14} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Viewport HUD Footer */}
          <View style={[styles.viewportFooter, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.viewportHudText, { color: theme.colors.textSecondary }]}>
              MODEL: {modelType} // EXPLODED: {explodedView ? 'YES' : 'NO'} // ROTATION: {autoRotate ? 'ACTIVE' : 'LOCKED'}
            </Text>
          </View>
        </View>

        {/* Subsystem Telemetry Inspection */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          INTERNAL COMPONENT TELEMETRY:
        </Text>

        <View style={styles.subsystemGrid}>
          {subsystems.map((sub, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                soundFx.playHudClick();
                setSelectedSubsystem(sub.name);
              }}
              style={[
                styles.subsystemCard,
                {
                  borderColor:
                    selectedSubsystem === sub.name ? theme.colors.primary : theme.colors.border,
                  backgroundColor:
                    selectedSubsystem === sub.name
                      ? 'rgba(0, 240, 255, 0.12)'
                      : theme.colors.surface,
                },
              ]}
            >
              <View style={styles.subHeader}>
                <Cpu size={14} color={theme.colors.primary} />
                <Text style={[styles.subName, { color: theme.colors.textPrimary }]}>
                  {sub.name}
                </Text>
              </View>
              <View style={styles.subMetrics}>
                <Text style={[styles.subStatus, { color: theme.colors.success }]}>
                  {sub.status}
                </Text>
                <Text style={[styles.subLoad, { color: theme.colors.textMuted }]}>
                  OUTPUT: {sub.load}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </IronManHudOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 28,
  },
  headerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  modelSwitcher: {
    flexDirection: 'row',
    gap: 6,
  },
  modelChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  modelChipText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  viewportBox: {
    height: 240,
    borderRadius: 10,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasCenter: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wireframeOuterRing: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringVertex: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  wireframeInnerRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1.5,
  },
  centerCoreNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  floatingControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    gap: 6,
  },
  floatingBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#050D1AE6',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewportFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    backgroundColor: '#01050CE6',
  },
  viewportHudText: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  subsystemGrid: {
    gap: 6,
  },
  subsystemCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subName: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  subMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subStatus: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  subLoad: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
});
