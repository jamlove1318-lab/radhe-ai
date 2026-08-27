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
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Captions,
  Mic,
  MicOff,
  Globe,
  Languages,
  Tag,
  AlertCircle,
  CheckCircle2,
  Volume2,
} from 'lucide-react-native';

interface LiveSubtitleProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const LiveSubtitleScreen: React.FC<LiveSubtitleProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [isListening, setIsListening] = useState(false);
  const [currentLine, setCurrentLine] = useState('');
  const [micError, setMicError] = useState<string | null>(null);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([
    'JARVIS: "Acoustic sensor calibrated. Ready for real-time speech transcription, sir."',
  ]);
  const [targetLang, setTargetLang] = useState<'EN' | 'ES' | 'FR' | 'DE' | 'HI' | 'JA'>('EN');
  const [detectedKeywords, setDetectedKeywords] = useState<string[]>([
    'Speech',
    'Acoustic',
    'Real-Time',
    'Captions',
  ]);

  const supportedLangs = [
    { code: 'EN', label: 'English' },
    { code: 'ES', label: 'Spanish' },
    { code: 'FR', label: 'French' },
    { code: 'DE', label: 'German' },
    { code: 'HI', label: 'Hindi' },
    { code: 'JA', label: 'Japanese' },
  ] as const;

  const toggleListening = () => {
    soundFx.playHudClick();
    setMicError(null);

    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
    } else {
      setCurrentLine('');
      speechEngine.registerCallbacks({
        onStateChange: (state) => {
          if (state === 'listening') setIsListening(true);
        },
        onTranscript: (txt, isFinal) => {
          setCurrentLine(txt);
          extractKeywords(txt);
          if (isFinal && txt.trim().length > 0) {
            setTranscriptHistory((prev) => [txt.trim(), ...prev].slice(0, 30));
          }
        },
        onError: (err) => {
          setMicError(err);
        },
      });

      speechEngine.startListening(true);
      setIsListening(true);
      soundFx.playTargetLock();
    }
  };

  const extractKeywords = (text: string) => {
    const words = text
      .split(/\s+/)
      .map((w) => w.replace(/[^a-zA-Z]/g, ''))
      .filter((w) => w.length > 4)
      .slice(0, 5);
    if (words.length > 0) {
      setDetectedKeywords((prev) => Array.from(new Set([...words, ...prev])).slice(0, 8));
    }
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Captions size={20} color="#00F0FF" />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              REAL-TIME ACOUSTIC SUBTITLE STREAM
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Continuous Live Microphone Dictation, Spoken Audio Transcripts & Translation
          </Text>
        </View>

        {/* Mic Error Banner if permission needed */}
        {micError && (
          <View style={[styles.errorCard, { borderColor: theme.colors.danger }]}>
            <AlertCircle size={16} color={theme.colors.danger} />
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {micError}
            </Text>
          </View>
        )}

        {/* Translation Language Selector */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          SUBTITLE DISPLAY LANGUAGE:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
          {supportedLangs.map((lang) => {
            const isSel = targetLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                onPress={() => {
                  soundFx.playHudClick();
                  setTargetLang(lang.code);
                }}
                style={[
                  styles.langChip,
                  {
                    borderColor: isSel ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                  },
                ]}
              >
                <Languages size={12} color={isSel ? theme.colors.primary : '#5A6F87'} />
                <Text
                  style={[
                    styles.langText,
                    { color: isSel ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {lang.label} ({lang.code})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Main Live Subtitle Display Box */}
        <View
          style={[
            styles.subtitleViewport,
            {
              borderColor: isListening ? '#00FFA3' : theme.colors.border,
              backgroundColor: '#010611',
            },
          ]}
        >
          {/* Status Indicator */}
          <View style={styles.viewportHeader}>
            <View style={styles.statusIndicatorGroup}>
              <View
                style={[
                  styles.statusPulse,
                  { backgroundColor: isListening ? '#00FFA3' : '#5A6F87' },
                ]}
              />
              <Text style={[styles.statusText, { color: isListening ? '#00FFA3' : '#5A6F87' }]}>
                {isListening ? 'MICROPHONE ACTIVE • TRANSCRIBING LIVE SPEECH' : 'ACOUSTIC SENSOR STANDBY'}
              </Text>
            </View>
            <Text style={[styles.langBadge, { color: theme.colors.primary }]}>
              TARGET: [{targetLang}]
            </Text>
          </View>

          {/* Active Floating Subtitle Line */}
          <View style={styles.activeLineContainer}>
            <Text style={[styles.activeSubtitleText, { color: isListening ? '#00F0FF' : '#5A6F87' }]}>
              {currentLine || (isListening ? '🎙️ Listening... Speak into your microphone now' : 'Press Start Live Subtitles below to begin.')}
            </Text>
          </View>
        </View>

        {/* Live Action Controls */}
        <HolographicButton
          title={isListening ? 'Stop Live Subtitles' : 'Start Live Audio Subtitles'}
          mode={mode}
          variant={isListening ? 'danger' : 'primary'}
          onPress={toggleListening}
          icon={isListening ? <MicOff size={14} color="#FFF" /> : <Mic size={14} color="#FFF" />}
        />

        {/* Detected Topics & Keywords Panel */}
        <View style={[styles.keywordCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeaderRow}>
            <Tag size={13} color={theme.colors.accent} />
            <Text style={[styles.cardTitle, { color: theme.colors.accent }]}>
              DETECTED ENTITY & KEYWORD RADAR:
            </Text>
          </View>
          <View style={styles.chipWrap}>
            {detectedKeywords.map((k, idx) => (
              <View key={idx} style={[styles.keywordChip, { borderColor: theme.colors.border }]}>
                <Text style={[styles.keywordChipText, { color: theme.colors.textPrimary }]}>{k}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Subtitle Dialogue History Log */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          LIVE DIALOGUE TRANSCRIPT BUFFER:
        </Text>
        <View style={styles.historyList}>
          {transcriptHistory.map((item, index) => (
            <View
              key={index}
              style={[
                styles.historyCard,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <Text style={[styles.historyText, { color: theme.colors.textPrimary }]}>
                {item}
              </Text>
            </View>
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 0, 60, 0.1)',
  },
  errorText: {
    fontSize: 10,
    fontFamily: 'monospace',
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  langRow: {
    gap: 6,
  },
  langChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  subtitleViewport: {
    minHeight: 140,
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    gap: 10,
    justifyContent: 'space-between',
  },
  viewportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicatorGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  langBadge: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  activeLineContainer: {
    paddingVertical: 12,
  },
  activeSubtitleText: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: 'monospace',
    lineHeight: 20,
    textAlign: 'center',
  },
  keywordCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 0.8,
    backgroundColor: '#01050A',
  },
  keywordChipText: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  historyList: {
    gap: 6,
  },
  historyCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  historyText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
});
