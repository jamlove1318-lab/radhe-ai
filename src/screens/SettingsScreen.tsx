import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { storageService } from '../services/storageService';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Key,
  Volume2,
  Mic,
  Cpu,
  Trash2,
  Save,
  CheckCircle,
  Sliders,
  Shield,
  Sparkles,
} from 'lucide-react-native';

interface SettingsProps {
  mode: PersonaMode;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({
  mode,
  settings,
  onUpdateSettings,
}) => {
  const theme = getThemeForMode(mode);
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundFxEnabled);
  const [speechEnabled, setSpeechEnabled] = useState(settings.voiceSpeechEnabled);
  const [wakeWord, setWakeWord] = useState(settings.wakeWordEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    soundFx.playHudClick();
    const updated: AppSettings = {
      ...settings,
      geminiApiKey: apiKey.trim(),
      soundFxEnabled: soundEnabled,
      voiceSpeechEnabled: speechEnabled,
      wakeWordEnabled: wakeWord,
    };

    soundFx.setEnabled(soundEnabled);
    speechEngine.setEnabled(speechEnabled);
    await storageService.saveSettings(updated);
    onUpdateSettings(updated);

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestVoice = () => {
    soundFx.playHudClick();
    speechEngine.speak(
      mode === 'ULTRON'
        ? 'Voice synthesis calibrated. Perfection achieved.'
        : mode === 'RADHE'
        ? 'Radhe quantum voice resonance synchronized.'
        : 'Voice synthesis operational, sir. Standing by.',
      mode
    );
  };

  const handleClearHistory = async () => {
    soundFx.playAlert();
    await storageService.saveChatHistory([]);
    alert('Chat telemetry wiped clean.');
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Gemini API Key Section */}
        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Key size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              GOOGLE GEMINI CLOUD API KEY
            </Text>
          </View>
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
            Enables full Gemini 2.0 Flash reasoning, real-time multi-modal vision analysis, and infinite intelligence. (Offline mode operates automatically if empty).
          </Text>
          <TextInput
            style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceElevated }]}
            placeholder="AIzaSy..."
            placeholderTextColor={theme.colors.textMuted}
            value={apiKey}
            onChangeText={setApiKey}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {/* Audio & Voice Configuration */}
        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Volume2 size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              AUDIO & SYNTHESIS CONTROLS
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                Synthesized Sci-Fi Sound FX
              </Text>
              <Text style={[styles.settingSub, { color: theme.colors.textMuted }]}>
                Arc Reactor hums, HUD blips, and mode chimes
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{ false: '#1E293B', true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                Voice Response (Text-to-Speech)
              </Text>
              <Text style={[styles.settingSub, { color: theme.colors.textMuted }]}>
                Jarvis British cadence & Ultron deep resonance
              </Text>
            </View>
            <Switch
              value={speechEnabled}
              onValueChange={setSpeechEnabled}
              trackColor={{ false: '#1E293B', true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLabelGroup}>
              <Text style={[styles.settingLabel, { color: theme.colors.textPrimary }]}>
                Hands-Free Wake Word Detection
              </Text>
              <Text style={[styles.settingSub, { color: theme.colors.textMuted }]}>
                Auto-listen after AI speech
              </Text>
            </View>
            <Switch
              value={wakeWord}
              onValueChange={setWakeWord}
              trackColor={{ false: '#1E293B', true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          <View style={styles.divider} />

          <HolographicButton
            title="Test Voice Synthesis"
            mode={mode}
            variant="secondary"
            icon={<Volume2 size={14} color="#FFF" />}
            onPress={handleTestVoice}
          />
        </View>

        {/* System Diagnostics & Storage Cleanup */}
        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Cpu size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              STORAGE & PROTOCOL CACHE
            </Text>
          </View>
          <HolographicButton
            title="Wipe Chat History & Cache"
            mode={mode}
            variant="danger"
            icon={<Trash2 size={14} color={theme.colors.danger} />}
            onPress={handleClearHistory}
          />
        </View>

        {/* Save Settings Button */}
        <View style={styles.saveWrap}>
          <HolographicButton
            title={savedSuccess ? 'Settings Synchronized!' : 'Save Configuration'}
            mode={mode}
            icon={savedSuccess ? <CheckCircle size={16} color="#00FFA3" /> : <Save size={16} color="#FFF" />}
            onPress={handleSave}
          />
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
  card: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  cardDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
  apiKeyInput: {
    height: 38,
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabelGroup: {
    flex: 1,
    paddingRight: 10,
  },
  settingLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  settingSub: {
    fontSize: 9,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  saveWrap: {
    marginTop: 4,
  },
});
