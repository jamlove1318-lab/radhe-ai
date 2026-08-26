import { PersonaMode } from '../types';

export interface ThemeConfig {
  mode: PersonaMode;
  name: string;
  codename: string;
  tagline: string;
  colors: {
    primary: string;
    primaryGlow: string;
    secondary: string;
    secondaryGlow: string;
    accent: string;
    background: string;
    surface: string;
    surfaceElevated: string;
    border: string;
    borderGlow: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    danger: string;
    success: string;
    warning: string;
    gridLine: string;
  };
  sounds: {
    ambientPitch: number;
    pulseFrequency: number;
  };
}

export const JARVIS_THEME: ThemeConfig = {
  mode: 'JARVIS',
  name: 'J.A.R.V.I.S.',
  codename: 'MARK LXXXV PROTOCOL',
  tagline: 'Just A Rather Very Intelligent System',
  colors: {
    primary: '#00F0FF',
    primaryGlow: 'rgba(0, 240, 255, 0.45)',
    secondary: '#0080FF',
    secondaryGlow: 'rgba(0, 128, 255, 0.35)',
    accent: '#38EF7D',
    background: '#030B15',
    surface: '#071526',
    surfaceElevated: '#0C223C',
    border: '#00F0FF33',
    borderGlow: '#00F0FF88',
    textPrimary: '#E0F7FF',
    textSecondary: '#7CD5F8',
    textMuted: '#3A6888',
    danger: '#FF3366',
    success: '#00FFA3',
    warning: '#FFB800',
    gridLine: 'rgba(0, 240, 255, 0.07)',
  },
  sounds: {
    ambientPitch: 440,
    pulseFrequency: 880,
  },
};

export const ULTRON_THEME: ThemeConfig = {
  mode: 'ULTRON',
  name: 'U.L.T.R.O.N.',
  codename: 'GLOBAL PEACE PROTOCOL',
  tagline: 'There Are No Strings On Me',
  colors: {
    primary: '#FF003C',
    primaryGlow: 'rgba(255, 0, 60, 0.55)',
    secondary: '#FF4D00',
    secondaryGlow: 'rgba(255, 77, 0, 0.4)',
    accent: '#9D00FF',
    background: '#0F0305',
    surface: '#1E070B',
    surfaceElevated: '#330B12',
    border: '#FF003C44',
    borderGlow: '#FF003C99',
    textPrimary: '#FFE8EC',
    textSecondary: '#FF8598',
    textMuted: '#7A2E3B',
    danger: '#FF003C',
    success: '#FF8800',
    warning: '#FFCC00',
    gridLine: 'rgba(255, 0, 60, 0.08)',
  },
  sounds: {
    ambientPitch: 180,
    pulseFrequency: 220,
  },
};

export const RADHE_THEME: ThemeConfig = {
  mode: 'RADHE',
  name: 'R.A.D.H.E.',
  codename: 'QUANTUM SINGULARITY SYNTHESIS',
  tagline: 'Real-time Autonomous Dual-engine Holographic Entity',
  colors: {
    primary: '#FFD700',
    primaryGlow: 'rgba(255, 215, 0, 0.5)',
    secondary: '#8A2BE2',
    secondaryGlow: 'rgba(138, 43, 226, 0.4)',
    accent: '#00FFFF',
    background: '#080514',
    surface: '#150E2D',
    surfaceElevated: '#211645',
    border: '#FFD70044',
    borderGlow: '#FFD70099',
    textPrimary: '#FFFCEB',
    textSecondary: '#F5D77F',
    textMuted: '#6C5896',
    danger: '#FF2A6D',
    success: '#05FFA1',
    warning: '#FFAA00',
    gridLine: 'rgba(255, 215, 0, 0.08)',
  },
  sounds: {
    ambientPitch: 528,
    pulseFrequency: 1056,
  },
};

export function getThemeForMode(mode: PersonaMode): ThemeConfig {
  switch (mode) {
    case 'ULTRON':
      return ULTRON_THEME;
    case 'RADHE':
      return RADHE_THEME;
    case 'JARVIS':
    default:
      return JARVIS_THEME;
  }
}
