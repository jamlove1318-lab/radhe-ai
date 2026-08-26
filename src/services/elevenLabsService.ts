import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonaMode } from '../types';

export interface VoiceMemo {
  id: string;
  title: string;
  transcript: string;
  summary: string;
  durationSec: number;
  timestamp: number;
}

const MEMOS_KEY = '@radhe_voice_memos_v1';
const ELEVEN_KEY = '@radhe_elevenlabs_key_v1';

export class ElevenLabsService {
  public static async getApiKey(): Promise<string> {
    try {
      return (await AsyncStorage.getItem(ELEVEN_KEY)) || '';
    } catch (e) {
      return '';
    }
  }

  public static async saveApiKey(key: string): Promise<void> {
    await AsyncStorage.setItem(ELEVEN_KEY, key.trim());
  }

  public static async getVoiceMemos(): Promise<VoiceMemo[]> {
    try {
      const data = await AsyncStorage.getItem(MEMOS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'memo-1',
        title: 'Tactical Briefing on Mk 85 Power Grid',
        transcript: 'Jarvis, verify repulsor stabilization and prepare sub-orbital thermal test at 06:00 tomorrow.',
        summary: 'Scheduled Mk 85 sub-orbital thermal flight test and repulsor calibration for 06:00.',
        durationSec: 14,
        timestamp: Date.now() - 7200000,
      }
    ];
  }

  public static async saveVoiceMemo(memo: VoiceMemo): Promise<void> {
    const existing = await this.getVoiceMemos();
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify([memo, ...existing].slice(0, 30)));
  }

  public static async deleteVoiceMemo(id: string): Promise<void> {
    const existing = await this.getVoiceMemos();
    await AsyncStorage.setItem(MEMOS_KEY, JSON.stringify(existing.filter((m) => m.id !== id)));
  }

  public static async synthesizeVoiceElevenLabs(
    text: string,
    mode: PersonaMode,
    apiKey: string
  ): Promise<boolean> {
    if (!apiKey || apiKey.trim().length < 8) return false;

    // Standard ElevenLabs Voice IDs for British refined vs Deep commanding
    const voiceId = mode === 'ULTRON' 
      ? 'ErXwobaYiN019PkySvjV' // Deep commanding male
      : 'pNInz6obpgDQGcFmaJgB'; // Adam / British refined

    try {
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey.trim(),
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: mode === 'ULTRON' ? 0.75 : 0.5,
            similarity_boost: 0.85,
          },
        }),
      });
      return res.ok;
    } catch (e) {
      console.warn('ElevenLabs speech generation error:', e);
      return false;
    }
  }
}
