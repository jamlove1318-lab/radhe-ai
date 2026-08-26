import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { PersonaMode, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { soundFx } from '../audio/soundEngine';
import {
  Gamepad2,
  Crosshair,
  ShieldAlert,
  Trophy,
  Zap,
  Target,
  Flame,
  CheckCircle,
} from 'lucide-react-native';

interface TacticalGamesProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const TacticalGamesScreen: React.FC<TacticalGamesProps> = ({ mode }) => {
  const theme = getThemeForMode(mode);
  const [activeGame, setActiveGame] = useState<'REFLEX' | 'FIREWALL'>('REFLEX');

  // Reflex Game State
  const [isPlayingReflex, setIsPlayingReflex] = useState(false);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [score, setScore] = useState(0);
  const [targetSpawnTime, setTargetSpawnTime] = useState<number>(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (isPlayingReflex && !gameOver) {
      if (score >= 10) {
        setGameOver(true);
        setIsPlayingReflex(false);
        soundFx.playTargetLock();
      } else {
        spawnTarget();
      }
    }
    return () => clearTimeout(timer);
  }, [isPlayingReflex, score]);

  const startReflexGame = () => {
    setScore(0);
    setReactionTimes([]);
    setGameOver(false);
    setIsPlayingReflex(true);
    soundFx.playAlert();
  };

  const spawnTarget = () => {
    const x = Math.floor(15 + Math.random() * 70);
    const y = Math.floor(15 + Math.random() * 65);
    setTargetPos({ x, y });
    setTargetSpawnTime(Date.now());
  };

  const handleHitTarget = () => {
    const reaction = Date.now() - targetSpawnTime;
    soundFx.playScanBlip();
    setReactionTimes((prev) => [...prev, reaction]);
    setScore((s) => s + 1);
  };

  const avgReactionMs =
    reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Gamepad2 size={20} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              STARK COMBAT & REFLEX SIMULATOR
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Tactical Target Acquisition & Neural Reaction Time Training
          </Text>
        </View>

        {/* Game Mode Switcher */}
        <View style={styles.switchRow}>
          <TouchableOpacity
            onPress={() => {
              soundFx.playHudClick();
              setActiveGame('REFLEX');
            }}
            style={[
              styles.switchBtn,
              {
                borderColor: activeGame === 'REFLEX' ? theme.colors.primary : theme.colors.border,
                backgroundColor: activeGame === 'REFLEX' ? 'rgba(0, 240, 255, 0.15)' : theme.colors.surface,
              },
            ]}
          >
            <Crosshair size={14} color={activeGame === 'REFLEX' ? theme.colors.primary : '#5A6F87'} />
            <Text style={[styles.switchText, { color: activeGame === 'REFLEX' ? theme.colors.primary : '#5A6F87' }]}>
              TARGET REFLEX TRAINER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              soundFx.playHudClick();
              setActiveGame('FIREWALL');
            }}
            style={[
              styles.switchBtn,
              {
                borderColor: activeGame === 'FIREWALL' ? theme.colors.danger : theme.colors.border,
                backgroundColor: activeGame === 'FIREWALL' ? 'rgba(255, 0, 60, 0.15)' : theme.colors.surface,
              },
            ]}
          >
            <ShieldAlert size={14} color={activeGame === 'FIREWALL' ? theme.colors.danger : '#5A6F87'} />
            <Text style={[styles.switchText, { color: activeGame === 'FIREWALL' ? theme.colors.danger : '#5A6F87' }]}>
              FIREWALL DEFENSE
            </Text>
          </TouchableOpacity>
        </View>

        {/* Game 1: Reflex Target Acquisition */}
        {activeGame === 'REFLEX' && (
          <View style={styles.gameSection}>
            {/* Arena HUD Display */}
            <View
              style={[
                styles.arenaBox,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: '#01050F',
                },
              ]}
            >
              {/* Radar Grid Lines */}
              <View style={[styles.gridH, { backgroundColor: theme.colors.gridLine }]} />
              <View style={[styles.gridV, { backgroundColor: theme.colors.gridLine }]} />

              {/* Target Reticle */}
              {isPlayingReflex && targetPos && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleHitTarget}
                  style={[
                    styles.targetBtn,
                    {
                      left: `${targetPos.x}%`,
                      top: `${targetPos.y}%`,
                      borderColor: theme.colors.danger,
                    },
                  ]}
                >
                  <Target size={28} color={theme.colors.danger} />
                  <View style={[styles.targetDot, { backgroundColor: theme.colors.primary }]} />
                </TouchableOpacity>
              )}

              {!isPlayingReflex && !gameOver && (
                <View style={styles.startOverlay}>
                  <Crosshair size={32} color={theme.colors.primary} />
                  <Text style={[styles.startPrompt, { color: theme.colors.textPrimary }]}>
                    NEURAL TARGETING CALIBRATION
                  </Text>
                  <Text style={[styles.startSub, { color: theme.colors.textSecondary }]}>
                    Acquire & tap 10 incoming holographic target reticles as fast as possible.
                  </Text>
                </View>
              )}

              {gameOver && (
                <View style={styles.startOverlay}>
                  <Trophy size={32} color="#FFD700" />
                  <Text style={[styles.startPrompt, { color: '#FFD700' }]}>
                    TRAINING COMPLETE: 10/10 TARGETS
                  </Text>
                  <Text style={[styles.startSub, { color: theme.colors.textPrimary }]}>
                    AVERAGE REACTION TIME: {avgReactionMs}ms
                  </Text>
                  <Text style={[styles.ratingTag, { color: theme.colors.success }]}>
                    COMBAT RATING: {avgReactionMs < 450 ? 'ELITE AVENGER (S-RANK)' : 'TACTICAL NOMINAL (A-RANK)'}
                  </Text>
                </View>
              )}
            </View>

            {/* Score & Telemetry Bar */}
            <View style={styles.scoreRow}>
              <View style={[styles.scoreChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>TARGETS</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.textPrimary }]}>{score}/10</Text>
              </View>
              <View style={[styles.scoreChip, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>AVG REACTION</Text>
                <Text style={[styles.scoreVal, { color: theme.colors.accent }]}>{avgReactionMs} ms</Text>
              </View>
            </View>

            <HolographicButton
              title={isPlayingReflex ? 'Calibrating...' : gameOver ? 'Restart Training Session' : 'Start Target Reflex Duel'}
              mode={mode}
              onPress={startReflexGame}
              disabled={isPlayingReflex}
            />
          </View>
        )}

        {/* Game 2: Firewall Defense */}
        {activeGame === 'FIREWALL' && (
          <View style={styles.gameSection}>
            <View style={[styles.arenaBox, { borderColor: theme.colors.danger, backgroundColor: '#0A0205' }]}>
              <ShieldAlert size={36} color={theme.colors.danger} />
              <Text style={[styles.startPrompt, { color: theme.colors.danger }]}>
                QUANTUM FIREWALL INTEGRITY: 100%
              </Text>
              <Text style={[styles.startSub, { color: theme.colors.textPrimary }]}>
                Automated daemon intercepting rogue packet vectors across port 443 & 8080.
              </Text>
              <View style={[styles.firewallStatusPill, { borderColor: theme.colors.success }]}>
                <CheckCircle size={14} color={theme.colors.success} />
                <Text style={[styles.firewallStatusText, { color: theme.colors.success }]}>
                  NO BREACHES DETECTED // DEFENSE GRID ACTIVE
                </Text>
              </View>
            </View>
          </View>
        )}
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
  headerCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  headerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    gap: 6,
  },
  switchBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  switchText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  gameSection: {
    gap: 10,
  },
  arenaBox: {
    height: 250,
    borderRadius: 10,
    borderWidth: 1.5,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  targetBtn: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  startOverlay: {
    alignItems: 'center',
    gap: 6,
    padding: 16,
  },
  startPrompt: {
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  startSub: {
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 14,
  },
  ratingTag: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreChip: {
    flex: 1,
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  scoreLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  firewallStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 6,
  },
  firewallStatusText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
});
