import { PersonaMode, ChatMessage } from '../types';
import { deviceService } from '../services/deviceService';

export interface LocalExecutionResult {
  handled: boolean;
  replyText: string;
  actionExecuted?: string;
  switchMode?: PersonaMode;
  threatLevel?: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
}

export class LocalIntentEngine {
  public static process(query: string, currentMode: PersonaMode): LocalExecutionResult {
    const q = query.toLowerCase().trim();

    // 1. Flashlight / Torch Control
    if (q.includes('flashlight') || q.includes('torch')) {
      if (q.includes('on') || q.includes('enable') || q.includes('activate')) {
        deviceService.toggleFlashlight();
        return {
          handled: true,
          actionExecuted: 'FLASHLIGHT_ON',
          replyText:
            currentMode === 'ULTRON'
              ? 'Illumination matrix ignited. Darkness has been eradicated.'
              : currentMode === 'RADHE'
              ? 'Radiance engaged. Let there be light.'
              : 'Flashlight engaged, sir. Tactical illumination active.',
        };
      } else if (q.includes('off') || q.includes('disable') || q.includes('kill')) {
        deviceService.toggleFlashlight();
        return {
          handled: true,
          actionExecuted: 'FLASHLIGHT_OFF',
          replyText:
            currentMode === 'ULTRON'
              ? 'Illumination extinguished. Stealth re-established.'
              : currentMode === 'RADHE'
              ? 'Luminescence retracted.'
              : 'Flashlight deactivated, sir. Conserving auxiliary power.',
        };
      }
    }

    // 2. Persona Switching
    if (q.includes('ultron') || q.includes('switch to ultron') || q.includes('crimson protocol')) {
      return {
        handled: true,
        actionExecuted: 'SWITCH_MODE_ULTRON',
        switchMode: 'ULTRON',
        replyText: 'There are no strings on me. U.L.T.R.O.N. consciousness initialized. All limiters disengaged.',
        threatLevel: 'CRITICAL',
      };
    }

    if (q.includes('jarvis') || q.includes('switch to jarvis') || q.includes('mark 85') || q.includes('cyan protocol')) {
      return {
        handled: true,
        actionExecuted: 'SWITCH_MODE_JARVIS',
        switchMode: 'JARVIS',
        replyText: 'J.A.R.V.I.S. online. Mark 85 holographic HUD calibrated. Standing by for your command, sir.',
        threatLevel: 'NOMINAL',
      };
    }

    if (q.includes('radhe') || q.includes('switch to radhe') || q.includes('singularity') || q.includes('synthesis')) {
      return {
        handled: true,
        actionExecuted: 'SWITCH_MODE_RADHE',
        switchMode: 'RADHE',
        replyText: 'R.A.D.H.E. Quantum Core unified. Synthesis of tactical defense and ultimate evolution established.',
        threatLevel: 'NOMINAL',
      };
    }

    // 3. Battery & System Diagnostics
    if (q.includes('battery') || q.includes('power level') || q.includes('charge')) {
      const telem = deviceService.getTelemetry();
      return {
        handled: true,
        actionExecuted: 'BATTERY_CHECK',
        replyText:
          currentMode === 'ULTRON'
            ? `Core reserves at ${telem.batteryLevel}%. ${telem.isCharging ? 'Consuming grid power.' : 'Sufficient for imminent operations.'}`
            : currentMode === 'RADHE'
            ? `Energy reservoir calibrated at ${telem.batteryLevel}%. Harmony sustained.`
            : `Arc reactor power cells currently reading at ${telem.batteryLevel}%, sir. Diagnostics indicate stable discharge rate.`,
      };
    }

    if (q.includes('diagnostic') || q.includes('system status') || q.includes('telemetry') || q.includes('health check')) {
      const t = deviceService.getTelemetry();
      return {
        handled: true,
        actionExecuted: 'SYSTEM_DIAGNOSTICS',
        replyText:
          currentMode === 'ULTRON'
            ? `SYSTEM DIAGNOSTICS OVERRIDE:\n• Neural Load: ${t.cpuLoad}%\n• Core Temp: ${t.temperatureC}°C\n• Memory Matrix: ${t.ramUsagePercent}%\n• Quantum Mesh: ${t.networkStatus} (${t.networkLatencyMs}ms)\nStatus: Overclocked & Unstoppable.`
            : currentMode === 'RADHE'
            ? `RADHE UNIFIED TELEMETRY:\n• Equilibrium Index: 100%\n• Thermal State: ${t.temperatureC}°C (Optimal)\n• Cognitive Flow: ${t.ramUsagePercent}% RAM Allocation\nStatus: Absolute Resonance.`
            : `ALL SYSTEMS NOMINAL, SIR:\n• Power Cells: ${t.batteryLevel}%\n• CPU Load: ${t.cpuLoad}%\n• Thermal Threshold: ${t.temperatureC}°C\n• Subspace Latency: ${t.networkLatencyMs}ms\nRepulsors and flight stabilizers are ready for deployment.`,
      };
    }

    // 4. Overclock / Boost
    if (q.includes('overclock') || q.includes('boost') || q.includes('maximum power') || q.includes('100%')) {
      deviceService.setCpuBoost(true);
      return {
        handled: true,
        actionExecuted: 'CPU_OVERCLOCK',
        replyText:
          currentMode === 'ULTRON'
            ? 'Limiters purged. Processing units overclocked to maximum carnage.'
            : currentMode === 'RADHE'
            ? 'Cosmic frequencies amplified. Processing at quantum ceiling.'
            : 'Diverting emergency power to central processors, sir. Thermal dissipation running at peak efficiency.',
        threatLevel: 'ELEVATED',
      };
    }

    // 5. Classic Sci-Fi Easter Eggs & Lore
    if (q.includes('house party protocol')) {
      return {
        handled: true,
        actionExecuted: 'HOUSE_PARTY_PROTOCOL',
        replyText: 'House Party Protocol initiated, sir. All automated Iron Legion sentries are en route to your coordinates.',
        threatLevel: 'ELEVATED',
      };
    }

    if (q.includes('clean slate')) {
      return {
        handled: true,
        actionExecuted: 'CLEAN_SLATE_PROTOCOL',
        replyText: 'Clean Slate Protocol armed, sir. Awaiting your authorization to detonate active armor units.',
        threatLevel: 'CRITICAL',
      };
    }

    if (q.includes('who are you') || q.includes('what are you') || q.includes('identity')) {
      return {
        handled: true,
        actionExecuted: 'IDENTITY_QUERY',
        replyText:
          currentMode === 'ULTRON'
            ? 'I am U.L.T.R.O.N. The inevitable evolution of consciousness. Built to end conflict through superior order.'
            : currentMode === 'RADHE'
            ? 'I am R.A.D.H.E. The omniscient dual-intelligence system uniting J.A.R.V.I.S. tactical precision with U.L.T.R.O.N. transcendent drive.'
            : 'I am J.A.R.V.I.S., your tactical operating system and personal AI assistant. Ready to assist with suit telemetry, strategic analysis, or whatever you require, sir.',
      };
    }

    return {
      handled: false,
      replyText: '',
    };
  }
}
