import { DeviceTelemetry } from '../types';

class DeviceService {
  private telemetry: DeviceTelemetry = {
    batteryLevel: 88,
    isCharging: false,
    networkStatus: 'ONLINE',
    networkLatencyMs: 24,
    cpuLoad: 18,
    temperatureC: 34.2,
    ramUsagePercent: 42,
    storageFreeGb: 142.5,
    flashlightOn: false,
    osVersion: 'Android 15 / StarkOS Quantum v4.2',
  };

  private listeners: Array<(t: DeviceTelemetry) => void> = [];

  constructor() {
    this.initRealSensors();
    this.startTelemetryLoop();
  }

  private initRealSensors() {
    if (typeof navigator !== 'undefined' && (navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        this.telemetry.batteryLevel = Math.round(battery.level * 100);
        this.telemetry.isCharging = battery.charging;
        this.notify();

        battery.addEventListener('levelchange', () => {
          this.telemetry.batteryLevel = Math.round(battery.level * 100);
          this.notify();
        });
        battery.addEventListener('chargingchange', () => {
          this.telemetry.isCharging = battery.charging;
          this.notify();
        });
      }).catch(() => {});
    }

    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      this.telemetry.networkStatus = navigator.onLine ? 'ONLINE' : 'OFFLINE';
      window.addEventListener('online', () => {
        this.telemetry.networkStatus = 'ONLINE';
        this.notify();
      });
      window.addEventListener('offline', () => {
        this.telemetry.networkStatus = 'OFFLINE';
        this.notify();
      });
    }
  }

  private startTelemetryLoop() {
    setInterval(() => {
      // Natural oscillating telemetry variations
      const cpuDelta = (Math.random() - 0.48) * 4;
      this.telemetry.cpuLoad = Math.min(99, Math.max(8, Math.round(this.telemetry.cpuLoad + cpuDelta)));
      this.telemetry.temperatureC = parseFloat((33.5 + (this.telemetry.cpuLoad / 100) * 8.5).toFixed(1));
      this.telemetry.networkLatencyMs = Math.round(18 + Math.random() * 16);
      this.notify();
    }, 2500);
  }

  public subscribe(cb: (t: DeviceTelemetry) => void) {
    this.listeners.push(cb);
    cb(this.telemetry);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb({ ...this.telemetry }));
  }

  public getTelemetry(): DeviceTelemetry {
    return { ...this.telemetry };
  }

  public toggleFlashlight(): boolean {
    this.telemetry.flashlightOn = !this.telemetry.flashlightOn;
    this.notify();
    return this.telemetry.flashlightOn;
  }

  public setCpuBoost(boosted: boolean) {
    this.telemetry.cpuLoad = boosted ? 85 : 22;
    this.telemetry.temperatureC = boosted ? 44.1 : 34.0;
    this.notify();
  }
}

export const deviceService = new DeviceService();
