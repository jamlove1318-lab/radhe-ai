import { ChatMessage, PersonaMode, VisionScanResult, AppSettings } from '../types';
import { MultiProviderClient } from './multiProviderClient';
import { getSystemPrompt } from './personas';

export class GeminiClient {
  public static async generateResponse(
    userMessage: string,
    history: ChatMessage[],
    mode: PersonaMode,
    apiKey: string,
    settings?: AppSettings
  ): Promise<string> {
    const formattedHistory = history.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('model' as const),
      parts: m.text,
    }));

    const activeSettings: AppSettings = settings || {
      activeProvider: 'GEMINI',
      geminiApiKey: apiKey,
      openaiApiKey: '',
      groqApiKey: '',
      cerebrasApiKey: '',
      openrouterApiKey: '',
      opencodeZenApiKey: '',
      opencodeZenBaseUrl: '',
      customModel: 'gemini-2.0-flash',
      soundFxEnabled: true,
      voiceSpeechEnabled: true,
      speechRate: 1.0,
      speechPitch: 1.0,
      wakeWordEnabled: true,
      defaultMode: mode,
      hapticFeedback: true,
      autonomousMultiStepEnabled: true,
      autoFailoverEnabled: true,
      preferFreeTier: true,
    };

    return MultiProviderClient.generateResponse(
      userMessage,
      formattedHistory,
      mode,
      activeSettings
    );
  }

  public static async analyzeImage(
    imageBase64: string,
    apiKey: string,
    mode: PersonaMode
  ): Promise<VisionScanResult> {
    const timestamp = Date.now();

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey.trim()}`;
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

    return this.getSimulatedScan(mode, timestamp);
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
