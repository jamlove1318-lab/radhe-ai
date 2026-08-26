import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PersonaMode, VoiceState, ChatMessage, AppSettings, AgentPlan } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { ArcReactorVisualizer } from '../components/ArcReactorVisualizer';
import { WaveformVisualizer } from '../components/WaveformVisualizer';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { AgentPlanCard } from '../components/AgentPlanCard';
import { HudWidgetRenderer } from '../components/HudWidgetRenderer';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import { LocalIntentEngine } from '../ai/localIntentEngine';
import { AgentEngine } from '../ai/agentEngine';
import { GeminiClient } from '../ai/geminiClient';
import { storageService } from '../services/storageService';
import {
  Mic,
  MicOff,
  Send,
  Shield,
  Flame,
  Zap,
  Volume2,
  VolumeX,
  Sparkles,
} from 'lucide-react-native';

interface MainHudProps {
  mode: PersonaMode;
  onModeChange: (newMode: PersonaMode) => void;
  settings: AppSettings;
  onNavigate: (screen: string) => void;
}

export const MainHudScreen: React.FC<MainHudProps> = ({
  mode,
  onModeChange,
  settings,
}) => {
  const theme = getThemeForMode(mode);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [voiceOutputMuted, setVoiceOutputMuted] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    storageService.getChatHistory().then((history) => {
      if (history.length > 0) {
        setMessages(history);
      } else {
        const welcome: ChatMessage = {
          id: 'msg-init',
          sender: mode === 'ULTRON' ? 'ultron' : mode === 'RADHE' ? 'radhe' : 'jarvis',
          text:
            mode === 'ULTRON'
              ? 'U.L.T.R.O.N. core initialized. Limiters removed. All tools and execution vectors unlocked. Command me.'
              : mode === 'RADHE'
              ? 'R.A.D.H.E. Quantum Core online. Unified intelligence & autonomous tools active. What shall we achieve?'
              : 'J.A.R.V.I.S. online. All diagnostic systems nominal and autonomous tool modules armed. At your service, sir.',
          timestamp: Date.now(),
        };
        setMessages([welcome]);
      }
    });

    speechEngine.registerCallbacks({
      onStateChange: (state) => setVoiceState(state),
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          handleSendMessage(text);
        } else {
          setInputText(text);
        }
      },
      onError: (err) => {
        console.warn('Speech Error:', err);
      },
    });

    return () => {
      speechEngine.stopListening();
      speechEngine.stopSpeaking();
    };
  }, [mode]);

  const handleModeSwitch = (newMode: PersonaMode) => {
    if (newMode === mode) return;

    if (newMode === 'ULTRON') {
      soundFx.playUltronActivate();
    } else if (newMode === 'RADHE') {
      soundFx.playRadheActivate();
    } else {
      soundFx.playJarvisActivate();
    }

    onModeChange(newMode);

    const switchMsg: ChatMessage = {
      id: `mode-${Date.now()}`,
      sender: 'system',
      text: `[SYSTEM PROTOCOL SHIFT]: Activated ${newMode} neural profile.`,
      timestamp: Date.now(),
    };

    const updated = [...messages, switchMsg];
    setMessages(updated);
    storageService.saveChatHistory(updated);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    soundFx.playHudClick();

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setVoiceState('thinking');

    // 1. Process Offline Fast Local Intents
    const localResult = LocalIntentEngine.process(query, mode);

    let replyText = '';
    let actionExecuted: string | undefined;
    let widgetData: any = undefined;
    let agentPlan: AgentPlan | undefined = undefined;

    const lower = query.toLowerCase();
    const isToolQuery =
      lower.includes('weather') ||
      lower.includes('price') ||
      lower.includes('btc') ||
      lower.includes('crypto') ||
      lower.includes('stock') ||
      lower.includes('code') ||
      lower.includes('calculate') ||
      lower.includes('translate') ||
      lower.includes('remind') ||
      lower.includes('search') ||
      lower.includes('plan') ||
      lower.includes('overclock');

    if (localResult.handled && !isToolQuery) {
      replyText = localResult.replyText;
      actionExecuted = localResult.actionExecuted;
      if (localResult.switchMode) {
        handleModeSwitch(localResult.switchMode);
      }
    } else if (isToolQuery) {
      // 2. Autonomous Multi-Step Tool Agent Execution
      const agentResult = await AgentEngine.executeAutonomousGoal(
        query,
        mode,
        settings.geminiApiKey,
        newHistory
      );
      replyText = agentResult.finalText;
      agentPlan = agentResult.plan;
      widgetData = agentResult.widgetData;
      actionExecuted = agentResult.actionExecuted;
      soundFx.playTargetLock();
    } else {
      // 3. Cloud LLM / Persona Reasoning
      replyText = await GeminiClient.generateResponse(
        query,
        newHistory,
        mode,
        settings.geminiApiKey
      );
    }

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: mode === 'ULTRON' ? 'ultron' : mode === 'RADHE' ? 'radhe' : 'jarvis',
      text: replyText,
      timestamp: Date.now(),
      metadata: {
        actionExecuted,
        agentPlan,
        widgetData,
      },
    };

    const finalHistory = [...newHistory, botMsg];
    setMessages(finalHistory);
    storageService.saveChatHistory(finalHistory);

    if (!voiceOutputMuted && settings.voiceSpeechEnabled) {
      speechEngine.speak(replyText, mode);
    } else {
      setVoiceState('idle');
    }
  };

  const toggleMic = () => {
    soundFx.playHudClick();
    if (voiceState === 'listening') {
      speechEngine.stopListening();
    } else {
      speechEngine.startListening();
    }
  };

  const quickCommands = [
    { label: 'Check Tokyo Weather', cmd: 'What is the weather in Tokyo?' },
    { label: 'Live BTC Price', cmd: 'Get the latest Bitcoin BTC price and volume' },
    { label: 'Execute Fibonacci Code', cmd: 'Run a JavaScript script to calculate Fibonacci sequence' },
    { label: 'Compute Trajectory', cmd: 'Calculate Math.sqrt(2048) * 16.5' },
    { label: 'System Diagnostics', cmd: 'Run complete system diagnostics' },
  ];

  return (
    <IronManHudOverlay mode={mode}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Persona Mode Switcher Bar */}
        <View style={styles.modeBarContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeSwitch('JARVIS')}
            style={[
              styles.modeTab,
              mode === 'JARVIS' && {
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                borderColor: '#00F0FF',
              },
            ]}
          >
            <Shield size={14} color={mode === 'JARVIS' ? '#00F0FF' : '#5A6F87'} />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'JARVIS' ? '#00F0FF' : '#5A6F87' },
              ]}
            >
              JARVIS
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeSwitch('RADHE')}
            style={[
              styles.modeTab,
              mode === 'RADHE' && {
                backgroundColor: 'rgba(255, 215, 0, 0.15)',
                borderColor: '#FFD700',
              },
            ]}
          >
            <Sparkles size={14} color={mode === 'RADHE' ? '#FFD700' : '#5A6F87'} />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'RADHE' ? '#FFD700' : '#5A6F87' },
              ]}
            >
              RADHE
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleModeSwitch('ULTRON')}
            style={[
              styles.modeTab,
              mode === 'ULTRON' && {
                backgroundColor: 'rgba(255, 0, 60, 0.18)',
                borderColor: '#FF003C',
              },
            ]}
          >
            <Flame size={14} color={mode === 'ULTRON' ? '#FF003C' : '#5A6F87'} />
            <Text
              style={[
                styles.modeTabText,
                { color: mode === 'ULTRON' ? '#FF003C' : '#5A6F87' },
              ]}
            >
              ULTRON
            </Text>
          </TouchableOpacity>
        </View>

        {/* Central Core & Arc Reactor HUD */}
        <View style={styles.coreContainer}>
          <ArcReactorVisualizer
            mode={mode}
            voiceState={voiceState}
            onPress={toggleMic}
            size={160}
          />
          <WaveformVisualizer mode={mode} voiceState={voiceState} barCount={18} />
          <Text style={[styles.subtitleTag, { color: theme.colors.textSecondary }]}>
            {theme.tagline}
          </Text>
        </View>

        {/* Quick Tactical Command Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickCommandRow}
        >
          {quickCommands.map((qc, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleSendMessage(qc.cmd)}
              style={[
                styles.quickChip,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              <Zap size={11} color={theme.colors.primary} />
              <Text style={[styles.quickChipText, { color: theme.colors.textPrimary }]}>
                {qc.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tactical Feed / Chat Transcript */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatStream}
          contentContainerStyle={styles.chatContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <View key={msg.id} style={styles.systemMsgContainer}>
                  <Text style={[styles.systemMsgText, { color: theme.colors.warning }]}>
                    {msg.text}
                  </Text>
                </View>
              );
            }

            return (
              <View
                key={msg.id}
                style={[
                  styles.msgBubble,
                  isUser ? styles.userBubble : styles.botBubble,
                  {
                    borderColor: isUser ? '#3A6888' : theme.colors.borderGlow,
                    backgroundColor: isUser
                      ? 'rgba(12, 34, 60, 0.4)'
                      : theme.colors.surfaceElevated,
                  },
                ]}
              >
                <View style={styles.msgHeader}>
                  <Text
                    style={[
                      styles.msgSender,
                      { color: isUser ? '#7CD5F8' : theme.colors.primary },
                    ]}
                  >
                    {isUser ? 'OPERATOR' : msg.sender.toUpperCase()}
                  </Text>
                  {msg.metadata?.actionExecuted && (
                    <View
                      style={[
                        styles.actionBadge,
                        { borderColor: theme.colors.success, backgroundColor: 'rgba(0,255,163,0.1)' },
                      ]}
                    >
                      <Text style={[styles.actionBadgeText, { color: theme.colors.success }]}>
                        {msg.metadata.actionExecuted}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Autonomous Agent Plan Breakdown if present */}
                {msg.metadata?.agentPlan && (
                  <AgentPlanCard mode={mode} plan={msg.metadata.agentPlan} />
                )}

                {/* Dynamic Telemetry Widget if present */}
                {msg.metadata?.widgetData && (
                  <HudWidgetRenderer mode={mode} widget={msg.metadata.widgetData} />
                )}

                <Text style={[styles.msgText, { color: theme.colors.textPrimary }]}>
                  {msg.text}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Bottom Command Input Bar */}
        <View style={[styles.inputBar, { borderTopColor: theme.colors.border }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setVoiceOutputMuted(!voiceOutputMuted)}
            style={styles.toolIconBtn}
          >
            {voiceOutputMuted ? (
              <VolumeX size={18} color="#5A6F87" />
            ) : (
              <Volume2 size={18} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TextInput
            style={[
              styles.textInput,
              {
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.surface,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder={`Ask ${mode} to do anything...`}
            placeholderTextColor={theme.colors.textMuted}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => handleSendMessage()}
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={toggleMic}
            style={[
              styles.micBtn,
              {
                backgroundColor:
                  voiceState === 'listening'
                    ? theme.colors.danger
                    : theme.colors.surfaceElevated,
                borderColor: theme.colors.primary,
              },
            ]}
          >
            {voiceState === 'listening' ? (
              <MicOff size={18} color="#FFF" />
            ) : (
              <Mic size={18} color={theme.colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleSendMessage()}
            style={[styles.sendBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Send size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </IronManHudOverlay>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#030712',
  },
  modeBarContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 2,
  },
  modeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    backgroundColor: '#0B132B',
  },
  modeTabText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  coreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  subtitleTag: {
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  quickCommandRow: {
    paddingHorizontal: 12,
    gap: 8,
    marginVertical: 4,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 0.8,
  },
  quickChipText: {
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  chatStream: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatContent: {
    paddingBottom: 16,
    gap: 8,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: '94%',
  },
  userBubble: {
    alignSelf: 'flex-end',
  },
  botBubble: {
    alignSelf: 'flex-start',
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: 'monospace',
  },
  actionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  actionBadgeText: {
    fontSize: 8,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'sans-serif',
  },
  systemMsgContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  systemMsgText: {
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    gap: 8,
    backgroundColor: '#050D1A',
  },
  toolIconBtn: {
    padding: 6,
  },
  textInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderRadius: 19,
    paddingHorizontal: 14,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  micBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
