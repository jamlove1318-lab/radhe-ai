import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { PersonaMode, WorkflowMission, AgentPlan, AppSettings } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import { IronManHudOverlay } from '../components/IronManHudOverlay';
import { HolographicButton } from '../components/HolographicButton';
import { AgentEngine } from '../ai/agentEngine';
import { AgentPlanCard } from '../components/AgentPlanCard';
import { HudWidgetRenderer } from '../components/HudWidgetRenderer';
import { SkillService, CustomSkill } from '../services/skillService';
import { soundFx } from '../audio/soundEngine';
import { speechEngine } from '../audio/speechEngine';
import {
  Workflow,
  Play,
  Zap,
  Globe,
  Cpu,
  Code,
  ShieldAlert,
  Sparkles,
  Plus,
  Trash2,
  Bookmark,
} from 'lucide-react-native';

interface AgentWorkflowProps {
  mode: PersonaMode;
  settings: AppSettings;
}

export const AgentWorkflowScreen: React.FC<AgentWorkflowProps> = ({ mode, settings }) => {
  const theme = getThemeForMode(mode);
  const [customGoal, setCustomGoal] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
  const [finalVerdict, setFinalVerdict] = useState<string | null>(null);
  const [widgetData, setWidgetData] = useState<any>(null);

  // Custom Skills State
  const [skills, setSkills] = useState<CustomSkill[]>([]);
  const [newTrigger, setNewTrigger] = useState('');
  const [newAction, setNewAction] = useState('');
  const [isAddingSkill, setIsAddingSkill] = useState(false);

  useEffect(() => {
    SkillService.getSkills().then(setSkills);
  }, []);

  const presetMissions: WorkflowMission[] = [
    {
      id: 'm-1',
      title: 'GLOBAL INTEL & MARKET RECON',
      description: 'Searches world telemetry, checks BTC & NVDA markets, pulls global weather, and synthesizes tactical briefing.',
      category: 'RECON',
      prompt: 'Perform global intel reconnaissance: fetch BTC and NVDA market prices, check weather in London, and compile executive briefing.',
      estimatedSteps: 3,
      iconName: 'Globe',
    },
    {
      id: 'm-2',
      title: 'SUIT HARDWARE OVERCLOCK & DIAGNOSTICS',
      description: 'Executes hardware integrity check, overclocks CPU to maximum ceiling, tests telemetry sub-bus.',
      category: 'SYSTEM',
      prompt: 'Run full suit telemetry diagnostics, overclock central processing units to 100%, and record tactical directive.',
      estimatedSteps: 3,
      iconName: 'Cpu',
    },
    {
      id: 'm-3',
      title: 'CODE RUNTIME & ALGORITHMIC BENCHMARK',
      description: 'Generates and runs sandboxed JavaScript algorithms, performs mathematical optimizations, returns verified outputs.',
      category: 'COMPUTE',
      prompt: 'Execute a sandboxed JavaScript algorithm to calculate Fibonacci and prime numbers, compute Math.sqrt(65536) * 42, and output telemetry.',
      estimatedSteps: 2,
      iconName: 'Code',
    },
    {
      id: 'm-4',
      title: 'HOUSE PARTY & DEFENSE PROTOCOL',
      description: 'Dispatches autonomous defense sentries, engages tactical illumination, and establishes priority directives.',
      category: 'TACTICAL',
      prompt: 'Authorize House Party defense protocol, ignite flashlight matrix, and schedule tactical priority reminder.',
      estimatedSteps: 3,
      iconName: 'ShieldAlert',
    },
  ];

  const handleRunMission = async (goalToRun: string) => {
    if (!goalToRun.trim() || isExecuting) return;

    setIsExecuting(true);
    setCurrentPlan(null);
    setFinalVerdict(null);
    setWidgetData(null);
    soundFx.playAlert();

    try {
      const result = await AgentEngine.executeAutonomousGoal(
        goalToRun,
        mode,
        settings.geminiApiKey,
        [],
        (progress) => {
          setCurrentPlan({ ...progress.plan });
          soundFx.playScanBlip();
        }
      );

      setCurrentPlan(result.plan);
      setFinalVerdict(result.finalText);
      setWidgetData(result.widgetData);
      soundFx.playTargetLock();

      if (settings.voiceSpeechEnabled) {
        speechEngine.speak(result.finalText, mode);
      }
    } catch (e) {
      console.warn('Mission execution error:', e);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateSkill = async () => {
    if (!newTrigger.trim() || !newAction.trim()) return;
    soundFx.playHudClick();
    const created = await SkillService.addSkill(newTrigger, newAction);
    setSkills([created, ...skills]);
    setNewTrigger('');
    setNewAction('');
    setIsAddingSkill(false);
  };

  const handleDeleteSkill = async (id: string) => {
    soundFx.playHudClick();
    await SkillService.deleteSkill(id);
    setSkills(skills.filter((s) => s.id !== id));
  };

  return (
    <IronManHudOverlay mode={mode}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header Title */}
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.headerIconRow}>
            <Workflow size={22} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
              AUTONOMOUS MISSION & SKILL ORCHESTRATOR
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
            Universal Goal Execution, Dynamic Logic Synthesizer & Custom Voice Macros
          </Text>
        </View>

        {/* Custom Goal Execution Box */}
        <View style={[styles.customBox, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            DISPATCH ANY TASK (RADHE WILL SYNTHESIZE & EXECUTE):
          </Text>
          <TextInput
            style={[styles.goalInput, { color: theme.colors.textPrimary }]}
            placeholder="e.g. 'Convert 250 USD to EUR', 'Generate 24-char password', 'Calculate mortgage yield', 'Who was Alan Turing'..."
            placeholderTextColor={theme.colors.textMuted}
            value={customGoal}
            onChangeText={setCustomGoal}
            multiline
            numberOfLines={2}
          />
          <HolographicButton
            title={isExecuting ? 'Executing Autonomous Chain...' : 'Execute Task Now'}
            mode={mode}
            disabled={isExecuting}
            onPress={() => handleRunMission(customGoal)}
            icon={isExecuting ? <ActivityIndicator size="small" color="#FFF" /> : <Play size={14} color="#FFF" />}
          />
        </View>

        {/* Live Execution Plan Status */}
        {currentPlan && (
          <View style={styles.planSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
              LIVE MISSION EXECUTION DAG:
            </Text>
            <AgentPlanCard mode={mode} plan={currentPlan} />

            {widgetData && (
              <HudWidgetRenderer mode={mode} widget={widgetData} />
            )}

            {finalVerdict && (
              <View
                style={[
                  styles.verdictCard,
                  {
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surfaceElevated,
                  },
                ]}
              >
                <View style={styles.verdictHeader}>
                  <Sparkles size={16} color={theme.colors.primary} />
                  <Text style={[styles.verdictTitle, { color: theme.colors.primary }]}>
                    MISSION SYNTHESIS REPORT // [{mode}]
                  </Text>
                </View>
                <Text style={[styles.verdictText, { color: theme.colors.textPrimary }]}>
                  {finalVerdict}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Custom Learned Skills Section */}
        <View style={styles.skillsHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            CUSTOM LEARNED VOICE SKILLS & MACROS:
          </Text>
          <TouchableOpacity
            onPress={() => setIsAddingSkill(!isAddingSkill)}
            style={[styles.teachBtn, { borderColor: theme.colors.primary }]}
          >
            <Plus size={12} color={theme.colors.primary} />
            <Text style={[styles.teachBtnText, { color: theme.colors.primary }]}>
              {isAddingSkill ? 'Cancel' : 'Teach New Skill'}
            </Text>
          </TouchableOpacity>
        </View>

        {isAddingSkill && (
          <View style={[styles.addSkillCard, { borderColor: theme.colors.primary, backgroundColor: theme.colors.surfaceElevated }]}>
            <Text style={[styles.skillInputLabel, { color: theme.colors.textSecondary }]}>
              WHEN I SAY (TRIGGER PHRASE):
            </Text>
            <TextInput
              style={[styles.skillInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              placeholder="e.g. 'Deploy defenses', 'Workout mode', 'Code Red'..."
              placeholderTextColor={theme.colors.textMuted}
              value={newTrigger}
              onChangeText={setNewTrigger}
            />

            <Text style={[styles.skillInputLabel, { color: theme.colors.textSecondary, marginTop: 4 }]}>
              THEN EXECUTE THIS ACTION / TOOLS:
            </Text>
            <TextInput
              style={[styles.skillInput, { color: theme.colors.textPrimary, borderColor: theme.colors.border }]}
              placeholder="e.g. 'Overclock CPU, turn on flashlight, check London weather and set reminder'..."
              placeholderTextColor={theme.colors.textMuted}
              value={newAction}
              onChangeText={setNewAction}
              multiline
            />

            <HolographicButton
              title="Save & Teach Skill to RADHE"
              mode={mode}
              onPress={handleCreateSkill}
              style={{ marginTop: 4 }}
            />
          </View>
        )}

        <View style={styles.skillsList}>
          {skills.map((skill) => (
            <View
              key={skill.id}
              style={[
                styles.skillCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <View style={styles.skillTopRow}>
                <View style={styles.skillBadge}>
                  <Bookmark size={12} color={theme.colors.primary} />
                  <Text style={[styles.triggerText, { color: theme.colors.primary }]}>
                    "{skill.triggerPhrase.toUpperCase()}"
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteSkill(skill.id)}>
                  <Trash2 size={14} color="#5A6F87" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.actionPromptText, { color: theme.colors.textPrimary }]}>
                {skill.actionPrompt}
              </Text>

              <TouchableOpacity
                onPress={() => handleRunMission(skill.actionPrompt)}
                style={styles.triggerActionRow}
              >
                <Zap size={11} color={theme.colors.accent} />
                <Text style={[styles.triggerActionText, { color: theme.colors.accent }]}>
                  RUN SKILL (EXECUTED {skill.runCount} TIMES) →
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Preset Mission Catalog */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          AUTONOMOUS RECON CATALOG:
        </Text>

        <View style={styles.missionsGrid}>
          {presetMissions.map((m) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.8}
              onPress={() => {
                setCustomGoal(m.prompt);
                handleRunMission(m.prompt);
              }}
              style={[
                styles.missionCard,
                {
                  borderColor: theme.colors.border,
                  backgroundColor: theme.colors.surface,
                },
              ]}
            >
              <View style={styles.missionTopRow}>
                <View style={styles.missionIconBox}>
                  {m.iconName === 'Globe' && <Globe size={18} color={theme.colors.primary} />}
                  {m.iconName === 'Cpu' && <Cpu size={18} color={theme.colors.danger} />}
                  {m.iconName === 'Code' && <Code size={18} color="#00FFA3" />}
                  {m.iconName === 'ShieldAlert' && <ShieldAlert size={18} color={theme.colors.warning} />}
                </View>
                <View style={styles.missionTitleCol}>
                  <Text style={[styles.missionTitle, { color: theme.colors.textPrimary }]}>
                    {m.title}
                  </Text>
                  <Text style={[styles.missionCategory, { color: theme.colors.textSecondary }]}>
                    [{m.category}] // {m.estimatedSteps} STEPS
                  </Text>
                </View>
              </View>

              <Text style={[styles.missionDesc, { color: theme.colors.textMuted }]}>
                {m.description}
              </Text>
            </TouchableOpacity>
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
  customBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  inputLabel: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  goalInput: {
    minHeight: 52,
    fontSize: 12,
    fontFamily: 'monospace',
    paddingHorizontal: 8,
    textAlignVertical: 'top',
  },
  planSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
    marginTop: 4,
  },
  verdictCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verdictTitle: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1.2,
  },
  verdictText: {
    fontSize: 12,
    lineHeight: 18,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  teachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  teachBtnText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  addSkillCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  skillInputLabel: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  skillInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  skillsList: {
    gap: 6,
  },
  skillCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  skillTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triggerText: {
    fontSize: 10,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  actionPromptText: {
    fontSize: 11,
    lineHeight: 15,
  },
  triggerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  triggerActionText: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  missionsGrid: {
    gap: 8,
  },
  missionCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  missionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#050D18',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missionTitleCol: {
    flex: 1,
    gap: 1,
  },
  missionTitle: {
    fontSize: 11,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  missionCategory: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  missionDesc: {
    fontSize: 10,
    lineHeight: 14,
  },
});
