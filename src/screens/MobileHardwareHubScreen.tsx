import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { HardwareLabService, SensorTelemetry } from '../services/hardwareLabService';
import { soundFx } from '../audio/soundEngine';
import {
  Smartphone,
  Gauge,
  Compass,
  Volume2,
  Vibrate,
  Monitor,
  BatteryCharging,
  Zap,
  Activity,
  Flame,
  Layers,
  Sparkles,
  Waves,
} from 'lucide-react-native';

interface MobileHardwareHubProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const MobileHardwareHubScreen: React.FC<MobileHardwareHubProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [telemetry, setTelemetry] = useState<SensorTelemetry>(HardwareLabService.getLiveDiagnostics());
  const [activeTab, setActiveTab] = useState<'SENSORS' | 'DISPLAY' | 'AUDIO' | 'LEVEL'>('SENSORS');
  const [toneFreq, setToneFreq] = useState(440);
  const [screenTestColor, setScreenTestColor] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry(HardwareLabService.getLiveDiagnostics());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePlayTone = (freq: number) => {
    soundFx.playHudClick();
    setToneFreq(freq);
    HardwareLabService.playAudioFrequencyTone(freq, 700);
  };

  const handleHaptic = (pattern: 'CLICK' | 'HEAVY' | 'PULSE') => {
    soundFx.playScanBlip();
    HardwareLabService.triggerHapticPattern(pattern);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Smartphone size={20} color="#FFD700" />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              MOBILE HARDWARE & SENSOR LAB
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Full Telemetry, Display Diagnostics, Acoustic Sweeper & Haptic Engine
          </Text>
        </View>

        {/* Feature Sub-Navigation */}
        <View style={styles.tabNavRow}>
          {[
            { key: 'SENSORS', label: 'SENSORS', icon: Gauge },
            { key: 'DISPLAY', label: 'DISPLAY', icon: Monitor },
            { key: 'AUDIO', label: 'ACOUSTICS', icon: Volume2 },
            { key: 'LEVEL', label: 'SPIRIT LEVEL', icon: Compass },
          ].map((t) => {
            const Icon = t.icon;
            const isSel = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => {
                  soundFx.playHudClick();
                  setActiveTab(t.key as any);
                }}
                style={[
                  styles.tabNavBtn,
                  {
                    borderColor: isSel ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                  },
                ]}
              >
                <Icon size={12} color={isSel ? theme.colors.primary : '#5A6F87'} />
                <Text
                  style={[
                    styles.tabNavLabel,
                    { color: isSel ? theme.colors.primary : '#5A6F87' },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TAB 1: SENSORS MATRIX */}
        {activeTab === 'SENSORS' && (
          <View style={styles.sectionWrap}>
            {/* Battery & Thermal Health */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <BatteryCharging size={14} color="#00FFA3" />
                <Text style={[styles.cardTitle, { color: '#00FFA3' }]}>
                  POWER CELL & BATTERY TELEMETRY
                </Text>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>CHARGE LEVEL</Text>
                  <Text style={[styles.cellVal, { color: '#00FFA3' }]}>
                    {telemetry.batteryHealth.levelPercent}%
                  </Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>VOLTAGE</Text>
                  <Text style={styles.cellVal}>{telemetry.batteryHealth.voltageMv} mV</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>CELL TEMPERATURE</Text>
                  <Text style={styles.cellVal}>{telemetry.batteryHealth.temperatureC}°C</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>CHARGING SPEED</Text>
                  <Text style={[styles.cellVal, { color: '#FFD700' }]}>
                    {telemetry.batteryHealth.chargingWattage}W Fast Charge
                  </Text>
                </View>
              </View>
            </View>

            {/* Accelerometer G-Force */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Activity size={14} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  3-AXIS ACCELEROMETER (GRAVITATIONAL G-FORCE)
                </Text>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>X-AXIS (LATERAL)</Text>
                  <Text style={styles.cellVal}>{telemetry.accelerometer.x} m/s²</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Y-AXIS (VERTICAL)</Text>
                  <Text style={styles.cellVal}>{telemetry.accelerometer.y} m/s²</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>Z-AXIS (DEPTH)</Text>
                  <Text style={styles.cellVal}>{telemetry.accelerometer.z} m/s²</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>TOTAL GRAVITY</Text>
                  <Text style={[styles.cellVal, { color: theme.colors.success }]}>
                    {telemetry.accelerometer.totalG}G (Earth Standard)
                  </Text>
                </View>
              </View>
            </View>

            {/* Magnetometer & Compass */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Compass size={14} color={theme.colors.accent} />
                <Text style={[styles.cardTitle, { color: theme.colors.accent }]}>
                  MAGNETOMETER & DIGITAL COMPASS
                </Text>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>HEADING</Text>
                  <Text style={[styles.cellVal, { color: theme.colors.accent }]}>
                    {telemetry.magnetometer.compassDirection}
                  </Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>MAGNETIC FIELD</Text>
                  <Text style={styles.cellVal}>
                    {telemetry.magnetometer.strengthMicroTesla} µT
                  </Text>
                </View>
              </View>
            </View>

            {/* Environmental Decibel Level */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Waves size={14} color="#00FFA3" />
                <Text style={[styles.cardTitle, { color: '#00FFA3' }]}>
                  AMBIENT NOISE DECIBEL SENSOR ({telemetry.decibelLevel} dB)
                </Text>
              </View>
              <View style={[styles.dbBarBg, { borderColor: theme.colors.border }]}>
                <View
                  style={[
                    styles.dbBarFill,
                    {
                      width: `${Math.min(100, (telemetry.decibelLevel / 100) * 100)}%`,
                      backgroundColor:
                        telemetry.decibelLevel > 70
                          ? theme.colors.danger
                          : telemetry.decibelLevel > 50
                          ? '#FFD700'
                          : '#00FFA3',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: DISPLAY DIAGNOSTICS */}
        {activeTab === 'DISPLAY' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Monitor size={14} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  DISPLAY & PANEL SPECIFICATIONS
                </Text>
              </View>
              <View style={styles.metricGrid}>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>REFRESH RATE</Text>
                  <Text style={[styles.cellVal, { color: '#00FFA3' }]}>
                    {telemetry.displaySpecs.refreshRateHz} Hz (Ultra Smooth)
                  </Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>COLOR DEPTH</Text>
                  <Text style={styles.cellVal}>{telemetry.displaySpecs.colorDepth}</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>PIXEL DENSITY</Text>
                  <Text style={styles.cellVal}>{telemetry.displaySpecs.pixelRatio}x Retina</Text>
                </View>
                <View style={styles.gridCell}>
                  <Text style={styles.cellLabel}>ACTIVE RESOLUTION</Text>
                  <Text style={styles.cellVal}>{telemetry.displaySpecs.screenResolution}</Text>
                </View>
              </View>
            </View>

            {/* Full Screen Color Calibration Test */}
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              DEAD PIXEL & COLOR CALIBRATION TEST:
            </Text>
            <View style={styles.colorTestRow}>
              {[
                { name: 'Red', hex: '#FF003C' },
                { name: 'Green', hex: '#00FF66' },
                { name: 'Blue', hex: '#0066FF' },
                { name: 'White', hex: '#FFFFFF' },
                { name: 'OLED Black', hex: '#000000' },
              ].map((c) => (
                <TouchableOpacity
                  key={c.name}
                  onPress={() => setScreenTestColor(c.hex)}
                  style={[styles.colorTestChip, { backgroundColor: c.hex, borderColor: theme.colors.border }]}
                >
                  <Text
                    style={[
                      styles.colorTestText,
                      { color: c.hex === '#FFFFFF' ? '#000' : '#FFF' },
                    ]}
                  >
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {screenTestColor && (
              <TouchableOpacity
                onPress={() => setScreenTestColor(null)}
                style={[styles.screenTestPreview, { backgroundColor: screenTestColor }]}
              >
                <Text
                  style={[
                    styles.exitTestText,
                    { color: screenTestColor === '#FFFFFF' ? '#000' : '#FFF' },
                  ]}
                >
                  [Tap Anywhere to Exit Color Test]
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 3: ACOUSTIC SWEEPER & HAPTIC ENGINE */}
        {activeTab === 'AUDIO' && (
          <View style={styles.sectionWrap}>
            {/* Frequency Tone Generator */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Volume2 size={14} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                  SPEAKER FREQUENCY SWEEPER ({toneFreq} Hz)
                </Text>
              </View>
              <Text style={[styles.explainText, { color: theme.colors.textSecondary }]}>
                Test your phone's speaker acoustic range from sub-bass to high treble.
              </Text>
              <View style={styles.toneBtnGrid}>
                {[
                  { label: 'Sub-Bass (80Hz)', freq: 80 },
                  { label: 'Water Eject (165Hz)', freq: 165 },
                  { label: 'Concert Pitch (440Hz)', freq: 440 },
                  { label: 'Mid-Range (1000Hz)', freq: 1000 },
                  { label: 'High Treble (8000Hz)', freq: 8000 },
                  { label: 'Ultrasonic (14000Hz)', freq: 14000 },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.freq}
                    onPress={() => handlePlayTone(t.freq)}
                    style={[
                      styles.toneBtn,
                      {
                        borderColor: toneFreq === t.freq ? theme.colors.primary : theme.colors.border,
                        backgroundColor: toneFreq === t.freq ? 'rgba(0, 240, 255, 0.15)' : '#01050A',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.toneBtnText,
                        { color: toneFreq === t.freq ? theme.colors.primary : theme.colors.textPrimary },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Haptic Vibration Engine */}
            <View style={[styles.metricCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <View style={styles.cardTopRow}>
                <Vibrate size={14} color="#00FFA3" />
                <Text style={[styles.cardTitle, { color: '#00FFA3' }]}>
                  HAPTIC FEEDBACK MOTOR TESTER
                </Text>
              </View>
              <Text style={[styles.explainText, { color: theme.colors.textSecondary }]}>
                Trigger precision haptic actuator vibration profiles on your device.
              </Text>
              <View style={styles.hapticRow}>
                <HolographicButton
                  title="Subtle Click (20ms)"
                  mode={mode}
                  onPress={() => handleHaptic('CLICK')}
                  style={{ flex: 1 }}
                />
                <HolographicButton
                  title="Heavy Impact"
                  mode={mode}
                  variant="secondary"
                  onPress={() => handleHaptic('HEAVY')}
                  style={{ flex: 1 }}
                />
                <HolographicButton
                  title="Tactical Pulse"
                  mode={mode}
                  variant="danger"
                  onPress={() => handleHaptic('PULSE')}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: DIGITAL SPIRIT LEVEL */}
        {activeTab === 'LEVEL' && (
          <View style={styles.sectionWrap}>
            <View style={[styles.levelCard, { borderColor: theme.colors.primary, backgroundColor: '#020712' }]}>
              <Text style={[styles.levelTitle, { color: theme.colors.primary }]}>
                DIGITAL ACCELEROMETER SPIRIT LEVEL
              </Text>
              <Text style={[styles.levelSub, { color: theme.colors.textSecondary }]}>
                Use your phone's gravity sensors to measure exact levelness of any surface.
              </Text>

              {/* Bubble Visualizer */}
              <View style={[styles.bubbleRing, { borderColor: theme.colors.primaryGlow }]}>
                <View style={[styles.bubbleCrossH, { backgroundColor: theme.colors.gridLine }]} />
                <View style={[styles.bubbleCrossV, { backgroundColor: theme.colors.gridLine }]} />
                <View
                  style={[
                    styles.bubbleDot,
                    {
                      backgroundColor:
                        Math.abs(telemetry.gyroscope.roll) < 2 && Math.abs(telemetry.gyroscope.pitch) < 2
                          ? '#00FFA3'
                          : theme.colors.primary,
                      transform: [
                        { translateX: telemetry.gyroscope.roll * 3 },
                        { translateY: telemetry.gyroscope.pitch * 3 },
                      ],
                    },
                  ]}
                />
              </View>

              <Text style={[styles.levelAngleText, { color: theme.colors.textPrimary }]}>
                PITCH: {telemetry.gyroscope.pitch}° // ROLL: {telemetry.gyroscope.roll}°
              </Text>
              <Text
                style={[
                  styles.levelStatusBadge,
                  {
                    color:
                      Math.abs(telemetry.gyroscope.roll) < 2 && Math.abs(telemetry.gyroscope.pitch) < 2
                        ? '#00FFA3'
                        : '#FFD700',
                  },
                ]}
              >
                {Math.abs(telemetry.gyroscope.roll) < 2 && Math.abs(telemetry.gyroscope.pitch) < 2
                  ? 'PERFECTLY LEVEL (0°)'
                  : 'SURFACE INCLINED'}
              </Text>
            </View>
          </View>
        )}
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
  tabNavRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  tabNavLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sectionWrap: {
    gap: 10,
  },
  metricCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 0.8,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  gridCell: {
    width: '48.5%',
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#01050A',
    gap: 2,
  },
  cellLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#5A6F87',
  },
  cellVal: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#E0F7FF',
  },
  dbBarBg: {
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#010408',
    overflow: 'hidden',
  },
  dbBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  explainText: {
    fontSize: 10,
    lineHeight: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  colorTestRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorTestChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  colorTestText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  screenTestPreview: {
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  exitTestText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  toneBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toneBtn: {
    width: '48.5%',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  toneBtnText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  hapticRow: {
    gap: 6,
  },
  levelCard: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 10,
  },
  levelTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  levelSub: {
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  bubbleRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#01050F',
  },
  bubbleCrossH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  bubbleCrossV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  bubbleDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  levelAngleText: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  levelStatusBadge: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
});
