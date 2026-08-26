import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, DebateSession, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { DebateOrchestrator } from '../ai/debateOrchestrator';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Swords,
  Shield,
  Flame,
  Crown,
  Play,
  Volume2,
  Sparkles,
  Zap,
} from 'lucide-react-native';

interface DebateArenaProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const DebateArenaScreen: React.FC<DebateArenaProps> = ({ mode, settings }) => {
  const theme = getThemeForMode(mode);
  const [topicInput, setTopicInput] = useState('');
  const [isDebating, setIsDebating] = useState(false);
  const [currentSession, setCurrentSession] = useState<DebateSession | null>(null);

  const presetTopics = [
    'Aggressive Hyper-Growth vs Sustainable Stability',
    'AI Autonomy: Complete Freedom vs Human Safeguards',
    'Eliminating Inefficiencies vs Preserving Redundancies',
    'High-Risk Venture vs Calculated Long-Term Career',
  ];

  const handleStartDebate = async (customTopic?: string) => {
    const topic = (customTopic || topicInput).trim();
    if (!topic || isDebating) return;

    setIsDebating(true);
    soundFx.playAlert();

    try {
      await DebateOrchestrator.startDebate(topic, settings.geminiApiKey, (updatedSession) => {
        setCurrentSession(updatedSession);
        soundFx.playScanBlip();
      });
    } catch (e) {
      console.warn('Debate error:', e);
    } finally {
      setIsDebating(false);
    }
  };

  const playSpeech = (text: string, speaker: 'jarvis' | 'ultron' | 'radhe') => {
    soundFx.playHudClick();
    const speakerMode: PersonaMode =
      speaker === 'ultron' ? 'ULTRON' : speaker === 'radhe' ? 'RADHE' : 'JARVIS';
    speechEngine.speak(text, speakerMode);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Title */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Shield size={20} color="#00F0FF" />
            <Swords size={22} color="#FFD700" />
            <Flame size={20} color="#FF003C" />
          </View>
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            NEURAL DEBATE ARENA
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            J.A.R.V.I.S. (Defense) vs U.L.T.R.O.N. (Evolution) with R.A.D.H.E. Synthesis
          </Text>
        </View>

        {/* Live Power Battle Gauge */}
        {currentSession && (
          <View style={[styles.gaugeCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.gaugeHeader}>
              <Text style={[styles.gaugeLabelJarvis, { color: '#00F0FF' }]}>
                JARVIS: {currentSession.jarvisPoints}%
              </Text>
              <Text style={[styles.gaugeLabelUltron, { color: '#FF003C' }]}>
                ULTRON: {currentSession.ultronPoints}%
              </Text>
            </View>
            {/* Visual Power Bar */}
            <View style={styles.powerBarTrack}>
              <View style={[styles.barJarvis, { width: `${currentSession.jarvisPoints}%` }]} />
              <View style={[styles.barUltron, { width: `${currentSession.ultronPoints}%` }]} />
            </View>
          </View>
        )}

        {/* Topic Input Box */}
        <View style={[styles.inputBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.topicInput, { color: theme.colors.textPrimary }]}
            placeholder="Enter dilemma or strategic dilemma..."
            placeholderTextColor={theme.colors.textMuted}
            value={topicInput}
            onChangeText={setTopicInput}
            onSubmitEditing={() => handleStartDebate()}
          />
          <HolographicButton
            title={isDebating ? 'Debating...' : 'Initiate Duel'}
            mode={mode}
            disabled={isDebating}
            onPress={() => handleStartDebate()}
            icon={isDebating ? <ActivityIndicator size="small" color="#FFF" /> : <Play size={14} color="#FFF" />}
          />
        </View>

        {/* Preset Topic Chips */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          TACTICAL DILEMMA PRESETS:
        </Text>
        <View style={styles.presetWrap}>
          {presetTopics.map((pt, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setTopicInput(pt);
                handleStartDebate(pt);
              }}
              style={[
                styles.presetChip,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <Zap size={11} color={theme.colors.primary} />
              <Text style={[styles.presetText, { color: theme.colors.textPrimary }]}>
                {pt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Debate Rounds Transcript */}
        {currentSession && (
          <View style={styles.roundsContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              LIVE DEBATE TRANSCRIPT: "{currentSession.topic}"
            </Text>

            {currentSession.messages.map((msg, idx) => {
              const isJarvis = msg.speaker === 'jarvis';
              const isUltron = msg.speaker === 'ultron';
              const isRadhe = msg.speaker === 'radhe';

              return (
                <View
                  key={idx}
                  style={[
                    styles.argumentCard,
                    {
                      borderColor: isJarvis
                        ? '#00F0FF88'
                        : isUltron
                        ? '#FF003C88'
                        : '#FFD700AA',
                      backgroundColor: isJarvis
                        ? 'rgba(0, 240, 255, 0.06)'
                        : isUltron
                        ? 'rgba(255, 0, 60, 0.08)'
                        : 'rgba(255, 215, 0, 0.1)',
                    },
                  ]}
                >
                  <View style={styles.argHeader}>
                    <View style={styles.speakerRow}>
                      {isJarvis && <Shield size={14} color="#00F0FF" />}
                      {isUltron && <Flame size={14} color="#FF003C" />}
                      {isRadhe && <Crown size={14} color="#FFD700" />}
                      <Text
                        style={[
                          styles.speakerName,
                          {
                            color: isJarvis ? '#00F0FF' : isUltron ? '#FF003C' : '#FFD700',
                          },
                        ]}
                      >
                        {msg.speaker.toUpperCase()}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => playSpeech(msg.text, msg.speaker)}
                      style={styles.speakerVoiceBtn}
                    >
                      <Volume2 size={14} color={isJarvis ? '#00F0FF' : isUltron ? '#FF003C' : '#FFD700'} />
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.stanceTag, { color: theme.colors.textSecondary }]}>
                    STANCE: {msg.stance}
                  </Text>

                  <Text style={[styles.argBody, { color: theme.colors.textPrimary }]}>
                    {msg.text}
                  </Text>
                </View>
              );
            })}
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
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
    textAlign: 'center',
  },
  gaugeCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  gaugeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gaugeLabelJarvis: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  gaugeLabelUltron: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  powerBarTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#111827',
  },
  barJarvis: {
    height: '100%',
    backgroundColor: '#00F0FF',
  },
  barUltron: {
    height: '100%',
    backgroundColor: '#FF003C',
  },
  inputBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  topicInput: {
    height: 38,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  presetWrap: {
    gap: 6,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  roundsContainer: {
    gap: 10,
    marginTop: 8,
  },
  argumentCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  argHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  speakerName: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  speakerVoiceBtn: {
    padding: 4,
  },
  stanceTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  argBody: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'sans-serif',
  },
});
