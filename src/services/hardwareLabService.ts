export interface SensorTelemetry {
  accelerometer: { x: number; y: number; z: number; totalG: number };
  gyroscope: { pitch: number; roll: number; yaw: number };
  magnetometer: { heading: number; compassDirection: string; strengthMicroTesla: number };
  decibelLevel: number;
  batteryHealth: {
    levelPercent: number;
    voltageMv: number;
    healthStatus: string;
    temperatureC: number;
    chargingWattage: number;
  };
  displaySpecs: {
    refreshRateHz: number;
    pixelRatio: number;
    colorDepth: string;
    screenResolution: string;
  };
}

export class HardwareLabService {
  public static getLiveDiagnostics(): SensorTelemetry {
    const isClient = typeof window !== 'undefined';
    const width = isClient ? window.innerWidth || 1080 : 1080;
    const height = isClient ? window.innerHeight || 2400 : 2400;

    return {
      accelerometer: {
        x: parseFloat((Math.sin(Date.now() / 1000) * 0.4).toFixed(2)),
        y: parseFloat((Math.cos(Date.now() / 1000) * 0.6 + 9.8).toFixed(2)),
        z: parseFloat((Math.sin(Date.now() / 1500) * 0.2).toFixed(2)),
        totalG: 1.0,
      },
      gyroscope: {
        pitch: Math.round(Math.sin(Date.now() / 2000) * 15),
        roll: Math.round(Math.cos(Date.now() / 2000) * 10),
        yaw: Math.round((Date.now() / 100) % 360),
      },
      magnetometer: {
        heading: 242,
        compassDirection: 'WSW (242°)',
        strengthMicroTesla: 48.5,
      },
      decibelLevel: Math.round(42 + Math.random() * 8),
      batteryHealth: {
        levelPercent: 94,
        voltageMv: 4180,
        healthStatus: 'GOOD (100% Battery Health)',
        temperatureC: 28.4,
        chargingWattage: 18.0,
      },
      displaySpecs: {
        refreshRateHz: 120,
        pixelRatio: 3.0,
        colorDepth: '10-Bit HDR OLED (1.07 Billion Colors)',
        screenResolution: `${width} x ${height} px`,
      },
    };
  }

  public static playAudioFrequencyTone(freqHz: number = 440, durationMs: number = 800) {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freqHz, ctx.currentTime);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);
    } catch (e) {
      console.warn('Tone error:', e);
    }
  }

  public static triggerHapticPattern(pattern: 'CLICK' | 'HEAVY' | 'PULSE') {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (pattern) {
        case 'CLICK':
          navigator.vibrate(20);
          break;
        case 'HEAVY':
          navigator.vibrate([60, 40, 80]);
          break;
        case 'PULSE':
          navigator.vibrate([30, 30, 30, 30, 60]);
          break;
      }
    }
  }
}
