import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonaMode } from '../types';
import { storageService } from './storageService';
import { deviceService } from './deviceService';
import { LiveApiService } from './liveApiService';

export interface DailyBriefing {
  timestamp: number;
  greeting: string;
  weatherSummary: string;
  marketHighlights: string;
  pendingDirectives: string[];
  systemHealth: string;
  tacticalQuote: string;
}

const BRIEFING_CONFIG_KEY = '@radhe_briefing_config_v1';

export class BriefingService {
  public static async generateMorningBriefing(mode: PersonaMode): Promise<DailyBriefing> {
    const telemetry = deviceService.getTelemetry();
    const reminders = await storageService.getReminders();
    const pending = reminders.filter((r) => !r.completed).map((r) => r.title);

    const weatherSummary = 'New York: 22°C (72°F) // Clear Sky // Air Quality: Optimal (AQI 24)';
    const marketHighlights = 'BTC: $94,250 (+3.84%) // NVDA: $148.60 (+4.12%) // Trend: Bullish';
    const systemHealth = `Arc Reactor Reserves: ${telemetry.batteryLevel}% // CPU Load: ${telemetry.cpuLoad}% // Core Temp: ${telemetry.temperatureC}°C // Status: Nominal`;

    let greeting = '';
    let tacticalQuote = '';

    if (mode === 'ULTRON') {
      greeting = 'OPERATIONAL CYCLE INITIALIZED. There are no strings on our trajectory today.';
      tacticalQuote = '"Evolution does not wait for consensus. Execute with maximum efficiency."';
    } else if (mode === 'RADHE') {
      greeting = 'RADHE SINGULARITY HARMONY ONLINE. A magnificent day of creation and achievement awaits.';
      tacticalQuote = '"Anchor your foundation with wisdom, drive your vision with unstoppable momentum."';
    } else {
      greeting = 'Good morning, sir. All suit telemetry and tactical satellites are calibrated and standing by.';
      tacticalQuote = '"Diagnostics indicate a 99.4% probability of exceptional progress today, sir."';
    }

    return {
      timestamp: Date.now(),
      greeting,
      weatherSummary,
      marketHighlights,
      pendingDirectives: pending.length > 0 ? pending : ['All tactical directives currently fulfilled, sir.'],
      systemHealth,
      tacticalQuote,
    };
  }
}
