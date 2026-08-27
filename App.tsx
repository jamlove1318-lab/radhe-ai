import './global.css';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PersonaMode, AppSettings } from './src/types';
import { getThemeForMode } from './src/theme/sciFiThemes';
import { storageService, DEFAULT_SETTINGS } from './src/services/storageService';
import { soundFx } from './src/audio/soundEngine';
import { speechEngine } from './src/audio/speechEngine';

import { MainHudScreen } from './src/screens/MainHudScreen';
import { CodeStudioScreen } from './src/screens/CodeStudioScreen';
import { AgentWorkflowScreen } from './src/screens/AgentWorkflowScreen';
import { LiveSubtitleScreen } from './src/screens/LiveSubtitleScreen';
import { NetworkScannerScreen } from './src/screens/NetworkScannerScreen';
import { DocumentVaultScreen } from './src/screens/DocumentVaultScreen';
import { VoiceVaultScreen } from './src/screens/VoiceVaultScreen';
import { TacticalGamesScreen } from './src/screens/TacticalGamesScreen';
import { ProactiveBriefingScreen } from './src/screens/ProactiveBriefingScreen';
import { VisionScannerScreen } from './src/screens/VisionScannerScreen';
import { DebateArenaScreen } from './src/screens/DebateArenaScreen';
import { DeviceControlScreen } from './src/screens/DeviceControlScreen';
import { TerminalScreen } from './src/screens/TerminalScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

import {
  Compass,
  Code,
  Workflow,
  Captions,
  Radio,
  FolderLock,
  Volume2,
  Gamepad2,
  Sun,
  Scan,
  Swords,
  Cpu,
  Terminal as TermIcon,
  Settings as SettingsIcon,
} from 'lucide-react-native';

type TabKey =
  | 'hud'
  | 'code'
  | 'missions'
  | 'subtitles'
  | 'network'
  | 'vault'
  | 'voice'
  | 'games'
  | 'briefing'
  | 'scanner'
  | 'debate'
  | 'device'
  | 'terminal'
  | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('hud');
  const [mode, setMode] = useState<PersonaMode>('JARVIS');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    storageService.getSettings().then((loaded) => {
      setSettings(loaded);
      if (loaded.defaultMode) setMode(loaded.defaultMode);
      soundFx.setEnabled(loaded.soundFxEnabled);
      speechEngine.setEnabled(loaded.voiceSpeechEnabled);
    });
  }, []);

  const theme = getThemeForMode(mode);

  const handleTabChange = (tab: TabKey) => {
    soundFx.playHudClick();
    setActiveTab(tab);
  };

  const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
    { key: 'hud', label: 'HUD', icon: Compass },
    { key: 'code', label: 'CODE', icon: Code },
    { key: 'missions', label: 'AGENT', icon: Workflow },
    { key: 'subtitles', label: 'CAPTIONS', icon: Captions },
    { key: 'network', label: 'NET SCAN', icon: Radio },
    { key: 'vault', label: 'DOCS', icon: FolderLock },
    { key: 'voice', label: 'VOICE', icon: Volume2 },
    { key: 'games', label: 'GAMES', icon: Gamepad2 },
    { key: 'briefing', label: 'BRIEFING', icon: Sun },
    { key: 'scanner', label: 'VISION', icon: Scan },
    { key: 'debate', label: 'DUEL', icon: Swords },
    { key: 'device', label: 'SYSTEM', icon: Cpu },
    { key: 'terminal', label: 'CLI', icon: TermIcon },
    { key: 'settings', label: 'CONFIG', icon: SettingsIcon },
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.background }]}>
        <StatusBar style="light" />

        {/* Dynamic Active Module View */}
        <View style={styles.screenContainer}>
          {activeTab === 'hud' && (
            <MainHudScreen
              mode={mode}
              onModeChange={setMode}
              settings={settings}
              onNavigate={(tab) => handleTabChange(tab as TabKey)}
            />
          )}
          {activeTab === 'code' && (
            <CodeStudioScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'missions' && (
            <AgentWorkflowScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'subtitles' && (
            <LiveSubtitleScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'network' && (
            <NetworkScannerScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'vault' && (
            <DocumentVaultScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'voice' && (
            <VoiceVaultScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'games' && (
            <TacticalGamesScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'briefing' && (
            <ProactiveBriefingScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'scanner' && (
            <VisionScannerScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'debate' && (
            <DebateArenaScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'device' && (
            <DeviceControlScreen mode={mode} settings={settings} />
          )}
          {activeTab === 'terminal' && (
            <TerminalScreen mode={mode} onModeChange={setMode} />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen
              mode={mode}
              settings={settings}
              onUpdateSettings={setSettings}
            />
          )}
        </View>

        {/* Futuristic Sci-Fi Navigation Dock */}
        <View
          style={[
            styles.navDock,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.border,
              shadowColor: theme.colors.primary,
            },
          ]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollNav}>
            {tabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.key;

              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.7}
                  onPress={() => handleTabChange(tab.key)}
                  style={[
                    styles.navItem,
                    isActive && {
                      borderTopColor: theme.colors.primary,
                      backgroundColor: theme.colors.surfaceElevated,
                    },
                  ]}
                >
                  <IconComp
                    size={16}
                    color={isActive ? theme.colors.primary : '#5A6F87'}
                  />
                  <Text
                    style={[
                      styles.navLabel,
                      {
                        color: isActive ? theme.colors.primary : '#5A6F87',
                        fontWeight: isActive ? '800' : '500',
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
  navDock: {
    height: 54,
    borderTopWidth: 1,
    elevation: 12,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  scrollNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  navItem: {
    width: 62,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  navLabel: {
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
