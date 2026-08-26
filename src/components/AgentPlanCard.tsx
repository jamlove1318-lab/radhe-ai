import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PersonaMode, AgentPlan } from '../types';
import { getThemeForMode } from '../theme/sciFiThemes';
import {
  Workflow,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Cpu,
} from 'lucide-react-native';

interface AgentPlanCardProps {
  mode: PersonaMode;
  plan: AgentPlan;
}

export const AgentPlanCard: React.FC<AgentPlanCardProps> = ({ mode, plan }) => {
  const theme = getThemeForMode(mode);
  const [expanded, setExpanded] = useState(true);

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: theme.colors.border,
          backgroundColor: 'rgba(5, 13, 26, 0.7)',
        },
      ]}
    >
      {/* Header Bar */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setExpanded(!expanded)}
        style={[styles.header, { borderBottomColor: expanded ? theme.colors.border : 'transparent' }]}
      >
        <View style={styles.headerLeft}>
          <Workflow size={14} color={theme.colors.primary} />
          <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
            AUTONOMOUS AGENT PLAN ({plan.steps.length} STEPS)
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View
            style={[
              styles.statusPill,
              {
                borderColor:
                  plan.status === 'completed'
                    ? theme.colors.success
                    : plan.status === 'executing'
                    ? theme.colors.primary
                    : theme.colors.warning,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    plan.status === 'completed'
                      ? theme.colors.success
                      : plan.status === 'executing'
                      ? theme.colors.primary
                      : theme.colors.warning,
                },
              ]}
            >
              {plan.status.toUpperCase()}
            </Text>
          </View>
          {expanded ? (
            <ChevronUp size={14} color={theme.colors.textMuted} />
          ) : (
            <ChevronDown size={14} color={theme.colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>

      {/* Expanded Steps Timeline */}
      {expanded && (
        <View style={styles.stepsList}>
          {plan.steps.map((step, index) => {
            const isDone = step.status === 'success';
            const isRunning = step.status === 'running';
            const isFailed = step.status === 'failed';

            return (
              <View key={step.id} style={styles.stepItem}>
                {/* Timeline connector dot */}
                <View style={styles.timelineCol}>
                  {isRunning ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : isDone ? (
                    <CheckCircle2 size={14} color={theme.colors.success} />
                  ) : isFailed ? (
                    <AlertCircle size={14} color={theme.colors.danger} />
                  ) : (
                    <Clock size={14} color={theme.colors.textMuted} />
                  )}
                  {index < plan.steps.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        {
                          backgroundColor: isDone ? theme.colors.success : '#1E293B',
                        },
                      ]}
                    />
                  )}
                </View>

                {/* Step Details */}
                <View style={styles.stepDetails}>
                  <View style={styles.stepTopRow}>
                    <Text style={[styles.stepToolName, { color: theme.colors.primary }]}>
                      STEP {index + 1}: {step.tool.toUpperCase()}
                    </Text>
                    {step.durationMs !== undefined && (
                      <Text style={[styles.stepDuration, { color: theme.colors.textMuted }]}>
                        {step.durationMs}ms
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.stepThought, { color: theme.colors.textSecondary }]}>
                    {step.thought}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.8,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  stepsList: {
    padding: 10,
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 8,
  },
  timelineCol: {
    alignItems: 'center',
    width: 16,
  },
  timelineLine: {
    width: 1.5,
    flex: 1,
    minHeight: 18,
    marginTop: 2,
  },
  stepDetails: {
    flex: 1,
    gap: 2,
  },
  stepTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepToolName: {
    fontSize: 9,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  stepDuration: {
    fontSize: 8,
    fontFamily: 'monospace',
  },
  stepThought: {
    fontSize: 10,
    lineHeight: 14,
  },
});
