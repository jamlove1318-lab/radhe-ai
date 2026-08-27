export interface MotionOrientation {
  alpha: number; // Compass direction (0-360)
  beta: number;  // Front-to-back tilt (-180 to 180)
  gamma: number; // Left-to-right tilt (-90 to 90)
  isSupported: boolean;
  isActive: boolean;
}

export class MotionService {
  private static orientation: MotionOrientation = {
    alpha: 0,
    beta: 0,
    gamma: 0,
    isSupported: false,
    isActive: false,
  };

  private static listeners: Array<(o: MotionOrientation) => void> = [];
  private static isInitialized = false;

  public static init() {
    if (this.isInitialized) return;
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      this.orientation.isSupported = true;
      try {
        window.addEventListener('deviceorientation', (event: DeviceOrientationEvent) => {
          this.orientation.alpha = Math.round(event.alpha || 0);
          this.orientation.beta = Math.round(event.beta || 0);
          this.orientation.gamma = Math.round(event.gamma || 0);
          this.orientation.isActive = true;
          this.notify();
        });
      } catch (e) {
        console.warn('Device orientation error:', e);
      }
    }
    this.isInitialized = true;
  }

  public static subscribe(cb: (o: MotionOrientation) => void) {
    this.init();
    this.listeners.push(cb);
    cb({ ...this.orientation });
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private static notify() {
    this.listeners.forEach((cb) => cb({ ...this.orientation }));
  }

  public static getOrientation(): MotionOrientation {
    return { ...this.orientation };
  }
}
