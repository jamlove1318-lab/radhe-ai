import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PersonaMode } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import {
  CloudSun,
  TrendingUp,
  Terminal,
  Calculator,
  Cpu,
  Search,
  ExternalLink,
  Zap,
} from 'lucide-react-native';

interface HudWidgetProps {
  mode: PersonaMode;
  widget: {
    type: 'weather' | 'crypto' | 'code' | 'search' | 'calc' | 'device' | 'table';
    title: string;
    data: any;
  };
}

export const HudWidgetRenderer: React.FC<HudWidgetProps> = ({ mode, widget }) => {
  const theme = getThemeForMode(mode);
  const { type, title, data } = widget;

  return (
    <View
      style={[
        styles.widgetBox,
        {
          borderColor: theme.colors.borderGlow,
          backgroundColor: theme.colors.surfaceElevated,
        },
      ]}
    >
      {/* Widget Header */}
      <View style={[styles.widgetHeader, { borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          {type === 'weather' && <CloudSun size={14} color={theme.colors.primary} />}
          {type === 'crypto' && <TrendingUp size={14} color={theme.colors.accent} />}
          {type === 'code' && <Terminal size={14} color="#00FFA3" />}
          {type === 'calc' && <Calculator size={14} color={theme.colors.primary} />}
          {type === 'device' && <Cpu size={14} color={theme.colors.danger} />}
          {type === 'search' && <Search size={14} color={theme.colors.textSecondary} />}
          <Text style={[styles.widgetTitle, { color: theme.colors.textPrimary }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.liveTag, { color: theme.colors.primary }]}>LIVE TELEMETRY</Text>
      </View>

      {/* Widget Body Rendering */}
      <View style={styles.widgetBody}>
        {/* 1. WEATHER */}
        {type === 'weather' && data && (
          <View style={styles.weatherContent}>
            <View style={styles.tempRow}>
              <Text style={[styles.tempBig, { color: theme.colors.textPrimary }]}>
                {data.tempC}°C
              </Text>
              <View style={styles.tempSubCol}>
                <Text style={[styles.tempFahr, { color: theme.colors.textSecondary }]}>
                  {data.tempF}°F // {data.conditions}
                </Text>
                <Text style={[styles.locationName, { color: theme.colors.primary }]}>
                  {data.location}
                </Text>
              </View>
            </View>
            <View style={styles.weatherMetricsRow}>
              <Text style={[styles.metricText, { color: theme.colors.textMuted }]}>
                HUMIDITY: <Text style={{ color: theme.colors.textPrimary }}>{data.humidity}</Text>
              </Text>
              <Text style={[styles.metricText, { color: theme.colors.textMuted }]}>
                WIND: <Text style={{ color: theme.colors.textPrimary }}>{data.wind}</Text>
              </Text>
              <Text style={[styles.metricText, { color: theme.colors.textMuted }]}>
                AQI: <Text style={{ color: theme.colors.success }}>{data.airQuality}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* 2. CRYPTO / STOCKS */}
        {type === 'crypto' && data && (
          <View style={styles.cryptoContent}>
            <View style={styles.cryptoTopRow}>
              <Text style={[styles.cryptoTicker, { color: theme.colors.primary }]}>
                {data.ticker}
              </Text>
              <Text style={[styles.cryptoPrice, { color: theme.colors.textPrimary }]}>
                {data.price}
              </Text>
              <View
                style={[
                  styles.changePill,
                  {
                    backgroundColor: data.change24h.includes('-')
                      ? 'rgba(255,0,60,0.2)'
                      : 'rgba(0,255,163,0.2)',
                    borderColor: data.change24h.includes('-')
                      ? theme.colors.danger
                      : theme.colors.success,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.changeText,
                    {
                      color: data.change24h.includes('-')
                        ? theme.colors.danger
                        : theme.colors.success,
                    },
                  ]}
                >
                  {data.change24h}
                </Text>
              </View>
            </View>
            <Text style={[styles.marketTrend, { color: theme.colors.textMuted }]}>
              VOLUME 24H: {data.volume24h} // MARKET CAP: {data.marketCap} // {data.status}
            </Text>
          </View>
        )}

        {/* 3. CODE EXECUTION */}
        {type === 'code' && data && (
          <View style={styles.codeContent}>
            <Text style={[styles.consoleLabel, { color: '#00FFA3' }]}>STDOUT / CONSOLE OUTPUT:</Text>
            <View style={styles.terminalBox}>
              <Text style={styles.terminalOutputText}>{data.stdout}</Text>
            </View>
            <Text style={[styles.codeDuration, { color: theme.colors.textMuted }]}>
              EXECUTION DURATION: {data.durationMs}MS // STATUS: EXIT 0
            </Text>
          </View>
        )}

        {/* 4. CALCULATION */}
        {type === 'calc' && data && (
          <View style={styles.calcContent}>
            <Text style={[styles.calcExpr, { color: theme.colors.textSecondary }]}>
              {data.expression} =
            </Text>
            <Text style={[styles.calcResult, { color: theme.colors.primary }]}>
              {data.result}
            </Text>
          </View>
        )}

        {/* 5. SEARCH INTEL */}
        {type === 'search' && Array.isArray(data) && (
          <View style={styles.searchContent}>
            {data.map((item: any, i: number) => (
              <View key={i} style={styles.searchResultItem}>
                <Text style={[styles.searchTitle, { color: theme.colors.primary }]}>
                  {item.title}
                </Text>
                <Text style={[styles.searchSnippet, { color: theme.colors.textPrimary }]}>
                  {item.snippet}
                </Text>
                <Text style={[styles.searchSource, { color: theme.colors.textMuted }]}>
                  SOURCE: {item.source}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 6. DEVICE */}
        {type === 'device' && data && (
          <View style={styles.deviceContent}>
            {Object.entries(data).map(([key, val], idx) => (
              <View key={idx} style={styles.deviceRow}>
                <Text style={[styles.deviceKey, { color: theme.colors.textSecondary }]}>
                  {key.toUpperCase()}:
                </Text>
                <Text style={[styles.deviceVal, { color: theme.colors.textPrimary }]}>
                  {String(val)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widgetBox: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderBottomWidth: 1,
    backgroundColor: '#02070F',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  widgetTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  liveTag: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  widgetBody: {
    padding: 10,
  },
  weatherContent: {
    gap: 6,
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tempBig: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  tempSubCol: {
    gap: 1,
  },
  tempFahr: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  locationName: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  weatherMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  metricText: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  cryptoContent: {
    gap: 4,
  },
  cryptoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cryptoTicker: {
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  cryptoPrice: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  changePill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
    marginLeft: 'auto',
  },
  changeText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  marketTrend: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  codeContent: {
    gap: 4,
  },
  consoleLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  terminalBox: {
    backgroundColor: '#010409',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  terminalOutputText: {
    color: '#00FFA3',
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  codeDuration: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  calcContent: {
    gap: 2,
  },
  calcExpr: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  calcResult: {
    fontSize: 20,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  searchContent: {
    gap: 6,
  },
  searchResultItem: {
    gap: 2,
  },
  searchTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  searchSnippet: {
    fontSize: 11,
    lineHeight: 15,
  },
  searchSource: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  deviceContent: {
    gap: 3,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceKey: {
    fontSize: 9,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  deviceVal: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
});
