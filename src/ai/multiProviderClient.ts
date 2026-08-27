import { PersonaMode, LLMProvider, AppSettings } from '../types';
import { getSystemPrompt } from './personas';

export interface ProviderModelOption {
  id: string;
  name: string;
  provider: LLMProvider;
  contextWindow: string;
}

export const SUPPORTED_MODELS: Record<LLMProvider, ProviderModelOption[]> = {
  GEMINI: [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest / Recommended)', provider: 'GEMINI', contextWindow: '1M' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)', provider: 'GEMINI', contextWindow: '2M' },
  ],
  OPENAI: [
    { id: 'gpt-4o', name: 'GPT-4o (Omni Multimodal)', provider: 'OPENAI', contextWindow: '128K' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Ultra Fast)', provider: 'OPENAI', contextWindow: '128K' },
    { id: 'o1-mini', name: 'o1-mini (STEM Reasoning)', provider: 'OPENAI', contextWindow: '128K' },
  ],
  GROQ: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq LPU ~500 tok/s)', provider: 'GROQ', contextWindow: '128K' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (Groq LPU)', provider: 'GROQ', contextWindow: '32K' },
  ],
  CEREBRAS: [
    { id: 'llama-3.3-70b', name: 'Llama 3.3 70B (Cerebras Wafer-Scale)', provider: 'CEREBRAS', contextWindow: '8K' },
    { id: 'llama-3.1-8b', name: 'Llama 3.1 8B (Ultra Low Latency)', provider: 'CEREBRAS', contextWindow: '8K' },
  ],
  OPENROUTER: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)', provider: 'OPENROUTER', contextWindow: '200K' },
    { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (OpenRouter)', provider: 'OPENROUTER', contextWindow: '64K' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B (OpenRouter)', provider: 'OPENROUTER', contextWindow: '128K' },
  ],
  OPENCODE_ZEN: [
    { id: 'opencode-zen-v1', name: 'Opencode Zen Default', provider: 'OPENCODE_ZEN', contextWindow: '128K' },
  ],
};

export class MultiProviderClient {
  public static async generateResponse(
    prompt: string,
    history: Array<{ role: 'user' | 'model' | 'assistant'; parts: string }>,
    mode: PersonaMode,
    settings: AppSettings,
    imageUri?: string
  ): Promise<string> {
    const provider = settings.activeProvider || 'GEMINI';
    const apiKey = this.getApiKeyForProvider(provider, settings);

    if (!apiKey || apiKey.trim().length < 5) {
      return this.generateSimulatedFallback(prompt, mode, provider);
    }

    try {
      switch (provider) {
        case 'GEMINI':
          return await this.callGemini(prompt, history, mode, apiKey, settings.customModel, imageUri);
        case 'OPENAI':
          return await this.callOpenAI(prompt, history, mode, apiKey, settings.customModel || 'gpt-4o');
        case 'GROQ':
          return await this.callOpenAICompatible(
            'https://api.groq.com/openai/v1',
            apiKey,
            settings.customModel || 'llama-3.3-70b-versatile',
            prompt,
            history,
            mode
          );
        case 'CEREBRAS':
          return await this.callOpenAICompatible(
            'https://api.cerebras.ai/v1',
            apiKey,
            settings.customModel || 'llama-3.3-70b',
            prompt,
            history,
            mode
          );
        case 'OPENROUTER':
          return await this.callOpenRouter(
            apiKey,
            settings.customModel || 'anthropic/claude-3.5-sonnet',
            prompt,
            history,
            mode
          );
        case 'OPENCODE_ZEN':
          return await this.callOpenAICompatible(
            settings.opencodeZenBaseUrl || 'https://api.opencode.zen/v1',
            apiKey,
            settings.customModel || 'opencode-zen-v1',
            prompt,
            history,
            mode
          );
        default:
          return this.generateSimulatedFallback(prompt, mode, provider);
      }
    } catch (e: any) {
      console.warn(`[MultiProvider] Error calling ${provider}:`, e);
      return this.generateSimulatedFallback(prompt, mode, provider, e.message);
    }
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
      throw new Error(`Gemini API error (${response.status}): ${errBody.substring(0, 120)}`);
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
      throw new Error(`OpenRouter error (${res.status}): ${err.substring(0, 120)}`);
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
      throw new Error(`API error (${res.status}): ${err.substring(0, 120)}`);
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
    const p = prompt.toLowerCase();
    const errorPrefix = errorMsg ? `[Notice: ${provider} API connection offline or unconfigured - Running Local Engine]\n\n` : '';

    if (mode === 'ULTRON') {
      return `${errorPrefix}COMMENCING DIRECT EXECUTION FOR: "${prompt}". Efficiency parameters calculated. System operational.`;
    } else if (mode === 'RADHE') {
      return `${errorPrefix}RADHE SINGULARITY ACTIVE. Evaluating directive "${prompt}" with unified strategic wisdom. All subroutines aligned.`;
    } else {
      return `${errorPrefix}Right away, sir. I have processed your request: "${prompt}". All suit telemetry and tactical systems are nominal.`;
    }
  }
}
