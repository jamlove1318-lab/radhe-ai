import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { NetworkService, NetworkDiagnostic, DiscoveredDevice } from '../services/networkService';
import { soundFx } from '../audio/soundEngine';
import {
  Wifi,
  Radio,
  Server,
  Tv,
  Smartphone,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Zap,
} from 'lucide-react-native';

interface NetworkScannerProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const NetworkScannerScreen: React.FC<NetworkScannerProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [isScanning, setIsScanning] = useState(false);
  const [diagnostics, setDiagnostics] = useState<NetworkDiagnostic | null>(null);

  useEffect(() => {
    runScan();
  }, []);

  const runScan = async () => {
    setIsScanning(true);
    soundFx.playAlert();
    try {
      const data = await NetworkService.scanLocalNetwork();
      setDiagnostics(data);
      soundFx.playTargetLock();
    } catch (e) {
      console.warn('Scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const getDeviceIcon = (type: DiscoveredDevice['deviceType']) => {
    switch (type) {
      case 'ROUTER': return <Wifi size={16} color={theme.colors.primary} />;
      case 'SERVER': return <Server size={16} color={theme.colors.accent} />;
      case 'SMART_TV': return <Tv size={16} color="#00FFA3" />;
      case 'MOBILE': return <Smartphone size={16} color={theme.colors.primary} />;
      default: return <Cpu size={16} color="#FFAA00" />;
    }
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Radio size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              NETWORK & IoT RECONNAISSANCE SCANNER
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Local Subnet Topology, Ping Latency & IoT Device Discovery
          </Text>
        </View>

        {/* Speed & Gateway Telemetry */}
        {diagnostics && (
          <View style={styles.metricsGrid}>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>DOWNLOAD</Text>
              <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
                {diagnostics.downloadMbps} <Text style={{ fontSize: 10 }}>Mbps</Text>
              </Text>
            </View>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>UPLOAD</Text>
              <Text style={[styles.metricVal, { color: theme.colors.textPrimary }]}>
                {diagnostics.uploadMbps} <Text style={{ fontSize: 10 }}>Mbps</Text>
              </Text>
            </View>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>JITTER</Text>
              <Text style={[styles.metricVal, { color: theme.colors.success }]}>
                {diagnostics.jitterMs} ms
              </Text>
            </View>
            <View style={[styles.metricBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>SECURITY</Text>
              <Text style={[styles.metricValSmall, { color: theme.colors.primary }]}>
                WPA3-256
              </Text>
            </View>
          </View>
        )}

        {/* Scan Actions */}
        <HolographicButton
          title={isScanning ? 'Scanning Network Subnet...' : 'Execute Full Network Recon Scan'}
          mode={mode}
          disabled={isScanning}
          onPress={runScan}
          icon={isScanning ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={14} color="#FFF" />}
        />

        {/* Connected Devices Table */}
        {diagnostics && (
          <View style={styles.devicesSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              CONNECTED LOCAL NODES & IoT DEVICES ({diagnostics.devices.length}):
            </Text>

            <View style={styles.deviceList}>
              {diagnostics.devices.map((dev, i) => (
                <View
                  key={i}
                  style={[
                    styles.deviceCard,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: theme.colors.surface,
                    },
                  ]}
                >
                  <View style={styles.deviceTopRow}>
                    <View style={styles.deviceTitleGroup}>
                      {getDeviceIcon(dev.deviceType)}
                      <Text style={[styles.deviceHost, { color: theme.colors.textPrimary }]}>
                        {dev.hostname}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        {
                          borderColor: theme.colors.success,
                          backgroundColor: 'rgba(0, 255, 163, 0.12)',
                        },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: theme.colors.success }]}>
                        {dev.pingMs}ms
                      </Text>
                    </View>
                  </View>

                  <View style={styles.deviceDetailsRow}>
                    <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
                      IP: <Text style={{ color: theme.colors.textPrimary }}>{dev.ip}</Text>
                    </Text>
                    <Text style={[styles.detailText, { color: theme.colors.textMuted }]}>
                      MAC: {dev.mac}
                    </Text>
                  </View>

                  <View style={styles.portsRow}>
                    <Text style={[styles.portsLabel, { color: theme.colors.textSecondary }]}>
                      OPEN PORTS:
                    </Text>
                    {dev.openPorts.map((p) => (
                      <View key={p} style={[styles.portChip, { borderColor: theme.colors.border }]}>
                        <Text style={[styles.portText, { color: theme.colors.primary }]}>{p}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricBox: {
    width: '48.5%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  metricValSmall: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  devicesSection: {
    gap: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  deviceList: {
    gap: 8,
  },
  deviceCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  deviceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deviceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceHost: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  statusTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  deviceDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailText: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  portsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  portsLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  portChip: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    borderWidth: 0.5,
    backgroundColor: '#01040A',
  },
  portText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
});
