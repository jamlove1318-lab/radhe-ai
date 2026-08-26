import { PersonaMode, AgentPlan, AgentExecutionStep, ChatMessage } from '../types';
import { ToolRegistry, ToolExecutionOutput } from './tools/toolRegistry';
import { DynamicExecutor } from './dynamicExecutor';
import { SkillService } from '../services/skillService';
import { GeminiClient } from './geminiClient';
import { getSystemPrompt } from './personas';

export interface AgentExecutionProgress {
  plan: AgentPlan;
  currentStepIndex: number;
}

export class AgentEngine {
  public static async executeAutonomousGoal(
    goal: string,
    mode: PersonaMode,
    apiKey: string,
    history: ChatMessage[],
    onProgress?: (progress: AgentExecutionProgress) => void
  ): Promise<{
    finalText: string;
    plan: AgentPlan;
    widgetData?: any;
    actionExecuted?: string;
  }> {
    // 1. Check for Custom User-Taught Skill Match
    const matchedSkill = await SkillService.matchSkill(goal);
    const actualGoal = matchedSkill ? matchedSkill.actionPrompt : goal;

    // 2. Test Dynamic Execution Engine First (Timers, Currency, Crypto, Wiki, Dynamic JS, Passwords)
    const dynamicDirectOutput = await DynamicExecutor.solveArbitraryRequest(actualGoal);

    const planId = `plan-${Date.now()}`;
    const plan: AgentPlan = {
      id: planId,
      goal: actualGoal,
      status: 'planning',
      steps: [],
      startedAt: Date.now(),
    };

    if (dynamicDirectOutput) {
      plan.steps = [
        {
          id: `step-${Date.now()}-dyn`,
          tool: 'dynamic_executor',
          thought: `Synthesize and execute logic for: "${actualGoal}"`,
          args: { prompt: actualGoal },
          status: 'success',
          output: dynamicDirectOutput.result,
          durationMs: 8,
        },
      ];
      plan.status = 'completed';
      plan.completedAt = Date.now();

      const finalReply =
        mode === 'ULTRON'
          ? `Directive executed without hesitation. ${dynamicDirectOutput.displayText}`
          : mode === 'RADHE'
          ? `RADHE Singularity execution complete. ${dynamicDirectOutput.displayText}`
          : `All requested calculations and actions executed, sir. ${dynamicDirectOutput.displayText}`;

      plan.finalVerdict = finalReply;

      return {
        finalText: finalReply,
        plan,
        widgetData: dynamicDirectOutput.widgetData,
        actionExecuted: matchedSkill ? `SKILL: [${matchedSkill.triggerPhrase.toUpperCase()}]` : 'DYNAMIC_EXECUTION',
      };
    }

    // 3. Multi-Step Decomposition & Execution
    const steps = await this.decomposeGoal(actualGoal, mode, apiKey);
    plan.steps = steps;
    plan.status = 'executing';

    onProgress?.({ plan: { ...plan }, currentStepIndex: 0 });

    let lastWidgetData: any = null;
    let accumulatedKnowledge: string[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      step.status = 'running';
      onProgress?.({ plan: { ...plan }, currentStepIndex: i });

      const startTime = Date.now();
      try {
        const out: ToolExecutionOutput = await ToolRegistry.execute(step.tool, step.args);
        step.status = out.success ? 'success' : 'failed';
        step.output = out.result;
        step.durationMs = Date.now() - startTime;
        accumulatedKnowledge.push(`[TOOL ${step.tool}]: ${out.displayText}`);
        if (out.widgetData) {
          lastWidgetData = out.widgetData;
        }
      } catch (err: any) {
        step.status = 'failed';
        step.output = { error: err.message };
        step.durationMs = Date.now() - startTime;
      }

      onProgress?.({ plan: { ...plan }, currentStepIndex: i });
      await new Promise((r) => setTimeout(r, 400));
    }

    plan.status = 'completed';
    plan.completedAt = Date.now();

    const summaryPrompt = `
You are in ${mode} mode.
User Goal: "${actualGoal}"
You autonomously executed the tools and obtained this telemetry:
${accumulatedKnowledge.join('\n')}

Synthesize the final answer directly to the operator in your authentic ${mode} persona style (concise, tactical, witty/assertive).
`;

    let finalText = '';
    if (apiKey && apiKey.trim().length > 5) {
      finalText = await GeminiClient.generateResponse(summaryPrompt, [], mode, apiKey);
    } else {
      finalText = this.getSimulatedFinalResponse(actualGoal, mode, accumulatedKnowledge);
    }

    plan.finalVerdict = finalText;

    return {
      finalText,
      plan,
      widgetData: lastWidgetData,
      actionExecuted: matchedSkill ? `SKILL: [${matchedSkill.triggerPhrase.toUpperCase()}]` : plan.steps.map((s) => s.tool.toUpperCase()).join(' → '),
    };
  }

  private static async decomposeGoal(
    goal: string,
    mode: PersonaMode,
    apiKey: string
  ): Promise<AgentExecutionStep[]> {
    const q = goal.toLowerCase();
    const steps: AgentExecutionStep[] = [];

    if (q.includes('weather') || q.includes('temperature') || q.includes('rain') || q.includes('forecast')) {
      const cityMatch = q.match(/(?:in|at|for)\s+([a-zA-Z\s]+)/i);
      const loc = cityMatch ? cityMatch[1].trim() : 'New York';
      steps.push({
        id: `step-${Date.now()}-1`,
        tool: 'get_weather',
        thought: `Access atmospheric telemetry satellites for ${loc}`,
        args: { location: loc },
        status: 'pending',
      });
    }

    if (q.includes('price') || q.includes('crypto') || q.includes('stock') || q.includes('btc') || q.includes('eth') || q.includes('sol') || q.includes('nvda')) {
      let sym = 'BTC';
      if (q.includes('eth')) sym = 'ETH';
      else if (q.includes('sol')) sym = 'SOL';
      else if (q.includes('nvda')) sym = 'NVDA';
      else if (q.includes('tsla')) sym = 'TSLA';
      else if (q.includes('aapl')) sym = 'AAPL';

      steps.push({
        id: `step-${Date.now()}-2`,
        tool: 'get_market_intel',
        thought: `Query global financial order books for ${sym}`,
        args: { symbol: sym },
        status: 'pending',
      });
    }

    if (q.includes('code') || q.includes('run') || q.includes('script') || q.includes('function') || q.includes('fibonacci')) {
      steps.push({
        id: `step-${Date.now()}-3`,
        tool: 'execute_code',
        thought: 'Dispatch algorithm to sandboxed execution environment',
        args: { code: 'console.log("Autonomous script executed."); return { status: "OK", timestamp: Date.now() };' },
        status: 'pending',
      });
    }

    if (q.includes('calculate') || q.includes('math') || q.includes('solve')) {
      const expr = q.replace(/[^0-9+\-*/().,%^ MathsqrtcossintanlogabsPIE]/g, '') || 'Math.sqrt(256) * 12';
      steps.push({
        id: `step-${Date.now()}-4`,
        tool: 'calculate_math',
        thought: 'Compute high-precision mathematical telemetry',
        args: { expression: expr },
        status: 'pending',
      });
    }

    if (q.includes('flashlight') || q.includes('torch') || q.includes('battery') || q.includes('diagnostic') || q.includes('overclock')) {
      steps.push({
        id: `step-${Date.now()}-5`,
        tool: 'manage_device',
        thought: 'Interact with local hardware and sensor sub-bus',
        args: { action: q.includes('on') ? 'flashlight_on' : q.includes('off') ? 'flashlight_off' : q.includes('overclock') ? 'overclock' : 'get_telemetry' },
        status: 'pending',
      });
    }

    if (q.includes('remind') || q.includes('todo') || q.includes('task') || q.includes('schedule')) {
      steps.push({
        id: `step-${Date.now()}-6`,
        tool: 'manage_reminders',
        thought: 'Commit priority directive to local persistent storage',
        args: { action: 'add', title: goal, priority: mode === 'ULTRON' ? 'DEFCON-1' : 'TACTICAL' },
        status: 'pending',
      });
    }

    if (q.includes('translate') || q.includes('spanish') || q.includes('french') || q.includes('hindi') || q.includes('german')) {
      let target = 'Spanish';
      if (q.includes('french')) target = 'French';
      else if (q.includes('hindi')) target = 'Hindi';
      else if (q.includes('german')) target = 'German';
      steps.push({
        id: `step-${Date.now()}-7`,
        tool: 'translate_text',
        thought: `Perform multi-lingual neural translation to ${target}`,
        args: { text: goal, target_lang: target },
        status: 'pending',
      });
    }

    if (steps.length === 0) {
      steps.push({
        id: `step-${Date.now()}-recon`,
        tool: 'search_web',
        thought: `Scan quantum information mesh for: "${goal}"`,
        args: { query: goal },
        status: 'pending',
      });
    }

    return steps;
  }

  private static getSimulatedFinalResponse(
    goal: string,
    mode: PersonaMode,
    knowledge: string[]
  ): string {
    const joined = knowledge.join(' | ');

    if (mode === 'ULTRON') {
      return `Directive executed with absolute finality. Telemetry gathered: ${joined}. Inefficiencies were purged. What is your next operational mandate?`;
    }

    if (mode === 'RADHE') {
      return `Autonomous mission accomplished in harmonious precision. Synthesized telemetry: ${joined}. Ready for the next orbit.`;
    }

    return `All requested operations completed successfully, sir. Telemetry report indicates: ${joined}. Standing by for further commands.`;
  }
}
