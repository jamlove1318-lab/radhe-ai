import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, ChatMessage, DebateSession, QuickReminder, VisionScanResult } from '../types';

const SETTINGS_KEY = '@radhe_settings_v1';
const CHAT_KEY = '@radhe_chat_history_v1';
const REMINDERS_KEY = '@radhe_reminders_v1';
const DEBATES_KEY = '@radhe_debates_v1';
const SCANS_KEY = '@radhe_scans_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  geminiApiKey: '',
  customModel: 'gemini-2.5-flash',
  soundFxEnabled: true,
  voiceSpeechEnabled: true,
  speechRate: 1.0,
  speechPitch: 1.0,
  wakeWordEnabled: true,
  defaultMode: 'JARVIS',
  hapticFeedback: true,
  autonomousMultiStepEnabled: true,
};

class StorageService {
  public async getSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public async getChatHistory(): Promise<ChatMessage[]> {
    try {
      const data = await AsyncStorage.getItem(CHAT_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }

  public async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      // Keep last 100 messages
      const trimmed = messages.slice(-100);
      await AsyncStorage.setItem(CHAT_KEY, JSON.stringify(trimmed));
    } catch (e) {}
  }

  public async getReminders(): Promise<QuickReminder[]> {
    try {
      const data = await AsyncStorage.getItem(REMINDERS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'rem-1',
        title: 'Calibrate Arc Reactor & Repulsor Emitters',
        timeStr: 'Today at 18:00',
        completed: false,
        priority: 'TACTICAL',
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'rem-2',
        title: 'Global Satellite Telemetry Integrity Scan',
        timeStr: 'Tomorrow at 09:00',
        completed: true,
        priority: 'DEFCON-1',
        createdAt: Date.now() - 7200000,
      },
    ];
  }

  public async saveReminders(reminders: QuickReminder[]): Promise<void> {
    try {
      await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    } catch (e) {}
  }

  public async getDebates(): Promise<DebateSession[]> {
    try {
      const data = await AsyncStorage.getItem(DEBATES_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }

  public async saveDebate(session: DebateSession): Promise<void> {
    try {
      const existing = await this.getDebates();
      const filtered = existing.filter((d) => d.id !== session.id);
      await AsyncStorage.setItem(DEBATES_KEY, JSON.stringify([session, ...filtered].slice(0, 30)));
    } catch (e) {}
  }

  public async getRecentScans(): Promise<VisionScanResult[]> {
    try {
      const data = await AsyncStorage.getItem(SCANS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [];
  }

  public async saveScan(scan: VisionScanResult): Promise<void> {
    try {
      const existing = await this.getRecentScans();
      await AsyncStorage.setItem(SCANS_KEY, JSON.stringify([scan, ...existing].slice(0, 20)));
    } catch (e) {}
  }
}

export const storageService = new StorageService();
