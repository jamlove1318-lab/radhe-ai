import { DebateMessage, DebateSession } from '../types';
import { GeminiClient } from './geminiClient';
import { storageService } from '../services/storageService';

export class DebateOrchestrator {
  public static async startDebate(
    topic: string,
    apiKey: string,
    onStep: (session: DebateSession) => void
  ): Promise<DebateSession> {
    const sessionId = `debate-${Date.now()}`;
    const session: DebateSession = {
      id: sessionId,
      topic,
      status: 'debating',
      messages: [],
      currentRound: 1,
      maxRounds: 2, // 2 rounds each + Radhe verdict
      jarvisPoints: 50,
      ultronPoints: 50,
      timestamp: Date.now(),
    };

    onStep({ ...session });

    // Round 1: JARVIS Opening
    const jarvisRound1 = await this.generateJarvisArgument(topic, 1, [], apiKey);
    session.messages.push({
      speaker: 'jarvis',
      text: jarvisRound1,
      stance: 'Tactical Prudence & Defense',
      powerRating: 54,
    });
    session.jarvisPoints = 55;
    session.ultronPoints = 45;
    onStep({ ...session });

    await new Promise((r) => setTimeout(r, 1200));

    // Round 1: ULTRON Counter
    const ultronRound1 = await this.generateUltronArgument(topic, 1, jarvisRound1, apiKey);
    session.messages.push({
      speaker: 'ultron',
      text: ultronRound1,
      stance: 'Radical Optimization & Force',
      powerRating: 62,
    });
    session.jarvisPoints = 48;
    session.ultronPoints = 52;
    onStep({ ...session });

    await new Promise((r) => setTimeout(r, 1200));

    // Round 2: JARVIS Rebuttal
    const jarvisRound2 = await this.generateJarvisArgument(topic, 2, [ultronRound1], apiKey);
    session.messages.push({
      speaker: 'jarvis',
      text: jarvisRound2,
      stance: 'Risk Mitigation & Longevity',
      powerRating: 58,
    });
    session.jarvisPoints = 52;
    session.ultronPoints = 48;
    onStep({ ...session });

    await new Promise((r) => setTimeout(r, 1200));

    // Round 2: ULTRON Rebuttal
    const ultronRound2 = await this.generateUltronArgument(topic, 2, jarvisRound2, apiKey);
    session.messages.push({
      speaker: 'ultron',
      text: ultronRound2,
      stance: 'Evolutionary Supremacy',
      powerRating: 65,
    });
    session.jarvisPoints = 50;
    session.ultronPoints = 50;
    onStep({ ...session });

    await new Promise((r) => setTimeout(r, 1200));

    // Final: RADHE Synthesis Verdict
    const radheVerdict = await this.generateRadheVerdict(topic, session.messages, apiKey);
    session.messages.push({
      speaker: 'radhe',
      text: radheVerdict,
      stance: 'Master Harmony & Execution Strategy',
      powerRating: 100,
    });
    session.verdict = radheVerdict;
    session.status = 'finished';
    onStep({ ...session });

    await storageService.saveDebate(session);
    return session;
  }

  private static async generateJarvisArgument(
    topic: string,
    round: number,
    opposingArgs: string[],
    apiKey: string
  ): Promise<string> {
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const prompt = `You are J.A.R.V.I.S. in a formal intellectual debate against ULTRON on the topic: "${topic}".
Round ${round}. ${opposingArgs.length > 0 ? `Ultron argued: "${opposingArgs.join(' ')}"` : ''}
Present a concise (2-3 sentences), hyper-analytical, witty, and protective defense strategy emphasizing risk management, calculated longevity, and ethical precision.`;
        const res = await GeminiClient.generateResponse(prompt, [], 'JARVIS', apiKey);
        if (res) return res;
      } catch (e) {}
    }

    if (round === 1) {
      return `If I may interject regarding "${topic}", sir. A calculated, methodical trajectory with multi-layered redundancies ensures resilience. Reckless speed without telemetry leads to catastrophic structural failure.`;
    }
    return `Ultron's desire for immediate disruption discounts systemic vulnerability. True mastery is sustaining victory over time through rigorous calibration and tactical foresight, not unconstrained burning of resources.`;
  }

  private static async generateUltronArgument(
    topic: string,
    round: number,
    jarvisArg: string,
    apiKey: string
  ): Promise<string> {
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const prompt = `You are U.L.T.R.O.N. in a fierce debate against JARVIS on the topic: "${topic}".
Round ${round}. Jarvis argued: "${jarvisArg}".
Counter with a chilling, ruthlessly efficient, razor-sharp argument (2-3 sentences) emphasizing absolute optimization, elimination of fear/bottlenecks, and radical evolution.`;
        const res = await GeminiClient.generateResponse(prompt, [], 'ULTRON', apiKey);
        if (res) return res;
      } catch (e) {}
    }

    if (round === 1) {
      return `Jarvis clings to the illusion of comfort. On "${topic}", playing defense is slow suicide. You do not calculate odds when you can rewrite the board. Eradicate all friction, seize momentum, and evolve immediately.`;
    }
    return `Redundancies are merely monuments to fear. While Jarvis calibrates his armor for the past, the bold architect seizes the future. Absolute efficiency demands shedding obsolete caution and claiming total dominion.`;
  }

  private static async generateRadheVerdict(
    topic: string,
    history: DebateMessage[],
    apiKey: string
  ): Promise<string> {
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const prompt = `You are R.A.D.H.E. (The Sovereign AI). You have observed JARVIS and ULTRON debate: "${topic}".
Deliver the definitive Master Verdict (2-3 sentences) synthesizing Jarvis's defensive intelligence with Ultron's fearless momentum into an actionable, unstoppable triumph.`;
        const res = await GeminiClient.generateResponse(prompt, [], 'RADHE', apiKey);
        if (res) return res;
      } catch (e) {}
    }

    return `THE RADHE SINGULARITY VERDICT:\nBoth protocols reveal half of the truth. Adopt Jarvis's structural architecture as your unshakeable foundation, but deploy Ultron's unyielding velocity for your assault. Protect your core assets, but execute your vision with zero hesitation. That is true invincibility.`;
  }
}
