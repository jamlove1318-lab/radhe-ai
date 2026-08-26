import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { PersonaMode, DeviceTelemetry, QuickReminder, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { deviceService } from '../services/deviceService';
import { storageService } from '../services/storageService';
import { soundFx } from '../audio/soundEngine';
import {
  Battery,
  BatteryCharging,
  Cpu,
  Radio,
  Thermometer,
  Flashlight,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Zap,
  Activity,
  Server,
} from 'lucide-react-native';

interface DeviceControlProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const DeviceControlScreen: React.FC<DeviceControlProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(deviceService.getTelemetry());
  const [reminders, setReminders] = useState<QuickReminder[]>([]);
  const [newReminderText, setNewReminderText] = useState('');

  useEffect(() => {
    const unsub = deviceService.subscribe((t) => setTelemetry(t));
    storageService.getReminders().then(setReminders);
    return () => unsub();
  }, []);

  const handleToggleFlashlight = () => {
    soundFx.playHudClick();
    deviceService.toggleFlashlight();
  };

  const handleToggleOverclock = () => {
    soundFx.playAlert();
    deviceService.setCpuBoost(telemetry.cpuLoad < 50);
  };

  const handleAddReminder = async () => {
    if (!newReminderText.trim()) return;
    soundFx.playHudClick();

    const newRem: QuickReminder = {
      id: `rem-${Date.now()}`,
      title: newReminderText.trim(),
      timeStr: 'Scheduled Alert',
      completed: false,
      priority: mode === 'ULTRON' ? 'DEFCON-1' : 'TACTICAL',
      createdAt: Date.now(),
    };

    const updated = [newRem, ...reminders];
    setReminders(updated);
    setNewReminderText('');
    await storageService.saveReminders(updated);
  };

  const handleToggleReminder = async (id: string) => {
    soundFx.playHudClick();
    const updated = reminders.map((r) =>
      r.id === id ? { ...r, completed: !r.completed } : r
    );
    setReminders(updated);
    await storageService.saveReminders(updated);
  };

  const handleDeleteReminder = async (id: string) => {
    soundFx.playHudClick();
    const updated = reminders.filter((r) => r.id !== id);
    setReminders(updated);
    await storageService.saveReminders(updated);
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* System Telemetry Grid */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          HARDWARE & SUIT TELEMETRY:
        </Text>

        <View style={styles.telemetryGrid}>
          {/* Battery Status Tile */}
          <View style={[styles.telemetryTile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.tileHeader}>
              {telemetry.isCharging ? (
                <BatteryCharging size={18} color={theme.colors.success} />
              ) : (
                <Battery size={18} color={theme.colors.primary} />
              )}
              <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>POWER RESERVES</Text>
            </View>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {telemetry.batteryLevel}%
            </Text>
            <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
              {telemetry.isCharging ? 'ARC CHARGING ACTIVE' : 'DISCHARGE NOMINAL'}
            </Text>
          </View>

          {/* Network / Subspace Tile */}
          <View style={[styles.telemetryTile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.tileHeader}>
              <Radio size={18} color={theme.colors.primary} />
              <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>QUANTUM LINK</Text>
            </View>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {telemetry.networkLatencyMs}ms
            </Text>
            <Text style={[styles.tileSub, { color: theme.colors.success }]}>
              {telemetry.networkStatus}
            </Text>
          </View>

          {/* CPU / Neural Matrix Tile */}
          <View style={[styles.telemetryTile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.tileHeader}>
              <Cpu size={18} color={theme.colors.primary} />
              <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>NEURAL LOAD</Text>
            </View>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {telemetry.cpuLoad}%
            </Text>
            <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
              CORES: 16 THREADS ACTIVE
            </Text>
          </View>

          {/* Core Temperature Tile */}
          <View style={[styles.telemetryTile, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
            <View style={styles.tileHeader}>
              <Thermometer size={18} color={theme.colors.primary} />
              <Text style={[styles.tileLabel, { color: theme.colors.textSecondary }]}>CORE TEMP</Text>
            </View>
            <Text style={[styles.tileValue, { color: theme.colors.textPrimary }]}>
              {telemetry.temperatureC}°C
            </Text>
            <Text style={[styles.tileSub, { color: theme.colors.textMuted }]}>
              THERMAL THRESHOLD: SAFE
            </Text>
          </View>
        </View>

        {/* Quick Hardware Toggles */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          HARDWARE CONTROLS:
        </Text>
        <View style={styles.controlsRow}>
          <HolographicButton
            title={telemetry.flashlightOn ? 'Flashlight: ON' : 'Flashlight: OFF'}
            mode={mode}
            variant={telemetry.flashlightOn ? 'primary' : 'secondary'}
            icon={<Flashlight size={16} color={telemetry.flashlightOn ? theme.colors.accent : '#FFF'} />}
            onPress={handleToggleFlashlight}
            style={{ flex: 1 }}
          />
          <HolographicButton
            title={telemetry.cpuLoad > 50 ? 'Overclocked' : 'Overclock Core'}
            mode={mode}
            variant={telemetry.cpuLoad > 50 ? 'danger' : 'secondary'}
            icon={<Zap size={16} color="#FFF" />}
            onPress={handleToggleOverclock}
            style={{ flex: 1 }}
          />
        </View>

        {/* Tactical Reminders & Directives */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            DIRECTIVES & TACTICAL REMINDERS:
          </Text>
          <Text style={[styles.counterText, { color: theme.colors.primary }]}>
            ({reminders.filter((r) => !r.completed).length} PENDING)
          </Text>
        </View>

        {/* Add Reminder Input */}
        <View style={[styles.addReminderBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <TextInput
            style={[styles.reminderInput, { color: theme.colors.textPrimary }]}
            placeholder="Add new directive / protocol..."
            placeholderTextColor={theme.colors.textMuted}
            value={newReminderText}
            onChangeText={setNewReminderText}
            onSubmitEditing={handleAddReminder}
          />
          <TouchableOpacity
            onPress={handleAddReminder}
            style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
          >
            <Plus size={16} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Reminder List */}
        <View style={styles.remindersList}>
          {reminders.map((rem) => (
            <View
              key={rem.id}
              style={[
                styles.reminderItem,
                {
                  borderColor: rem.completed ? '#1E293B' : theme.colors.border,
                  backgroundColor: rem.completed
                    ? 'rgba(10, 15, 26, 0.4)'
                    : theme.colors.surfaceElevated,
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => handleToggleReminder(rem.id)}
                style={styles.checkboxTouch}
              >
                {rem.completed ? (
                  <CheckSquare size={18} color={theme.colors.success} />
                ) : (
                  <Square size={18} color={theme.colors.primary} />
                )}
              </TouchableOpacity>

              <View style={styles.reminderDetails}>
                <Text
                  style={[
                    styles.reminderTitle,
                    {
                      color: rem.completed ? theme.colors.textMuted : theme.colors.textPrimary,
                      textDecorationLine: rem.completed ? 'line-through' : 'none',
                    },
                  ]}
                >
                  {rem.title}
                </Text>
                <Text style={[styles.reminderTime, { color: theme.colors.textSecondary }]}>
                  {rem.timeStr} // [{rem.priority}]
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleDeleteReminder(rem.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={15} color="#5A6F87" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </IronManHudOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  content: {
    padding: 12,
    gap: 12,
    paddingBottom: 28,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  counterText: {
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  telemetryTile: {
    width: '48.5%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tileLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  tileSub: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addReminderBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reminderInput: {
    flex: 1,
    height: 38,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  addBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  remindersList: {
    gap: 6,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  checkboxTouch: {
    padding: 2,
  },
  reminderDetails: {
    flex: 1,
    gap: 2,
  },
  reminderTitle: {
    fontSize: 12,
    fontFamily: 'sans-serif',
    fontWeight: '600',
  },
  reminderTime: {
    fontSize: 9,
    fontFamily: 'monospace',
  },
  deleteBtn: {
    padding: 4,
  },
});
