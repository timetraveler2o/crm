import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 
  | 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' 
  | 'lavender' | 'cherry' | 'emerald' | 'slate' | 'amber'
  | 'rose' | 'teal' | 'indigo' | 'copper' | 'arctic'
  | 'galaxy' | 'aurora' | 'neon' | 'coffee' | 'navy'
  | 'cyberpunk' | 'nordic' | 'glassmorphism' | 'coral' | 'mint' | 'obsidian' | 'volcano';

export interface ThemeColors {
  sidebar: string;
  sidebarText: string;
  sidebarActive: string;
  sidebarHover: string;
  primary: string;
  primaryHover: string;
  accent: string;
  headerBg: string;
  headerBorder: string;
  backgroundImage?: string;
  contentBg?: string;
}

export const THEMES: Record<ThemeName, { label: string; colors: ThemeColors; preview: string }> = {
  default: {
    label: 'Default Dark',
    preview: '#111827',
    colors: { sidebar: '#111827', sidebarText: '#d1d5db', sidebarActive: 'rgba(255,255,255,0.15)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#2563eb', primaryHover: '#1d4ed8', accent: '#4f46e5', headerBg: '#ffffff', headerBorder: '#e5e7eb' }
  },
  ocean: {
    label: 'Ocean Blue',
    preview: '#0c4a6e',
    colors: { sidebar: '#0c4a6e', sidebarText: '#bae6fd', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#0284c7', primaryHover: '#0369a1', accent: '#06b6d4', headerBg: '#f0f9ff', headerBorder: '#bae6fd' }
  },
  forest: {
    label: 'Forest Green',
    preview: '#14532d',
    colors: { sidebar: '#14532d', sidebarText: '#bbf7d0', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#16a34a', primaryHover: '#15803d', accent: '#22c55e', headerBg: '#f0fdf4', headerBorder: '#bbf7d0' }
  },
  sunset: {
    label: 'Sunset Orange',
    preview: '#7c2d12',
    colors: { sidebar: '#7c2d12', sidebarText: '#fed7aa', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#ea580c', primaryHover: '#c2410c', accent: '#f97316', headerBg: '#fff7ed', headerBorder: '#fed7aa' }
  },
  midnight: {
    label: 'Midnight Purple',
    preview: '#1e1b4b',
    colors: { sidebar: '#1e1b4b', sidebarText: '#c4b5fd', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#7c3aed', primaryHover: '#6d28d9', accent: '#8b5cf6', headerBg: '#faf5ff', headerBorder: '#ddd6fe' }
  },
  lavender: {
    label: 'Lavender',
    preview: '#581c87',
    colors: { sidebar: '#581c87', sidebarText: '#e9d5ff', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#9333ea', primaryHover: '#7e22ce', accent: '#a855f7', headerBg: '#faf5ff', headerBorder: '#e9d5ff' }
  },
  cherry: {
    label: 'Cherry Red',
    preview: '#7f1d1d',
    colors: { sidebar: '#7f1d1d', sidebarText: '#fecaca', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#dc2626', primaryHover: '#b91c1c', accent: '#ef4444', headerBg: '#fef2f2', headerBorder: '#fecaca' }
  },
  emerald: {
    label: 'Emerald',
    preview: '#064e3b',
    colors: { sidebar: '#064e3b', sidebarText: '#a7f3d0', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#059669', primaryHover: '#047857', accent: '#10b981', headerBg: '#ecfdf5', headerBorder: '#a7f3d0' }
  },
  slate: {
    label: 'Slate Gray',
    preview: '#1e293b',
    colors: { sidebar: '#1e293b', sidebarText: '#cbd5e1', sidebarActive: 'rgba(255,255,255,0.15)', sidebarHover: 'rgba(255,255,255,0.08)', primary: '#475569', primaryHover: '#334155', accent: '#64748b', headerBg: '#f8fafc', headerBorder: '#e2e8f0' }
  },
  amber: {
    label: 'Amber Gold',
    preview: '#78350f',
    colors: { sidebar: '#78350f', sidebarText: '#fde68a', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#d97706', primaryHover: '#b45309', accent: '#f59e0b', headerBg: '#fffbeb', headerBorder: '#fde68a' }
  },
  rose: {
    label: 'Rose Pink',
    preview: '#881337',
    colors: { sidebar: '#881337', sidebarText: '#fecdd3', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#e11d48', primaryHover: '#be123c', accent: '#f43f5e', headerBg: '#fff1f2', headerBorder: '#fecdd3' }
  },
  teal: {
    label: 'Teal',
    preview: '#134e4a',
    colors: { sidebar: '#134e4a', sidebarText: '#99f6e4', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#0d9488', primaryHover: '#0f766e', accent: '#14b8a6', headerBg: '#f0fdfa', headerBorder: '#99f6e4' }
  },
  indigo: {
    label: 'Indigo',
    preview: '#312e81',
    colors: { sidebar: '#312e81', sidebarText: '#c7d2fe', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#4f46e5', primaryHover: '#4338ca', accent: '#6366f1', headerBg: '#eef2ff', headerBorder: '#c7d2fe' }
  },
  copper: {
    label: 'Copper',
    preview: '#44403c',
    colors: { sidebar: '#44403c', sidebarText: '#d6d3d1', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#a16207', primaryHover: '#854d0e', accent: '#ca8a04', headerBg: '#fefce8', headerBorder: '#fef08a' }
  },
  arctic: {
    label: 'Arctic',
    preview: '#0f172a',
    colors: { sidebar: '#0f172a', sidebarText: '#e0f2fe', sidebarActive: 'rgba(56,189,248,0.2)', sidebarHover: 'rgba(56,189,248,0.1)', primary: '#0ea5e9', primaryHover: '#0284c7', accent: '#38bdf8', headerBg: '#f0f9ff', headerBorder: '#bae6fd' }
  },
  galaxy: {
    label: '🌌 Galaxy',
    preview: '#0f0c29',
    colors: { sidebar: 'linear-gradient(180deg,#0f0c29,#302b63,#24243e)', sidebarText: '#c4b5fd', sidebarActive: 'rgba(139,92,246,0.3)', sidebarHover: 'rgba(139,92,246,0.15)', primary: '#7c3aed', primaryHover: '#6d28d9', accent: '#a78bfa', headerBg: 'rgba(15,12,41,0.97)', headerBorder: 'rgba(139,92,246,0.3)' }
  },
  aurora: {
    label: '🌈 Aurora',
    preview: '#065f46',
    colors: { sidebar: 'linear-gradient(180deg,#064e3b,#065f46,#0e7490)', sidebarText: '#a7f3d0', sidebarActive: 'rgba(52,211,153,0.25)', sidebarHover: 'rgba(52,211,153,0.12)', primary: '#059669', primaryHover: '#047857', accent: '#34d399', headerBg: '#f0fdf4', headerBorder: '#a7f3d0' }
  },
  neon: {
    label: '⚡ Neon',
    preview: '#0d0d0d',
    colors: { sidebar: '#0d0d0d', sidebarText: '#00ff88', sidebarActive: 'rgba(0,255,136,0.15)', sidebarHover: 'rgba(0,255,136,0.08)', primary: '#00ff88', primaryHover: '#00cc6a', accent: '#00ffcc', headerBg: '#111', headerBorder: 'rgba(0,255,136,0.2)' }
  },
  coffee: {
    label: '☕ Coffee',
    preview: '#3c1a0a',
    colors: { sidebar: '#3c1a0a', sidebarText: '#fef3c7', sidebarActive: 'rgba(245,158,11,0.25)', sidebarHover: 'rgba(245,158,11,0.1)', primary: '#b45309', primaryHover: '#92400e', accent: '#f59e0b', headerBg: '#fef9f0', headerBorder: '#fde68a' }
  },
  navy: {
    label: '🌊 Navy',
    preview: '#001f3f',
    colors: { sidebar: '#001f3f', sidebarText: '#93c5fd', sidebarActive: 'rgba(59,130,246,0.25)', sidebarHover: 'rgba(59,130,246,0.1)', primary: '#1d4ed8', primaryHover: '#1e40af', accent: '#3b82f6', headerBg: '#eff6ff', headerBorder: '#bfdbfe' }
  },
  cyberpunk: {
    label: '🤖 Cyberpunk',
    preview: '#0d0221',
    colors: { sidebar: '#0d0221', sidebarText: '#f0abfc', sidebarActive: 'rgba(232,121,249,0.2)', sidebarHover: 'rgba(232,121,249,0.1)', primary: '#e879f9', primaryHover: '#d946ef', accent: '#22d3ee', headerBg: '#0d0221', headerBorder: 'rgba(232,121,249,0.3)' }
  },
  nordic: {
    label: '❄️ Nordic',
    preview: '#2e3440',
    colors: { sidebar: '#2e3440', sidebarText: '#d8dee9', sidebarActive: 'rgba(136,192,208,0.25)', sidebarHover: 'rgba(136,192,208,0.12)', primary: '#5e81ac', primaryHover: '#4c6fa5', accent: '#88c0d0', headerBg: '#eceff4', headerBorder: '#d8dee9' }
  },
  glassmorphism: {
    label: '💎 Glass',
    preview: '#1a1a2e',
    colors: { sidebar: 'rgba(26,26,46,0.85)', sidebarText: '#e2d9f3', sidebarActive: 'rgba(167,139,250,0.25)', sidebarHover: 'rgba(167,139,250,0.12)', primary: '#a78bfa', primaryHover: '#8b5cf6', accent: '#c084fc', headerBg: 'rgba(255,255,255,0.85)', headerBorder: 'rgba(167,139,250,0.3)' }
  },
  coral: {
    label: '🪸 Coral',
    preview: '#7c1d1d',
    colors: { sidebar: '#7c1d1d', sidebarText: '#fcd9c7', sidebarActive: 'rgba(255,111,97,0.25)', sidebarHover: 'rgba(255,111,97,0.12)', primary: '#ff6f61', primaryHover: '#e5635a', accent: '#ff8c7f', headerBg: '#fff5f3', headerBorder: '#fcd9c7' }
  },
  mint: {
    label: '🌿 Mint',
    preview: '#065f46',
    colors: { sidebar: '#065f46', sidebarText: '#a7f3d0', sidebarActive: 'rgba(52,211,153,0.25)', sidebarHover: 'rgba(52,211,153,0.12)', primary: '#10b981', primaryHover: '#059669', accent: '#6ee7b7', headerBg: '#f0fdf4', headerBorder: '#a7f3d0' }
  },
  obsidian: {
    label: '🖤 Obsidian',
    preview: '#09090b',
    colors: { sidebar: '#09090b', sidebarText: '#a1a1aa', sidebarActive: 'rgba(161,161,170,0.15)', sidebarHover: 'rgba(161,161,170,0.08)', primary: '#71717a', primaryHover: '#52525b', accent: '#a1a1aa', headerBg: '#fafafa', headerBorder: '#e4e4e7' }
  },
  volcano: {
    label: '🌋 Volcano',
    preview: '#431407',
    colors: { sidebar: '#431407', sidebarText: '#fed7aa', sidebarActive: 'rgba(251,146,60,0.25)', sidebarHover: 'rgba(251,146,60,0.12)', primary: '#f97316', primaryHover: '#ea580c', accent: '#fb923c', headerBg: '#fff7ed', headerBorder: '#fed7aa' }
  },
};

interface ThemeState {
  currentTheme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: 'default',
      setTheme: (theme) => {
        set({ currentTheme: theme });
        applyTheme(theme);
      },
    }),
    { name: 'crm-theme' }
  )
);

export function applyTheme(themeName: ThemeName) {
  const theme = THEMES[themeName];
  if (!theme) return;
  const root = document.documentElement;
  root.style.setProperty('--sidebar-bg', theme.colors.sidebar);
  root.style.setProperty('--sidebar-text', theme.colors.sidebarText);
  root.style.setProperty('--sidebar-active', theme.colors.sidebarActive);
  root.style.setProperty('--sidebar-hover', theme.colors.sidebarHover);
  root.style.setProperty('--primary', theme.colors.primary);
  root.style.setProperty('--primary-hover', theme.colors.primaryHover);
  root.style.setProperty('--accent', theme.colors.accent);
  root.style.setProperty('--header-bg', theme.colors.headerBg);
  root.style.setProperty('--header-border', theme.colors.headerBorder);
  root.style.setProperty('--content-bg', theme.colors.contentBg || '#f9fafb');
  if (theme.colors.backgroundImage) {
    root.style.setProperty('--bg-image', `url(${theme.colors.backgroundImage})`);
  } else {
    root.style.setProperty('--bg-image', 'none');
  }
}

// Initialize theme on load
export function initTheme() {
  try {
    const stored = localStorage.getItem('crm-theme');
    if (stored) {
      const parsed = JSON.parse(stored);
      const theme = parsed.state?.currentTheme || 'default';
      applyTheme(theme as ThemeName);
    }
  } catch { /* ignore */ }
}
