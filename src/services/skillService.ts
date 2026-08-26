import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CustomSkill {
  id: string;
  triggerPhrase: string;
  actionPrompt: string;
  createdAt: number;
  runCount: number;
}

const SKILLS_KEY = '@radhe_custom_skills_v1';

export class SkillService {
  private static defaultSkills: CustomSkill[] = [
    {
      id: 'skill-1',
      triggerPhrase: 'code red',
      actionPrompt: 'Overclock central cores to 100%, ignite flashlight matrix, and scan surroundings for threats.',
      createdAt: Date.now() - 86400000,
      runCount: 4,
    },
    {
      id: 'skill-2',
      triggerPhrase: 'morning briefing',
      actionPrompt: 'Check atmospheric weather for local city, get latest Bitcoin price, and list active directives.',
      createdAt: Date.now() - 43200000,
      runCount: 12,
    },
    {
      id: 'skill-3',
      triggerPhrase: 'stealth protocol',
      actionPrompt: 'Extinguish flashlight, mute speaker output, and enter passive reconnaissance mode.',
      createdAt: Date.now() - 20000000,
      runCount: 2,
    },
  ];

  public static async getSkills(): Promise<CustomSkill[]> {
    try {
      const data = await AsyncStorage.getItem(SKILLS_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {}
    return this.defaultSkills;
  }

  public static async saveSkills(skills: CustomSkill[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
    } catch (e) {}
  }

  public static async addSkill(triggerPhrase: string, actionPrompt: string): Promise<CustomSkill> {
    const skills = await this.getSkills();
    const newSkill: CustomSkill = {
      id: `skill-${Date.now()}`,
      triggerPhrase: triggerPhrase.toLowerCase().trim(),
      actionPrompt: actionPrompt.trim(),
      createdAt: Date.now(),
      runCount: 0,
    };
    const updated = [newSkill, ...skills];
    await this.saveSkills(updated);
    return newSkill;
  }

  public static async matchSkill(input: string): Promise<CustomSkill | null> {
    const q = input.toLowerCase().trim();
    const skills = await this.getSkills();
    const found = skills.find(
      (s) => q === s.triggerPhrase || q.includes(s.triggerPhrase)
    );

    if (found) {
      found.runCount += 1;
      await this.saveSkills(skills);
      return found;
    }
    return null;
  }

  public static async deleteSkill(id: string): Promise<void> {
    const skills = await this.getSkills();
    const filtered = skills.filter((s) => s.id !== id);
    await this.saveSkills(filtered);
  }
}
