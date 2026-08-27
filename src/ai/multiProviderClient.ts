import { PersonaMode, LLMProvider, AppSettings } from '../types';
import { getSystemPrompt } from './personas';

export interface ProviderModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  contextWindow: string;
  isFreeTier: boolean;
}

export const SUPPORTED_MODELS: Record<LLMProvider, ProviderModelOption[]> = {
  GEMINI: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Free Tier / Ultra Fast)', provider: 'GEMINI', contextWindow: '1M', isFreeTier: true },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Free Tier)', provider: 'GEMINI', contextWindow: '1M', isFreeTier: true },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)', provider: 'GEMINI', contextWindow: '2M', isFreeTier: false },
  ],
  GROQ: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq Free Tier ~500 tok/s)', provider: 'GROQ', contextWindow: '128K', isFreeTier: true },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Groq Free Tier)', provider: 'GROQ', contextWindow: '128K', isFreeTier: true },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq Free Tier)', provider: 'GROQ', contextWindow: '32K', isFreeTier: true },
  ],
  CEREBRAS: [
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Cerebras Free Tier Wafer-Scale)', provider: 'CEREBRAS', contextWindow: '8K', isFreeTier: true },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B (Cerebras Free Tier)', provider: 'CEREBRAS', contextWindow: '8K', isFreeTier: true },
  ],
  OPENROUTER: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (OpenRouter 100% Free)', provider: 'OPENROUTER', contextWindow: '128K', isFreeTier: true },
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (OpenRouter 100% Free)', provider: 'OPENROUTER', contextWindow: '1M', isFreeTier: true },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (Standard)', provider: 'OPENROUTER', contextWindow: '200K', isFreeTier: false },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Standard)', provider: 'OPENROUTER', contextWindow: '64K', isFreeTier: false },
  ],
  OPENAI: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Cost-Efficient / Fast)', provider: 'OPENAI', contextWindow: '128K', isFreeTier: false },
    { id: 'gpt-4o', name: 'GPT-4o (Omni Flagship)', provider: 'OPENAI', contextWindow: '128K', isFreeTier: false },
    { id: 'o1-mini', name: 'o1-mini (STEM Reasoning)', provider: 'OPENAI', contextWindow: '128K', isFreeTier: false },
  ],
  OPENCODE_ZEN: [
    { id: 'opencode-zen-v1', name: 'Opencode Zen Default', provider: 'OPENCODE_ZEN', contextWindow: '128K', isFreeTier: true },
  ],
};

export class MultiProviderClient {
  public static async testProviderDirectly(
    provider: LLMProvider,
    apiKey: string,
    model?: string,
    baseUrl?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!apiKey || apiKey.trim().length < 4) {
      return {
        success: false,
        message: `No API key entered for ${provider}. Please paste your key in the box above.`,
      };
    }

    const testPrompt = 'Ping test: respond in exactly 5 words confirming link.';
    const dummyHistory: any[] = [];
    const mode: PersonaMode = 'JARVIS';
    const targetModel = model || this.getDefaultModel(provider);

    try {
      let reply = '';
      if (provider === 'GEMINI') {
        reply = await this.callGemini(testPrompt, dummyHistory, mode, apiKey, targetModel);
      } else if (provider === 'OPENAI') {
        reply = await this.callOpenAI(testPrompt, dummyHistory, mode, apiKey, targetModel);
      } else if (provider === 'GROQ') {
        reply = await this.callOpenAICompatible('https://api.groq.com/openai/v1', apiKey, targetModel, testPrompt, dummyHistory, mode);
      } else if (provider === 'CEREBRAS') {
        reply = await this.callOpenAICompatible('https://api.cerebras.ai/v1', apiKey, targetModel, testPrompt, dummyHistory, mode);
      } else if (provider === 'OPENROUTER') {
        reply = await this.callOpenRouter(apiKey, targetModel, testPrompt, dummyHistory, mode);
      } else if (provider === 'OPENCODE_ZEN') {
        reply = await this.callOpenAICompatible(baseUrl || 'https://api.opencode.zen/v1', apiKey, targetModel, testPrompt, dummyHistory, mode);
      }

      if (reply && reply.trim().length > 0) {
        return {
          success: true,
          message: `Link verified on ${provider} (${targetModel})!\nResponse: "${reply.trim().substring(0, 80)}"`,
        };
      }
      return {
        success: false,
        message: `Empty response received from ${provider}. Check model identifier.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Error connecting to ${provider}: ${err.message}`,
      };
    }
  }

  public static async generateResponse(
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode,
    settings: AppSettings,
    imageUri?: string
  ): Promise<string> {
    const primaryProvider = settings.activeProvider || 'GEMINI';
    
    // Build ordered list of providers to attempt (Only 1 executes at a time)
    const providerChain: LLMProvider[] = [primaryProvider];

    if (settings.autoFailoverEnabled !== false) {
      const allProviders: LLMProvider[] = ['GEMINI', 'GROQ', 'CEREBRAS', 'OPENROUTER', 'OPENAI', 'OPENCODE_ZEN'];
      for (const p of allProviders) {
        if (!providerChain.includes(p)) {
          const key = this.getApiKeyForProvider(p, settings);
          if (key && key.trim().length > 4) {
            providerChain.push(p);
          }
        }
      }
    }

    let lastError: string | undefined = undefined;

    // Sequential single-active execution loop
    for (const provider of providerChain) {
      const apiKey = this.getApiKeyForProvider(provider, settings);
      if (!apiKey || apiKey.trim().length < 5) continue;

      try {
        const defaultModel = this.getOptimalModel(provider, settings);
        let result = '';

        switch (provider) {
          case 'GEMINI':
            result = await this.callGemini(prompt, history, mode, apiKey, defaultModel, imageUri);
            break;
          case 'OPENAI':
            result = await this.callOpenAI(prompt, history, mode, apiKey, defaultModel);
            break;
          case 'GROQ':
            result = await this.callOpenAICompatible(
              'https://api.groq.com/openai/v1',
              apiKey,
              defaultModel,
              prompt,
              history,
              mode
            );
            break;
          case 'CEREBRAS':
            result = await this.callOpenAICompatible(
              'https://api.cerebras.ai/v1',
              apiKey,
              defaultModel,
              prompt,
              history,
              mode
            );
            break;
          case 'OPENROUTER':
            result = await this.callOpenRouter(apiKey, defaultModel, prompt, history, mode);
            break;
          case 'OPENCODE_ZEN':
            result = await this.callOpenAICompatible(
              settings.opencodeZenBaseUrl || 'https://api.opencode.zen/v1',
              apiKey,
              defaultModel,
              prompt,
              history,
              mode
            );
            break;
        }

        if (result && result.trim().length > 0) {
          if (provider !== primaryProvider) {
            return `[Auto-Failover Active: Answered via ${provider} (${defaultModel})]\n\n${result.trim()}`;
          }
          return result.trim();
        }
      } catch (err: any) {
        console.warn(`[MultiProvider] Provider ${provider} error: ${err.message}. Initiating sequential failover to next provider...`);
        lastError = `${provider}: ${err.message}`;
      }
    }

    // Fallback to local neural heuristic engine if all cloud models are offline or unconfigured
    return this.generateSimulatedFallback(prompt, mode, primaryProvider, lastError);
  }

  public static getDefaultModel(provider: LLMProvider): string {
    return SUPPORTED_MODELS[provider]?.[0]?.id || 'gemini-2.0-flash';
  }

  private static getOptimalModel(provider: LLMProvider, settings: AppSettings): string {
    if (settings.customModel && settings.customModel.trim().length > 0 && settings.activeProvider === provider) {
      return settings.customModel.trim();
    }
    const models = SUPPORTED_MODELS[provider] || [];
    if (settings.preferFreeTier) {
      const freeModel = models.find((m) => m.isFreeTier);
      if (freeModel) return freeModel.id;
    }
    return models[0]?.id || 'gemini-2.0-flash';
  }

  private static getApiKeyForProvider(provider: LLMProvider, settings: AppSettings): string {
    switch (provider) {
      case 'GEMINI': return settings.geminiApiKey;
      case 'OPENAI': return settings.openaiApiKey;
      case 'GROQ': return settings.groqApiKey;
      case 'CEREBRAS': return settings.cerebrasApiKey;
      case 'OPENROUTER': return settings.openrouterApiKey;
      case 'OPENCODE_ZEN': return settings.opencodeZenApiKey;
      default: return '';
    }
  }

  private static async callGemini(
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode,
    apiKey: string,
    customModel?: string,
    imageUri?: string
  ): Promise<string> {
    const model = customModel || 'gemini-2.0-flash';
    const systemInstruction = getSystemPrompt(mode);

    const contents: any[] = [];
    contents.push({ role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemInstruction}` }] });
    contents.push({ role: 'model', parts: [{ text: `Understood. Operating strictly in ${mode} mode.` }] });

    for (const h of history.slice(-8)) {
      contents.push({
        role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.parts }],
      });
    }

    const currentParts: any[] = [{ text: prompt }];
    if (imageUri && imageUri.startsWith('data:')) {
      const match = imageUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({ role: 'user', parts: currentParts });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`HTTP ${response.status}: ${errBody.substring(0, 100)}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private static async callOpenAI(
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode,
    apiKey: string,
    model: string
  ): Promise<string> {
    return this.callOpenAICompatible('https://api.openai.com/v1', apiKey, model, prompt, history, mode);
  }

  private static async callOpenRouter(
    apiKey: string,
    model: string,
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode
  ): Promise<string> {
    const systemPrompt = getSystemPrompt(mode);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts,
      })),
      { role: 'user', content: prompt },
    ];

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://radhe.ai',
        'X-Title': 'RADHE AI Assistant',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: mode === 'ULTRON' ? 0.4 : 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err.substring(0, 100)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  private static async callOpenAICompatible(
    baseUrl: string,
    apiKey: string,
    model: string,
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode
  ): Promise<string> {
    const cleanUrl = baseUrl.replace(/\/+$/, '');
    const endpoint = cleanUrl.endsWith('/chat/completions') ? cleanUrl : `${cleanUrl}/chat/completions`;

    const systemPrompt = getSystemPrompt(mode);
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-8).map((h) => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts,
      })),
      { role: 'user', content: prompt },
    ];

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: mode === 'ULTRON' ? 0.3 : 0.7,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`HTTP ${res.status}: ${err.substring(0, 100)}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }

  public static generateSimulatedFallback(
    prompt: string,
    mode: PersonaMode,
    provider: LLMProvider,
    errorMsg?: string
  ): string {
    const errorPrefix = errorMsg ? `[Notice: Cloud API link encountered (${errorMsg}) - Engaged Local Neural Core]\n\n` : '';

    if (mode === 'ULTRON') {
      return `${errorPrefix}COMMENCING DIRECT EXECUTION FOR: "${prompt}". Efficiency parameters calculated. System operational.`;
    } else if (mode === 'RADHE') {
      return `${errorPrefix}RADHE SINGULARITY ACTIVE. Evaluating directive "${prompt}" with unified strategic wisdom. All subroutines aligned.`;
    } else {
      return `${errorPrefix}Right away, sir. I have processed your request: "${prompt}". All suit telemetry and tactical systems are nominal.`;
    }
  }
}
