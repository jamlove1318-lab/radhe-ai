import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, VisionScanResult, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { GeminiClient } from '../ai/geminiClient';
import { soundFx } from '../audio/soundEngine';
import { storageService } from '../services/storageService';
import {
  Camera,
  Scan,
  ShieldAlert,
  Target,
  Crosshair,
  Layers,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';

interface VisionScannerProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const VisionScannerScreen: React.FC<VisionScannerProps> = ({ mode, settings }) => {
  const theme = getThemeForMode(mode);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<VisionScanResult | null>(null);
  const [gridOverlayActive, setGridOverlayActive] = useState(true);
  const [selectedEntityIndex, setSelectedEntityIndex] = useState<number | null>(null);

  useEffect(() => {
    // Run initial tactical scan
    executeScan();
  }, [mode]);

  const executeScan = async () => {
    setIsScanning(true);
    soundFx.playScanBlip();

    setTimeout(() => {
      soundFx.playTargetLock();
    }, 600);

    const result = await GeminiClient.analyzeImage('', settings.geminiApiKey, mode);
    setScanResult(result);
    setIsScanning(false);
    storageService.saveScan(result);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* HUD Scanner Viewfinder Box */}
        <View
          style={[
            styles.viewfinder,
            {
              borderColor: theme.colors.primary,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          {/* Simulated HUD Optical Feed */}
          <View style={styles.feedBackground}>
            {/* Sci-Fi Grid lines */}
            {gridOverlayActive && (
              <View style={styles.gridMatrix}>
                <View style={[styles.crosshairH, { backgroundColor: theme.colors.gridLine }]} />
                <View style={[styles.crosshairV, { backgroundColor: theme.colors.gridLine }]} />
                <View
                  style={[
                    styles.centerReticle,
                    { borderColor: theme.colors.primary, borderStyle: 'dashed' },
                  ]}
                />
              </View>
            )}

            {/* Tactical Detected Entity Bounding Boxes */}
            {scanResult?.entities.map((entity, i) => {
              const isSelected = selectedEntityIndex === i;
              return (
                <TouchableOpacity
                  key={i}
                  activeOpacity={0.8}
                  onPress={() => {
                    soundFx.playHudClick();
                    setSelectedEntityIndex(isSelected ? null : i);
                  }}
                  style={[
                    styles.boundingBox,
                    {
                      left: `${entity.x || 15 + i * 25}%`,
                      top: `${entity.y || 20 + i * 18}%`,
                      width: `${entity.width || 38}%`,
                      height: `${entity.height || 26}%`,
                      borderColor:
                        entity.threatLevel === 'CRITICAL'
                          ? theme.colors.danger
                          : isSelected
                          ? theme.colors.accent
                          : theme.colors.primary,
                      backgroundColor: isSelected
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(0, 0, 0, 0.25)',
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.targetTag,
                      {
                        backgroundColor:
                          entity.threatLevel === 'CRITICAL'
                            ? theme.colors.danger
                            : theme.colors.primary,
                      },
                    ]}
                  >
                    <Text style={styles.targetTagText}>
                      [{entity.category}] {entity.name} ({(entity.confidence * 100).toFixed(0)}%)
                    </Text>
                  </View>

                  {/* Corner notches */}
                  <View style={[styles.boxNotchTL, { borderColor: theme.colors.primary }]} />
                  <View style={[styles.boxNotchBR, { borderColor: theme.colors.primary }]} />
                </TouchableOpacity>
              );
            })}

            {isScanning && (
              <View style={styles.scanOverlay}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={[styles.scanningText, { color: theme.colors.primary }]}>
                  ACQUIRING MULTI-SPECTRUM TARGET TELEMETRY...
                </Text>
              </View>
            )}
          </View>

          {/* Scanner Viewfinder Telemetry Bar */}
          <View style={[styles.viewfinderFooter, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.hudLabel, { color: theme.colors.textSecondary }]}>
              OPTICAL FEED: 4K 120FPS // LIDAR: ACTIVE
            </Text>
            <TouchableOpacity
              onPress={() => setGridOverlayActive(!gridOverlayActive)}
              style={styles.hudToggleBtn}
            >
              <Layers size={13} color={theme.colors.primary} />
              <Text style={[styles.hudToggleText, { color: theme.colors.primary }]}>
                {gridOverlayActive ? 'GRID: ON' : 'GRID: OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Scan Actions */}
        <View style={styles.scanActionRow}>
          <HolographicButton
            title="Perform Full Scan"
            mode={mode}
            icon={<Scan size={16} color="#FFF" />}
            onPress={executeScan}
            style={{ flex: 1 }}
          />
        </View>

        {/* Tactical Report Details */}
        {scanResult && (
          <View style={styles.reportCard}>
            <View
              style={[
                styles.reportHeader,
                {
                  borderColor:
                    scanResult.threatLevel === 'CRITICAL'
                      ? theme.colors.danger
                      : theme.colors.border,
                  backgroundColor: theme.colors.surfaceElevated,
                },
              ]}
            >
              <View style={styles.threatRow}>
                {scanResult.threatLevel === 'CRITICAL' ? (
                  <AlertTriangle size={18} color={theme.colors.danger} />
                ) : (
                  <CheckCircle size={18} color={theme.colors.success} />
                )}
                <Text style={[styles.reportTitle, { color: theme.colors.textPrimary }]}>
                  TACTICAL SCAN SUMMARY
                </Text>
              </View>
              <View
                style={[
                  styles.threatBadge,
                  {
                    backgroundColor:
                      scanResult.threatLevel === 'CRITICAL'
                        ? 'rgba(255,0,60,0.2)'
                        : 'rgba(0,255,163,0.15)',
                    borderColor:
                      scanResult.threatLevel === 'CRITICAL'
                        ? theme.colors.danger
                        : theme.colors.success,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.threatBadgeText,
                    {
                      color:
                        scanResult.threatLevel === 'CRITICAL'
                          ? theme.colors.danger
                          : theme.colors.success,
                    },
                  ]}
                >
                  THREAT: {scanResult.threatLevel}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.reportBody,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <Text style={[styles.summaryText, { color: theme.colors.textPrimary }]}>
                {scanResult.summary}
              </Text>

              <View style={styles.divider} />

              <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                SITUATIONAL AWARENESS:
              </Text>
              <Text style={[styles.bodyText, { color: theme.colors.textPrimary }]}>
                {scanResult.tacticalAnalysis}
              </Text>

              <View style={styles.divider} />

              <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                {mode === 'ULTRON' ? 'OFFENSIVE VECTOR:' : 'TACTICAL RECOMMENDATION:'}
              </Text>
              <Text style={[styles.bodyText, { color: theme.colors.accent }]}>
                {scanResult.actionRecommendation}
              </Text>

              {/* Detected Entities List */}
              <View style={styles.divider} />
              <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                DETECTED ENTITIES ({scanResult.entities.length}):
              </Text>
              <View style={styles.entityList}>
                {scanResult.entities.map((ent, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setSelectedEntityIndex(idx)}
                    style={[
                      styles.entityItem,
                      {
                        borderColor:
                          selectedEntityIndex === idx
                            ? theme.colors.primary
                            : theme.colors.border,
                        backgroundColor: theme.colors.surfaceElevated,
                      },
                    ]}
                  >
                    <View style={styles.entityTitleRow}>
                      <Text style={[styles.entityName, { color: theme.colors.textPrimary }]}>
                        {ent.name}
                      </Text>
                      <Text style={[styles.entityConf, { color: theme.colors.textSecondary }]}>
                        {(ent.confidence * 100).toFixed(0)}%
                      </Text>
                    </View>
                    <Text style={[styles.entityNote, { color: theme.colors.textMuted }]}>
                      {ent.tacticalNote}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
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
    paddingBottom: 24,
  },
  viewfinder: {
    height: 260,
    borderRadius: 12,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  feedBackground: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#050D18',
  },
  gridMatrix: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  crosshairV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  centerReticle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 1.5,
    borderRadius: 4,
    padding: 4,
  },
  targetTag: {
    position: 'absolute',
    top: -16,
    left: 0,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 2,
  },
  targetTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'monospace',
  },
  boxNotchTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 6,
    height: 6,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  boxNotchBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 6,
    height: 6,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(3, 11, 21, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  scanningText: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  viewfinderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    backgroundColor: '#02070F',
  },
  hudLabel: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  hudToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hudToggleText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  scanActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  reportCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  threatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  threatBadgeText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '800',
  },
  reportBody: {
    padding: 12,
    borderWidth: 1,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'sans-serif',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 4,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  entityList: {
    gap: 6,
    marginTop: 4,
  },
  entityItem: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  entityTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  entityName: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  entityConf: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  entityNote: {
    fontSize: 10,
    lineHeight: 14,
  },
});
