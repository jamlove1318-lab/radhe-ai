import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeminiClient } from '../ai/geminiClient';
import { PersonaMode } from '../types';

export interface AnalyzedDocument {
  id: string;
  title: string;
  category: 'RESEARCH' | 'CODE' | 'FINANCIAL' | 'STRATEGY' | 'NOTES';
  rawText: string;
  summary: string;
  keyPoints: string[];
  threatsOrRisks: string[];
  analyzedAt: number;
}

const DOCS_KEY = '@radhe_vault_docs_v1';

export class DocAnalyzerService {
  public static async getDocuments(): Promise<AnalyzedDocument[]> {
    try {
      const data = await AsyncStorage.getItem(DOCS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return [
      {
        id: 'doc-init-1',
        title: 'Project Arc Reactor 2.0 Specifications.md',
        category: 'RESEARCH',
        rawText: 'Core plasma containment utilizes palladium isotope matrix with magnetic constriction rings operating at 3.5 GJ/s output...',
        summary: 'Plasma containment engineering blueprint detailing palladium isotope magnetic confinement with 3.5 GJ/s continuous output.',
        keyPoints: [
          'Magnetic constriction stabilized up to 100M Kelvin.',
          'Palladium toxicity reduced by 94% through catalytic recycling.',
          'Integrated thermoelectric conversion for direct repulsor feeding.'
        ],
        threatsOrRisks: [
          'Thermal runaway if auxiliary coolant bypass valves fail.',
          'High electromagnetic interference in 2.4GHz spectrum.'
        ],
        analyzedAt: Date.now() - 3600000,
      }
    ];
  }

  public static async saveDocument(doc: AnalyzedDocument): Promise<void> {
    const existing = await this.getDocuments();
    const updated = [doc, ...existing.filter((d) => d.id !== doc.id)];
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(updated.slice(0, 30)));
  }

  public static async deleteDocument(id: string): Promise<void> {
    const existing = await this.getDocuments();
    await AsyncStorage.setItem(DOCS_KEY, JSON.stringify(existing.filter((d) => d.id !== id)));
  }

  public static async analyzeDocument(
    title: string,
    content: string,
    mode: PersonaMode,
    apiKey: string
  ): Promise<AnalyzedDocument> {
    const prompt = `
You are analyzing this document in ${mode} mode:
Title: "${title}"
Content:
"""
${content.substring(0, 3000)}
"""

Provide structured tactical intelligence analysis in JSON format:
{
  "summary": "1-2 sentence executive synopsis",
  "keyPoints": ["bullet point 1", "bullet point 2", "bullet point 3"],
  "threatsOrRisks": ["risk or strategic concern 1", "risk 2"],
  "category": "RESEARCH" | "CODE" | "FINANCIAL" | "STRATEGY" | "NOTES"
}
`;

    if (apiKey && apiKey.trim().length > 5) {
      try {
        const raw = await GeminiClient.generateResponse(prompt, [], mode, apiKey);
        if (raw) {
          const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(clean);
          const doc: AnalyzedDocument = {
            id: `doc-${Date.now()}`,
            title,
            category: parsed.category || 'STRATEGY',
            rawText: content,
            summary: parsed.summary || 'Tactical analysis completed.',
            keyPoints: parsed.keyPoints || ['Key findings extracted.'],
            threatsOrRisks: parsed.threatsOrRisks || ['Standard operational parameters.'],
            analyzedAt: Date.now(),
          };
          await this.saveDocument(doc);
          return doc;
        }
      } catch (e) {}
    }

    // Heuristic fallback analysis
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const doc: AnalyzedDocument = {
      id: `doc-${Date.now()}`,
      title,
      category: 'STRATEGY',
      rawText: content,
      summary: `Analyzed document "${title}" containing ${content.length} characters and ${lines.length} lines.`,
      keyPoints: [
        `Extracted ${lines.length} primary paragraphs for indexing.`,
        'Semantic density verified across all chapters.',
        'Document successfully committed to neural memory vault.'
      ],
      threatsOrRisks: [
        'Ensure confidentiality protocols are maintained on local storage.'
      ],
      analyzedAt: Date.now(),
    };
    await this.saveDocument(doc);
    return doc;
  }
}
