export type PersonaMode = 'JARVIS' | 'ULTRON' | 'RADHE';

export type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking';

export type LLMProvider =
  | 'GEMINI'
  | 'OPENAI'
  | 'GROQ'
  | 'CEREBRAS'
  | 'OPENROUTER'
  | 'OPENCODE_ZEN';

export interface ToolParameter {
  type: 'string' | 'number' | 'boolean' | 'object';
  description: string;
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'DEVICE' | 'INTEL' | 'COMPUTE' | 'PRODUCTIVITY' | 'SYSTEM';
  parameters: Record<string, ToolParameter>;
}

export interface AgentExecutionStep {
  id: string;
  tool: string;
  thought: string;
  args: Record<string, any>;
  status: 'pending' | 'running' | 'success' | 'failed';
  output?: any;
  durationMs?: number;
}

export interface AgentPlan {
  id: string;
  goal: string;
  status: 'planning' | 'executing' | 'completed' | 'failed';
  steps: AgentExecutionStep[];
  finalVerdict?: string;
  startedAt: number;
  completedAt?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis' | 'ultron' | 'radhe' | 'system';
  text: string;
  timestamp: number;
  metadata?: {
    actionExecuted?: string;
    intent?: string;
    threatLevel?: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
    confidence?: number;
    actionResult?: any;
    imageUri?: string;
    agentPlan?: AgentPlan;
    widgetData?: {
      type: 'weather' | 'crypto' | 'code' | 'search' | 'calc' | 'device' | 'table';
      title: string;
      data: any;
    };
  };
}

export interface DebateMessage {
  speaker: 'jarvis' | 'ultron' | 'radhe';
  text: string;
  stance: string;
  powerRating: number;
}

export interface DebateSession {
  id: string;
  topic: string;
  status: 'debating' | 'verdict' | 'finished';
  messages: DebateMessage[];
  currentRound: number;
  maxRounds: number;
  jarvisPoints: number;
  ultronPoints: number;
  verdict?: string;
  timestamp: number;
}

export interface DetectedEntity {
  name: string;
  confidence: number;
  category: 'HUMAN' | 'TECH' | 'OBSTACLE' | 'ENVIRONMENT' | 'UNKNOWN';
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  tacticalNote: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface VisionScanResult {
  id: string;
  timestamp: number;
  imageUri?: string;
  summary: string;
  threatLevel: 'NOMINAL' | 'ELEVATED' | 'CRITICAL';
  entities: DetectedEntity[];
  tacticalAnalysis: string;
  actionRecommendation: string;
}

export interface DeviceTelemetry {
  batteryLevel: number;
  isCharging: boolean;
  networkStatus: 'ONLINE' | 'OFFLINE' | 'QUANTUM_LINK';
  networkLatencyMs: number;
  cpuLoad: number;
  temperatureC: number;
  ramUsagePercent: number;
  storageFreeGb: number;
  flashlightOn: boolean;
  osVersion: string;
}

export interface QuickReminder {
  id: string;
  title: string;
  timeStr: string;
  completed: boolean;
  priority: 'ROUTINE' | 'TACTICAL' | 'DEFCON-1';
  createdAt: number;
}

export interface TerminalEntry {
  id: string;
  type: 'cmd' | 'info' | 'warn' | 'error' | 'success' | 'system';
  text: string;
  timestamp: number;
}

export interface WorkflowMission {
  id: string;
  title: string;
  description: string;
  category: 'RECON' | 'SYSTEM' | 'RESEARCH' | 'TACTICAL' | 'CREATIVE' | 'COMPUTE';
  prompt: string;
  estimatedSteps: number;
  iconName: string;
}

export interface AppSettings {
  activeProvider: LLMProvider;
  geminiApiKey: string;
  openaiApiKey: string;
  groqApiKey: string;
  cerebrasApiKey: string;
  openrouterApiKey: string;
  opencodeZenApiKey: string;
  opencodeZenBaseUrl: string;
  customModel: string;
  soundFxEnabled: boolean;
  voiceSpeechEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  wakeWordEnabled: boolean;
  defaultMode: PersonaMode;
  hapticFeedback: boolean;
  autonomousMultiStepEnabled: boolean;
  autoFailoverEnabled: boolean;
  preferFreeTier: boolean;
}
