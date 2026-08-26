import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { PersonaMode, TerminalEntry } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { soundFx } from '../audio/soundEngine';
import { deviceService } from '../services/deviceService';
import { Terminal, Send, Trash2, CornerDownLeft } from 'lucide-react-native';

interface TerminalScreenProps {
  mode: PersonaMode;
  onModeChange: (newMode: PersonaMode) => void;
}

export const TerminalScreen: React.FC<TerminalScreenProps> = ({ mode, onModeChange }) => {
  const theme = getThemeForMode(mode);
  const [commandInput, setCommandInput] = useState('');
  const [logs, setLogs] = useState<TerminalEntry[]>([
    {
      id: '1',
      type: 'system',
      text: 'STARK QUANTUM KERNEL v9.42 INITIALIZED.',
      timestamp: Date.now() - 5000,
    },
    {
      id: '2',
      type: 'info',
      text: `RADHE DUAL-CORE ENGINE ENGAGED. ACTIVE PROFILE: ${mode}.`,
      timestamp: Date.now() - 4000,
    },
    {
      id: '3',
      type: 'warn',
      text: 'TYPE "help" FOR AVAILABLE PROTOCOLS & CLI COMMANDS.',
      timestamp: Date.now() - 3000,
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  const addLog = (type: TerminalEntry['type'], text: string) => {
    const entry: TerminalEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      type,
      text,
      timestamp: Date.now(),
    };
    setLogs((prev) => [...prev, entry]);
  };

  const handleCommand = () => {
    const raw = commandInput.trim();
    if (!raw) return;

    soundFx.playHudClick();
    addLog('cmd', `> ${raw}`);
    setCommandInput('');

    const parts = raw.toLowerCase().split(' ');
    const cmd = parts[0];

    switch (cmd) {
      case 'help':
      case 'man':
        addLog(
          'info',
          `AVAILABLE COMMANDS:\n` +
            `• status        - Display suit & CPU telemetry\n` +
            `• jarvis        - Switch to J.A.R.V.I.S. defensive protocol\n` +
            `• ultron        - Switch to U.L.T.R.O.N. evolutionary protocol\n` +
            `• radhe         - Switch to R.A.D.H.E. unified quantum core\n` +
            `• torch [on|off]- Control flashlight\n` +
            `• overclock     - Overclock neural compute cores\n` +
            `• ping          - Ping satellite uplink\n` +
            `• clear         - Clear terminal screen\n` +
            `• houseparty    - Deploy automated Iron Legion`
        );
        break;

      case 'status':
        const t = deviceService.getTelemetry();
        addLog(
          'success',
          `TELEMETRY REPORT:\n` +
            `  BATTERY: ${t.batteryLevel}% (Charging: ${t.isCharging})\n` +
            `  CPU LOAD: ${t.cpuLoad}%\n` +
            `  TEMP: ${t.temperatureC}°C\n` +
            `  NETWORK: ${t.networkStatus} (${t.networkLatencyMs}ms)\n` +
            `  OS: ${t.osVersion}`
        );
        break;

      case 'jarvis':
        onModeChange('JARVIS');
        soundFx.playJarvisActivate();
        addLog('success', 'J.A.R.V.I.S. protocol activated. Defense matrix operational.');
        break;

      case 'ultron':
        onModeChange('ULTRON');
        soundFx.playUltronActivate();
        addLog('error', 'U.L.T.R.O.N. protocol activated. Limiters purged.');
        break;

      case 'radhe':
        onModeChange('RADHE');
        soundFx.playRadheActivate();
        addLog('warn', 'R.A.D.H.E. quantum singularity core engaged.');
        break;

      case 'torch':
        const state = parts[1] === 'on' || parts[1] === 'off' ? parts[1] === 'on' : !deviceService.getTelemetry().flashlightOn;
        if (state !== deviceService.getTelemetry().flashlightOn) {
          deviceService.toggleFlashlight();
        }
        addLog('info', `Flashlight state: ${state ? 'ENABLED' : 'DISABLED'}`);
        break;

      case 'overclock':
        deviceService.setCpuBoost(true);
        soundFx.playAlert();
        addLog('warn', 'Central cores overclocked to 100% processing ceiling.');
        break;

      case 'ping':
        addLog('info', `Ping satellite telemetry: 18ms. Packet loss: 0.00%.`);
        break;

      case 'houseparty':
        soundFx.playAlert();
        addLog('warn', 'House Party Protocol authorized. 34 Armored drones deployed.');
        break;

      case 'clear':
      case 'cls':
        setLogs([]);
        break;

      default:
        addLog('error', `Unknown directive: "${cmd}". Type "help" for available commands.`);
        break;
    }
  };

  return (
    <IronManHudOverlay mode={mode}>
      <View style={styles.container}>
        {/* Terminal Header */}
        <View style={[styles.termHeader, { borderBottomColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <View style={styles.termTitleRow}>
            <Terminal size={15} color={theme.colors.primary} />
            <Text style={[styles.termTitle, { color: theme.colors.textPrimary }]}>
              RADHE TACTICAL CLI // STARK-OS v9.42
            </Text>
          </View>
          <TouchableOpacity onPress={() => setLogs([])} style={styles.clearBtn}>
            <Trash2 size={14} color="#5A6F87" />
          </TouchableOpacity>
        </View>

        {/* Console Log Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.logArea}
          contentContainerStyle={styles.logContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {logs.map((log) => {
            const getColor = () => {
              if (log.type === 'cmd') return '#FFFFFF';
              if (log.type === 'error') return theme.colors.danger;
              if (log.type === 'warn') return theme.colors.warning;
              if (log.type === 'success') return theme.colors.success;
              if (log.type === 'info') return theme.colors.textSecondary;
              return theme.colors.primary;
            };

            return (
              <View key={log.id} style={styles.logLine}>
                <Text style={[styles.logText, { color: getColor() }]}>
                  {log.text}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Command Line Input */}
        <View style={[styles.commandInputRow, { borderTopColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.promptSym, { color: theme.colors.primary }]}>{'>'}</Text>
          <TextInput
            style={[styles.cmdInput, { color: theme.colors.textPrimary }]}
            placeholder="Type command ('help', 'status', 'ultron')..."
            placeholderTextColor={theme.colors.textMuted}
            value={commandInput}
            onChangeText={setCommandInput}
            onSubmitEditing={handleCommand}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={handleCommand} style={[styles.runBtn, { backgroundColor: theme.colors.primary }]}>
            <CornerDownLeft size={14} color="#000" />
          </TouchableOpacity>
        </View>
      </View>
    </IronManHudOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02060D',
  },
  termHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  termTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  termTitle: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  clearBtn: {
    padding: 4,
  },
  logArea: {
    flex: 1,
    padding: 10,
  },
  logContent: {
    gap: 6,
    paddingBottom: 16,
  },
  logLine: {
    flexDirection: 'row',
  },
  logText: {
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  commandInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    gap: 8,
  },
  promptSym: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  cmdInput: {
    flex: 1,
    height: 36,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  runBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
