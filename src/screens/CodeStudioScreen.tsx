import React, { useState } from 'react';
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
import { CodeGenerator, CodeGenerationResult } from '../ai/codeGenerator';
import { ToolRegistry } from '../ai/tools/toolRegistry';
import { soundFx } from '../audio/soundEngine';
import {
  Code,
  Play,
  Copy,
  Check,
  Terminal,
  Layers,
  Sparkles,
  Cpu,
} from 'lucide-react-native';

interface CodeStudioProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const CodeStudioScreen: React.FC<CodeStudioProps> = ({ mode, settings }) => {
  const theme = getThemeForMode(mode);
  const [promptInput, setPromptInput] = useState('');
  const [selectedLang, setSelectedLang] = useState('JavaScript');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [executionOutput, setExecutionOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const supportedLanguages = [
    'JavaScript',
    'Python',
    'TypeScript',
    'SQL',
    'HTML/CSS',
    'C++',
    'Rust',
    'Bash',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const query = (customPrompt || promptInput).trim();
    if (!query || isGenerating) return;

    setIsGenerating(true);
    setExecutionOutput(null);
    soundFx.playAlert();

    try {
      const res = await CodeGenerator.generateCode(
        query,
        selectedLang,
        mode,
        settings.geminiApiKey
      );
      setGeneratedCode(res);
      soundFx.playTargetLock();
    } catch (e) {
      console.warn('Code generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunCode = async () => {
    if (!generatedCode || isRunning) return;
    setIsRunning(true);
    soundFx.playHudClick();

    try {
      const out = await ToolRegistry.execute('execute_code', {
        code: generatedCode.code,
      });
      setExecutionOutput(out.displayText);
      soundFx.playScanBlip();
    } catch (e: any) {
      setExecutionOutput(`Execution Error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    soundFx.playHudClick();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode.code).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const samplePrompts = [
    'Fibonacci prime generator algorithm',
    'Binary search tree implementation with traversal',
    'REST API client with exponential backoff retry',
    'Database schema with analytics aggregation query',
  ];

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Code size={20} color="#00FFA3" />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              CODE SYNTHESIS & DEVELOPER STUDIO
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Multi-Language Code Generation & Local Sandboxed JavaScript Engine
          </Text>
        </View>

        {/* Language Selector Chips */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          TARGET PROGRAMMING LANGUAGE:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.langRow}>
          {supportedLanguages.map((lang) => {
            const isSel = selectedLang === lang;
            return (
              <TouchableOpacity
                key={lang}
                onPress={() => {
                  soundFx.playHudClick();
                  setSelectedLang(lang);
                }}
                style={[
                  styles.langChip,
                  {
                    borderColor: isSel ? theme.colors.primary : theme.colors.border,
                    backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.langText,
                    { color: isSel ? theme.colors.primary : theme.colors.textMuted },
                  ]}
                >
                  {lang}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Prompt Input Box */}
        <View style={[styles.inputBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            DESCRIBE THE CODE OR ALGORITHM YOU NEED:
          </Text>
          <TextInput
            style={[styles.textInput, { color: theme.colors.textPrimary }]}
            placeholder={`e.g. 'Write a ${selectedLang} function to parse data and calculate statistics' ...`}
            placeholderTextColor={theme.colors.textMuted}
            value={promptInput}
            onChangeText={setPromptInput}
            multiline
            numberOfLines={2}
          />
          <HolographicButton
            title={isGenerating ? 'Synthesizing Code...' : `Generate ${selectedLang} Code`}
            mode={mode}
            disabled={isGenerating}
            onPress={() => handleGenerate()}
            icon={isGenerating ? <ActivityIndicator size="small" color="#FFF" /> : <Play size={14} color="#FFF" />}
          />
        </View>

        {/* Sample Templates */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          QUICK PROMPT EXAMPLES:
        </Text>
        <View style={styles.presetsList}>
          {samplePrompts.map((p, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => {
                setPromptInput(p);
                handleGenerate(p);
              }}
              style={[styles.presetItem, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}
            >
              <Sparkles size={12} color={theme.colors.primary} />
              <Text style={[styles.presetText, { color: theme.colors.textPrimary }]}>{p}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Code Output Viewer */}
        {generatedCode && (
          <View style={styles.outputSection}>
            <View style={[styles.codeHeader, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
              <View style={styles.codeTitleGroup}>
                <Terminal size={14} color="#00FFA3" />
                <Text style={[styles.codeLanguageTag, { color: '#00FFA3' }]}>
                  {generatedCode.language.toUpperCase()}
                </Text>
                <Text style={[styles.complexityTag, { color: theme.colors.textMuted }]}>
                  // {generatedCode.complexity}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCopy} style={styles.copyBtn}>
                {copied ? <Check size={14} color="#00FFA3" /> : <Copy size={14} color="#5A6F87" />}
                <Text style={[styles.copyText, { color: copied ? '#00FFA3' : '#5A6F87' }]}>
                  {copied ? 'COPIED' : 'COPY'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Code Content Display */}
            <View style={[styles.codeBody, { borderColor: theme.colors.border }]}>
              <Text style={styles.codeFont}>{generatedCode.code}</Text>
            </View>

            {/* Explanation */}
            <View style={[styles.explainCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.explainLabel, { color: theme.colors.textSecondary }]}>
                TECHNICAL SPECIFICATIONS & ARCHITECTURE:
              </Text>
              <Text style={[styles.explainText, { color: theme.colors.textPrimary }]}>
                {generatedCode.explanation}
              </Text>
            </View>

            {/* Local Execution Option for JavaScript */}
            {generatedCode.runnableInApp && (
              <View style={styles.runActionWrap}>
                <HolographicButton
                  title={isRunning ? 'Executing Sandbox...' : 'Run in Local JavaScript Sandbox'}
                  mode={mode}
                  disabled={isRunning}
                  onPress={handleRunCode}
                  icon={isRunning ? <ActivityIndicator size="small" color="#FFF" /> : <Play size={14} color="#FFF" />}
                />
              </View>
            )}

            {/* Runtime Output */}
            {executionOutput && (
              <View style={[styles.runOutputBox, { borderColor: '#00FFA3' }]}>
                <Text style={[styles.runOutputTitle, { color: '#00FFA3' }]}>
                  SANDBOX EXECUTION LOG:
                </Text>
                <Text style={styles.runOutputFont}>{executionOutput}</Text>
              </View>
            )}
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
  inputBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  textInput: {
    minHeight: 48,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    textAlignVertical: 'top',
  },
  presetsList: {
    gap: 6,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  outputSection: {
    gap: 8,
    marginTop: 6,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  codeTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLanguageTag: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  complexityTag: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  codeBody: {
    backgroundColor: '#010409',
    padding: 12,
    borderWidth: 1,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  codeFont: {
    color: '#00FFA3',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  explainCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  explainLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  explainText: {
    fontSize: 11,
    lineHeight: 16,
  },
  runActionWrap: {
    marginTop: 2,
  },
  runOutputBox: {
    backgroundColor: '#030B14',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  runOutputTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  runOutputFont: {
    color: '#E0F7FF',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 15,
  },
});
