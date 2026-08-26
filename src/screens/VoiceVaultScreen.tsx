import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { ElevenLabsService, VoiceMemo } from '../services/elevenLabsService';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Mic,
  MicOff,
  Volume2,
  Key,
  Play,
  Trash2,
  Sparkles,
  Bookmark,
  FileText,
} from 'lucide-react-native';

interface VoiceVaultProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const VoiceVaultScreen: React.FC<VoiceVaultProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [elevenApiKey, setElevenApiKey] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedText, setRecordedText] = useState('');
  const [memos, setMemos] = useState<VoiceMemo[]>([]);
  const [memoTitle, setMemoTitle] = useState('');

  useEffect(() => {
    ElevenLabsService.getApiKey().then(setElevenApiKey);
    ElevenLabsService.getVoiceMemos().then(setMemos);
  }, []);

  const handleSaveApiKey = async () => {
    soundFx.playHudClick();
    await ElevenLabsService.saveApiKey(elevenApiKey);
    alert('ElevenLabs API Key synchronized.');
  };

  const toggleRecording = () => {
    soundFx.playHudClick();
    if (isRecording) {
      speechEngine.stopListening();
      setIsRecording(false);
    } else {
      setRecordedText('');
      speechEngine.registerCallbacks({
        onStateChange: () => {},
        onTranscript: (txt) => setRecordedText(txt),
        onError: () => {},
      });
      speechEngine.startListening();
      setIsRecording(true);
    }
  };

  const handleSaveMemo = async () => {
    if (!recordedText.trim()) return;
    soundFx.playHudClick();

    const title = memoTitle.trim() || `Tactical Memo ${new Date().toLocaleTimeString()}`;
    const newMemo: VoiceMemo = {
      id: `memo-${Date.now()}`,
      title,
      transcript: recordedText.trim(),
      summary: `Executive summary: ${recordedText.substring(0, 80)}...`,
      durationSec: 15,
      timestamp: Date.now(),
    };

    await ElevenLabsService.saveVoiceMemo(newMemo);
    setMemos([newMemo, ...memos]);
    setRecordedText('');
    setMemoTitle('');
  };

  const handleDeleteMemo = async (id: string) => {
    soundFx.playHudClick();
    await ElevenLabsService.deleteVoiceMemo(id);
    setMemos(memos.filter((m) => m.id !== id));
  };

  const handlePlayVoice = (text: string) => {
    soundFx.playHudClick();
    speechEngine.speak(text, mode);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Volume2 size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              VOICE VAULT & TRANSCRIBER
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            ElevenLabs Authentic Voice Synthesis & Tactical Audio Notes
          </Text>
        </View>

        {/* ElevenLabs API Key Card */}
        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Key size={14} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              ELEVENLABS API KEY CONFIGURATION
            </Text>
          </View>
          <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>
            Enables studio-grade Paul Bettany (Jarvis) & James Spader (Ultron) voice cloning.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.keyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              placeholder="xi-api-key..."
              placeholderTextColor={theme.colors.textMuted}
              value={elevenApiKey}
              onChangeText={setElevenApiKey}
              secureTextEntry
            />
            <TouchableOpacity onPress={handleSaveApiKey} style={[styles.saveKeyBtn, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.saveKeyText}>SAVE</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Audio Memo Recorder Box */}
        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}>
          <View style={styles.cardHeader}>
            <Mic size={14} color={isRecording ? theme.colors.danger : theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              {isRecording ? 'TRANSCRIBING LIVE SPEECH...' : 'RECORD AUDIO MEMO / BRIEFING'}
            </Text>
          </View>

          <TextInput
            style={[styles.titleInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            placeholder="Memo Subject / Directive Title..."
            placeholderTextColor={theme.colors.textMuted}
            value={memoTitle}
            onChangeText={setMemoTitle}
          />

          <TextInput
            style={[styles.transcriptInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            placeholder="Speech transcript will appear here in real time..."
            placeholderTextColor={theme.colors.textMuted}
            value={recordedText}
            onChangeText={setRecordedText}
            multiline
          />

          <View style={styles.recordActionRow}>
            <HolographicButton
              title={isRecording ? 'Stop Recording' : 'Start Speech Dictation'}
              mode={mode}
              variant={isRecording ? 'danger' : 'primary'}
              onPress={toggleRecording}
              icon={isRecording ? <MicOff size={14} color="#FFF" /> : <Mic size={14} color="#FFF" />}
              style={{ flex: 1 }}
            />
            {recordedText.trim().length > 0 && (
              <HolographicButton
                title="Save Memo"
                mode={mode}
                variant="secondary"
                onPress={handleSaveMemo}
                style={{ flex: 0.8 }}
              />
            )}
          </View>
        </View>

        {/* Saved Audio Directives List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          INDEXED VOICE MEMOS & DIRECTIVES ({memos.length}):
        </Text>

        <View style={styles.memosList}>
          {memos.map((memo) => (
            <View
              key={memo.id}
              style={[
                styles.memoCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <View style={styles.memoTopRow}>
                <View style={styles.memoTitleGroup}>
                  <FileText size={14} color={theme.colors.primary} />
                  <Text style={[styles.memoTitle, { color: theme.colors.textPrimary }]}>
                    {memo.title}
                  </Text>
                </View>
                <View style={styles.memoActionGroup}>
                  <TouchableOpacity onPress={() => handlePlayVoice(memo.transcript)}>
                    <Volume2 size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteMemo(memo.id)}>
                    <Trash2 size={14} color="#5A6F87" />
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={[styles.memoTranscript, { color: theme.colors.textPrimary }]}>
                "{memo.transcript}"
              </Text>
              <Text style={[styles.memoSummary, { color: theme.colors.textSecondary }]}>
                {memo.summary}
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
  card: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  cardSub: {
    fontSize: 9,
    lineHeight: 13,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  keyInput: {
    flex: 1,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  saveKeyBtn: {
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveKeyText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000',
    fontFamily: 'monospace',
  },
  titleInput: {
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  transcriptInput: {
    minHeight: 48,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlignVertical: 'top',
  },
  recordActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  memosList: {
    gap: 6,
  },
  memoCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  memoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memoTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  memoActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memoTranscript: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  memoSummary: {
    fontSize: 9,
    lineHeight: 14,
  },
});
