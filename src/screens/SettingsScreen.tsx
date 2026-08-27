import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { PersonaMode, AppSettings, LLMProvider } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { storageService } from '../services/storageService';
import { MultiProviderClient, SUPPORTED_MODELS } from '../ai/multiProviderClient';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Key,
  Volume2,
  Cpu,
  Trash2,
  Save,
  CheckCircle,
  Globe,
  Sparkles,
  Server,
  Zap,
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
  const [activeProvider, setActiveProvider] = useState<LLMProvider>(settings.activeProvider || 'GEMINI');
  
  // API Keys state for all 6 providers
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey);
  const [openaiKey, setOpenaiKey] = useState(settings.openaiApiKey || '');
  const [groqKey, setGroqKey] = useState(settings.groqApiKey || '');
  const [cerebrasKey, setCerebrasKey] = useState(settings.cerebrasApiKey || '');
  const [openrouterKey, setOpenrouterKey] = useState(settings.openrouterApiKey || '');
  const [opencodeZenKey, setOpencodeZenKey] = useState(settings.opencodeZenApiKey || '');
  const [opencodeZenBaseUrl, setOpencodeZenBaseUrl] = useState(settings.opencodeZenBaseUrl || 'https://api.opencode.zen/v1');
  const [customModel, setCustomModel] = useState(settings.customModel);

  const [soundEnabled, setSoundEnabled] = useState(settings.soundFxEnabled);
  const [speechEnabled, setSpeechEnabled] = useState(settings.voiceSpeechEnabled);
  const [wakeWord, setWakeWord] = useState(settings.wakeWordEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const providers: Array<{ id: LLMProvider; name: string; tag: string }> = [
    { id: 'GEMINI', name: 'Google Gemini', tag: '2.0 Flash / Pro' },
    { id: 'OPENAI', name: 'OpenAI', tag: 'GPT-4o / o1-mini' },
    { id: 'GROQ', name: 'Groq Cloud', tag: '500+ tok/s LPU' },
    { id: 'CEREBRAS', name: 'Cerebras', tag: 'Wafer-Scale AI' },
    { id: 'OPENROUTER', name: 'OpenRouter', tag: 'Claude / DeepSeek' },
    { id: 'OPENCODE_ZEN', name: 'Opencode Zen', tag: 'Custom Endpoint' },
  ];

  const handleSave = async () => {
    soundFx.playHudClick();
    const updated: AppSettings = {
      ...settings,
      activeProvider,
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
      groqApiKey: groqKey.trim(),
      cerebrasApiKey: cerebrasKey.trim(),
      openrouterApiKey: openrouterKey.trim(),
      opencodeZenApiKey: opencodeZenKey.trim(),
      opencodeZenBaseUrl: opencodeZenBaseUrl.trim(),
      customModel: customModel.trim(),
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

  const handleTestConnection = async () => {
    soundFx.playAlert();
    setIsTesting(true);
    setTestResult(null);

    const tempSettings: AppSettings = {
      ...settings,
      activeProvider,
      geminiApiKey: geminiKey.trim(),
      openaiApiKey: openaiKey.trim(),
      groqApiKey: groqKey.trim(),
      cerebrasApiKey: cerebrasKey.trim(),
      openrouterApiKey: openrouterKey.trim(),
      opencodeZenApiKey: opencodeZenKey.trim(),
      opencodeZenBaseUrl: opencodeZenBaseUrl.trim(),
      customModel: customModel.trim(),
    };

    try {
      const response = await MultiProviderClient.generateResponse(
        'Ping test: Respond in exactly 8 words confirming link.',
        [],
        mode,
        tempSettings
      );
      setTestResult(`[${activeProvider} CONNECTED] ${response.substring(0, 100)}`);
      soundFx.playTargetLock();
    } catch (e: any) {
      setTestResult(`[${activeProvider} ERROR] ${e.message}`);
    } finally {
      setIsTesting(false);
    }
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
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Globe size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              MULTI-PROVIDER AI NEURAL MATRIX
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Connect Gemini, OpenAI, Groq, Cerebras, OpenRouter & Opencode Zen
          </Text>
        </View>

        {/* Provider Switcher Tabs */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          SELECT ACTIVE AI ENGINE PROVIDER:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.providerScroll}>
          {providers.map((p) => {
            const isSel = activeProvider === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  soundFx.playHudClick();
                  setActiveProvider(p.id);
                  const firstModel = SUPPORTED_MODELS[p.id]?.[0]?.id;
                  if (firstModel) setCustomModel(firstModel);
                }}
                style={[
                  styles.providerChip,
                  {
                    borderColor: isSel ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                  },
                ]}
              >
                <Server size={12} color={isSel ? theme.colors.primary : '#5A6F87'} />
                <View>
                  <Text style={[styles.providerChipText, { color: isSel ? theme.colors.primary : theme.colors.textPrimary }]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.providerTag, { color: isSel ? theme.colors.accent : theme.colors.textMuted }]}>
                    {p.tag}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Active Provider Configuration Card */}
        <View style={[styles.card, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surface }]}>
          <View style={styles.cardHeader}>
            <Key size={16} color={theme.colors.primary} />
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              {activeProvider} API CREDENTIALS & MODEL
            </Text>
          </View>

          {/* Provider Specific Input */}
          {activeProvider === 'GEMINI' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                Google Gemini API Key (Gemini 2.0 Flash / Pro)
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="AIzaSy..."
                placeholderTextColor={theme.colors.textMuted}
                value={geminiKey}
                onChangeText={setGeminiKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {activeProvider === 'OPENAI' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                OpenAI API Key (GPT-4o, GPT-4o Mini, o1)
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="sk-proj-..."
                placeholderTextColor={theme.colors.textMuted}
                value={openaiKey}
                onChangeText={setOpenaiKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {activeProvider === 'GROQ' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                Groq Cloud API Key (LPU Ultra-Fast Inference)
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="gsk_..."
                placeholderTextColor={theme.colors.textMuted}
                value={groqKey}
                onChangeText={setGroqKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {activeProvider === 'CEREBRAS' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                Cerebras API Key (Wafer-Scale Engine)
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="csk-..."
                placeholderTextColor={theme.colors.textMuted}
                value={cerebrasKey}
                onChangeText={setCerebrasKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {activeProvider === 'OPENROUTER' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                OpenRouter API Key (Claude 3.5, DeepSeek R1, Llama 3.3)
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="sk-or-v1-..."
                placeholderTextColor={theme.colors.textMuted}
                value={openrouterKey}
                onChangeText={setOpenrouterKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {activeProvider === 'OPENCODE_ZEN' && (
            <>
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
                Opencode Zen / Custom OpenAI-Compatible Base URL:
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="https://api.opencode.zen/v1"
                placeholderTextColor={theme.colors.textMuted}
                value={opencodeZenBaseUrl}
                onChangeText={setOpencodeZenBaseUrl}
                autoCapitalize="none"
              />
              <Text style={[styles.cardDesc, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                Opencode Zen API Key:
              </Text>
              <TextInput
                style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
                placeholder="zen_api_key..."
                placeholderTextColor={theme.colors.textMuted}
                value={opencodeZenKey}
                onChangeText={setOpencodeZenKey}
                secureTextEntry
                autoCapitalize="none"
              />
            </>
          )}

          {/* Model Name Selector */}
          <Text style={[styles.cardDesc, { color: theme.colors.textSecondary, marginTop: 6 }]}>
            TARGET MODEL IDENTIFIER:
          </Text>
          <TextInput
            style={[styles.apiKeyInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
            placeholder="e.g. gemini-2.0-flash, gpt-4o, llama-3.3-70b-versatile..."
            placeholderTextColor={theme.colors.textMuted}
            value={customModel}
            onChangeText={setCustomModel}
            autoCapitalize="none"
          />

          {/* Test Link Button */}
          <HolographicButton
            title={isTesting ? 'Pinging Provider API...' : `Test ${activeProvider} Link`}
            mode={mode}
            variant="secondary"
            icon={<Zap size={14} color="#FFF" />}
            onPress={handleTestConnection}
          />

          {testResult && (
            <View style={[styles.testResultBox, { borderColor: theme.colors.border }]}>
              <Text style={[styles.testResultText, { color: testResult.includes('ERROR') ? theme.colors.danger : theme.colors.success }]}>
                {testResult}
              </Text>
            </View>
          )}
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
            title={savedSuccess ? 'All Settings Synchronized!' : 'Save Multi-Provider Configuration'}
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
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  providerScroll: {
    gap: 8,
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  providerChipText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  providerTag: {
    fontSize: 8,
    fontFamily: 'monospace',
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
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: '#01050A',
  },
  testResultBox: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#01050A',
  },
  testResultText: {
    fontSize: 10,
    fontFamily: 'monospace',
    lineHeight: 14,
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
