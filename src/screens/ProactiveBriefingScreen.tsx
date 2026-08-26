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
import { BriefingService, DailyBriefing } from '../services/briefingService';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Sun,
  Volume2,
  CheckCircle,
  CloudSun,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Quote,
} from 'lucide-react-native';

interface ProactiveBriefingProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const ProactiveBriefingScreen: React.FC<ProactiveBriefingProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    loadBriefing();
  }, [mode]);

  const loadBriefing = async () => {
    setIsGenerating(true);
    soundFx.playAlert();
    try {
      const data = await BriefingService.generateMorningBriefing(mode);
      setBriefing(data);
      soundFx.playTargetLock();
    } catch (e) {
      console.warn('Briefing error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAudio = () => {
    if (!briefing) return;
    soundFx.playHudClick();
    const fullSpeech = `${briefing.greeting} Here is your tactical overview: Weather: ${briefing.weatherSummary}. Financial telemetry: ${briefing.marketHighlights}. System status: ${briefing.systemHealth}. Have an exceptional operational cycle.`;
    speechEngine.speak(fullSpeech, mode);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Sun size={20} color="#FFAA00" />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              PROACTIVE DAILY BRIEFING & SYSTEM ALERTS
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Automated Morning Synopsis, Financial Pulse & Mission Status
          </Text>
        </View>

        {/* Action Button */}
        <View style={styles.actionRow}>
          <HolographicButton
            title={isGenerating ? 'Compiling Briefing...' : 'Refresh Executive Briefing'}
            mode={mode}
            disabled={isGenerating}
            onPress={loadBriefing}
            icon={isGenerating ? <ActivityIndicator size="small" color="#FFF" /> : <RefreshCw size={14} color="#FFF" />}
            style={{ flex: 1 }}
          />
          {briefing && (
            <HolographicButton
              title="Voice Briefing"
              mode={mode}
              variant="secondary"
              onPress={handlePlayAudio}
              icon={<Volume2 size={14} color="#FFF" />}
              style={{ flex: 0.8 }}
            />
          )}
        </View>

        {/* Briefing Dossier */}
        {briefing && (
          <View style={[styles.briefingCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            {/* Greeting */}
            <View style={styles.greetingBox}>
              <Sparkles size={16} color={theme.colors.primary} />
              <Text style={[styles.greetingText, { color: theme.colors.primary }]}>
                {briefing.greeting}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Weather */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <CloudSun size={14} color={theme.colors.primary} />
                <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                  ATMOSPHERIC RECON:
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.colors.textPrimary }]}>
                {briefing.weatherSummary}
              </Text>
            </View>

            {/* Markets */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <TrendingUp size={14} color={theme.colors.accent} />
                <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                  FINANCIAL & QUANTUM MARKETS:
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.colors.textPrimary }]}>
                {briefing.marketHighlights}
              </Text>
            </View>

            {/* Pending Directives */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <CheckCircle size={14} color={theme.colors.success} />
                <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                  ACTIVE TACTICAL DIRECTIVES:
                </Text>
              </View>
              {briefing.pendingDirectives.map((dir, idx) => (
                <Text key={idx} style={[styles.directiveItem, { color: theme.colors.textPrimary }]}>
                  • {dir}
                </Text>
              ))}
            </View>

            {/* System Health */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeaderRow}>
                <Cpu size={14} color={theme.colors.primary} />
                <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
                  CORE HARDWARE DIAGNOSTICS:
                </Text>
              </View>
              <Text style={[styles.sectionBody, { color: theme.colors.textPrimary }]}>
                {briefing.systemHealth}
              </Text>
            </View>

            <View style={styles.divider} />

            {/* Tactical Quote */}
            <View style={styles.quoteRow}>
              <Quote size={14} color={theme.colors.textSecondary} />
              <Text style={[styles.quoteText, { color: theme.colors.textSecondary }]}>
                {briefing.tacticalQuote}
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  briefingCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  greetingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    flex: 1,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 4,
  },
  sectionBlock: {
    gap: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionHeading: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  sectionBody: {
    fontSize: 11,
    lineHeight: 16,
    paddingLeft: 4,
  },
  directiveItem: {
    fontSize: 11,
    lineHeight: 16,
    paddingLeft: 4,
  },
  quoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  quoteText: {
    fontSize: 10,
    fontStyle: 'italic',
    lineHeight: 14,
    flex: 1,
  },
});
