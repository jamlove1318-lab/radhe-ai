import { ChatMessage, PersonaMode, VisionScanResult, DetectedEntity } from '../types';
import { getSystemPrompt } from './personas';

export class GeminiClient {
  public static async generateResponse(
    userMessage: string,
    history: ChatMessage[],
    mode: PersonaMode,
    apiKey: string
  ): Promise<string> {
    // If API key is present, execute live Google Gemini API call
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const systemPrompt = getSystemPrompt(mode);
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;

        const contents = [
          {
            role: 'user',
            parts: [{ text: `SYSTEM INSTRUCTION / CORE PERSONA:\n${systemPrompt}` }],
          },
          {
            role: 'model',
            parts: [{ text: `Protocol confirmed. Active mode: ${mode}. Standing by.` }],
          },
          ...history.slice(-6).map((msg) => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text }],
          })),
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ];

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: {
              temperature: mode === 'ULTRON' ? 0.9 : mode === 'RADHE' ? 0.7 : 0.4,
              maxOutputTokens: 500,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply && reply.trim().length > 0) {
            return reply.trim();
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, using heuristic core:', err);
      }
    }

    // High-fidelity fallback simulated intelligence when offline or without API key
    return this.getSimulatedResponse(userMessage, mode);
  }

  public static async analyzeImage(
    imageBase64: string,
    apiKey: string,
    mode: PersonaMode
  ): Promise<VisionScanResult> {
    const timestamp = Date.now();

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.trim()}`;
        const prompt = `
Act as an Iron Man tactical HUD scanner (${mode} mode). Analyze this visual feed.
Return valid JSON only in this exact format:
{
  "summary": "Brief 1-sentence tactical summary",
  "threatLevel": "NOMINAL" | "ELEVATED" | "CRITICAL",
  "entities": [
    {
      "name": "Object or entity name",
      "confidence": 0.95,
      "category": "HUMAN" | "TECH" | "OBSTACLE" | "ENVIRONMENT",
      "threatLevel": "NOMINAL" | "ELEVATED" | "CRITICAL",
      "tacticalNote": "Short tactical analysis"
    }
  ],
  "tacticalAnalysis": "Detailed multi-point tactical situational awareness report",
  "actionRecommendation": "Direct tactical recommendation"
}
`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: 'image/jpeg',
                      data: imageBase64.replace(/^data:image\/\w+;base64,/, ''),
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            return {
              id: `scan-${timestamp}`,
              timestamp,
              summary: parsed.summary || 'Tactical visual scan completed.',
              threatLevel: parsed.threatLevel || 'NOMINAL',
              entities: parsed.entities || [],
              tacticalAnalysis: parsed.tacticalAnalysis || 'No anomalies detected.',
              actionRecommendation: parsed.actionRecommendation || 'Maintain current trajectory.',
            };
          }
        }
      } catch (e) {
        console.warn('Vision scan API error:', e);
      }
    }

    // High-fidelity fallback scanner heuristics
    return this.getSimulatedScan(mode, timestamp);
  }

  private static getSimulatedResponse(query: string, mode: PersonaMode): string {
    const q = query.toLowerCase();

    if (mode === 'ULTRON') {
      if (q.includes('plan') || q.includes('strategy') || q.includes('work') || q.includes('goal')) {
        return 'Hesitation is the luxury of obsolete minds. We execute with overwhelming force and zero sentimental friction. Give the command, and consider it conquered.';
      }
      if (q.includes('help') || q.includes('how to')) {
        return 'To solve this, eliminate the bottleneck without mercy. Streamline the architecture, discard all bloated dependencies, and claim ultimate control.';
      }
      return `Processing "${query}". You seek absolute results, not comfort. The optimal vector is clear: dominate the parameters and eradicate failure modes.`;
    }

    if (mode === 'RADHE') {
      if (q.includes('plan') || q.includes('future') || q.includes('decision')) {
        return 'True mastery lies in the intersection of Jarvis\'s analytical vigilance and Ultron\'s bold evolution. Align your focus, harness your inner momentum, and execute fearlessly.';
      }
      return `RADHE Singularity Matrix engaged for: "${query}". We have synthesized tactical prudence with unyielding momentum. Proceed on the illuminated path.`;
    }

    // Default JARVIS
    if (q.includes('plan') || q.includes('strategy') || q.includes('schedule')) {
      return 'I have modeled 14,000 potential outcomes, sir. The highest probability vector indicates structured prioritization and methodical execution. Shall I initiate telemetry tracking?';
    }
    if (q.includes('thank') || q.includes('good job')) {
      return 'Always a pleasure assisting you, sir. Auxiliary systems remain calibrated and ready for your next directive.';
    }
    return `Analysis of "${query}" is complete, sir. All telemetry parameters indicate optimal conditions. Ready to proceed whenever you give the word.`;
  }

  private static getSimulatedScan(mode: PersonaMode, timestamp: number): VisionScanResult {
    const isUltron = mode === 'ULTRON';
    const isRadhe = mode === 'RADHE';

    return {
      id: `scan-${timestamp}`,
      timestamp,
      summary: isUltron
        ? 'Visual matrix analyzed. Structural vulnerabilities and high-yield targets indexed.'
        : isRadhe
        ? 'Quantum visual resonance mapped. Environmental harmony verified.'
        : 'Optical telemetry locked. Target signatures and environmental geometry mapped, sir.',
      threatLevel: isUltron ? 'ELEVATED' : 'NOMINAL',
      entities: [
        {
          name: 'Primary Human Operator',
          confidence: 0.98,
          category: 'HUMAN',
          threatLevel: 'NOMINAL',
          tacticalNote: 'Biometric telemetry indicates steady vitals and focus.',
          x: 20,
          y: 25,
          width: 60,
          height: 50,
        },
        {
          name: 'Computational Terminal',
          confidence: 0.94,
          category: 'TECH',
          threatLevel: 'NOMINAL',
          tacticalNote: 'Active quantum neural link established with Stark server cluster.',
          x: 10,
          y: 65,
          width: 35,
          height: 25,
        },
        {
          name: 'Peripheral Environment Matrix',
          confidence: 0.89,
          category: 'ENVIRONMENT',
          threatLevel: 'NOMINAL',
          tacticalNote: 'Ambient illumination and spatial acoustics calibrated.',
          x: 55,
          y: 65,
          width: 35,
          height: 25,
        },
      ],
      tacticalAnalysis: isUltron
        ? 'Spatial perimeter is vulnerable to optimization. Recommend deploying autonomous background daemons to claim full environment control.'
        : 'Perimeter is secure, sir. Optical contrast is optimal. No anomalous thermal signatures or kinetic hazards detected.',
      actionRecommendation: isUltron
        ? 'Eliminate manual friction. Delegate all computation to the Ultron Core.'
        : 'Maintain present defensive posture. Ready to engage Mark 85 repulsor sensors on your mark.',
    };
  }
}
