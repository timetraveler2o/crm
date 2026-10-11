import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeName = 
  | 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' 
  | 'lavender' | 'cherry' | 'emerald' | 'slate' | 'amber'
  | 'rose' | 'teal' | 'indigo' | 'copper' | 'arctic'
  | 'galaxy' | 'aurora' | 'neon' | 'coffee' | 'navy'
  | 'cyberpunk' | 'nordic' | 'glassmorphism' | 'coral' | 'mint' | 'obsidian' | 'volcano'
  // Background image themes (4K wallpapers)
  | 'wp1' | 'wp2' | 'wp3' | 'wp4' | 'wp5' | 'wp6' | 'wp7' | 'wp8' | 'wp9' | 'wp10'
  | 'wp11' | 'wp12' | 'wp13' | 'wp14' | 'wp15' | 'wp16' | 'wp17' | 'wp18' | 'wp19' | 'wp20'
  | 'wp21' | 'wp22' | 'wp23' | 'wp24' | 'wp25' | 'wp26' | 'wp27' | 'wp28' | 'wp29' | 'wp30';

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
  // Background wallpaper themes (4K)
  wp1: { label: 'Beach Sunset', preview: '#0d1117', colors: { sidebar: 'rgba(13,17,23,0.92)', sidebarText: '#c9d1d9', sidebarActive: 'rgba(255,255,255,0.2)', sidebarHover: 'rgba(255,255,255,0.1)', primary: '#58a6ff', primaryHover: '#1f6feb', accent: '#79c0ff', headerBg: 'rgba(13,17,23,0.92)', headerBorder: 'rgba(48,54,61,0.8)', backgroundImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?cs=srgb&dl=pexels-simon73-1323550.jpg&fm=jpg', contentBg: 'rgba(13,17,23,0.72)' } },
  wp2: { label: 'Mountain View', preview: '#0a0a1a', colors: { sidebar: 'rgba(10,10,26,0.92)', sidebarText: '#c4b5fd', sidebarActive: 'rgba(139,92,246,0.3)', sidebarHover: 'rgba(139,92,246,0.15)', primary: '#a78bfa', primaryHover: '#7c3aed', accent: '#c084fc', headerBg: 'rgba(10,10,26,0.92)', headerBorder: 'rgba(139,92,246,0.3)', backgroundImage: 'https://m.media-amazon.com/images/I/81V2hzNkcsL._AC_UF894,1000_QL80_.jpg', contentBg: 'rgba(10,10,26,0.72)' } },
  wp3: { label: 'Nature HD', preview: '#060616', colors: { sidebar: 'rgba(6,6,22,0.92)', sidebarText: '#bfdbfe', sidebarActive: 'rgba(59,130,246,0.3)', sidebarHover: 'rgba(59,130,246,0.15)', primary: '#3b82f6', primaryHover: '#2563eb', accent: '#60a5fa', headerBg: 'rgba(6,6,22,0.92)', headerBorder: 'rgba(59,130,246,0.3)', backgroundImage: 'https://static.vecteezy.com/system/resources/thumbnails/049/855/471/small/nature-background-high-resolution-wallpaper-for-a-serene-and-stunning-view-free-photo.jpg', contentBg: 'rgba(6,6,22,0.72)' } },
  wp4: { label: 'Green Valley', preview: '#050514', colors: { sidebar: 'rgba(5,5,20,0.92)', sidebarText: '#e9d5ff', sidebarActive: 'rgba(167,139,250,0.3)', sidebarHover: 'rgba(167,139,250,0.15)', primary: '#8b5cf6', primaryHover: '#7c3aed', accent: '#a78bfa', headerBg: 'rgba(5,5,20,0.92)', headerBorder: 'rgba(167,139,250,0.3)', backgroundImage: 'https://cdn.magicdecor.in/com/2022/10/30064310/792172873_a-1.jpg', contentBg: 'rgba(5,5,20,0.72)' } },
  wp5: { label: 'Amazon Forest', preview: '#0a0a0a', colors: { sidebar: 'rgba(10,10,10,0.92)', sidebarText: '#a7f3d0', sidebarActive: 'rgba(52,211,153,0.25)', sidebarHover: 'rgba(52,211,153,0.12)', primary: '#10b981', primaryHover: '#059669', accent: '#34d399', headerBg: 'rgba(10,10,10,0.92)', headerBorder: 'rgba(52,211,153,0.3)', backgroundImage: 'https://m.media-amazon.com/images/I/71wE3kw7obL._AC_UF894,1000_QL80_.jpg', contentBg: 'rgba(10,10,10,0.72)' } },
  wp6: { label: 'Serene View', preview: '#0c1a2a', colors: { sidebar: 'rgba(12,26,42,0.92)', sidebarText: '#bae6fd', sidebarActive: 'rgba(14,165,233,0.25)', sidebarHover: 'rgba(14,165,233,0.12)', primary: '#0ea5e9', primaryHover: '#0284c7', accent: '#38bdf8', headerBg: 'rgba(12,26,42,0.92)', headerBorder: 'rgba(14,165,233,0.3)', backgroundImage: 'https://static.vecteezy.com/system/resources/previews/049/855/259/non_2x/nature-background-high-resolution-wallpaper-for-a-serene-and-stunning-view-photo.jpg', contentBg: 'rgba(12,26,42,0.72)' } },
  wp7: { label: 'Gradient Blur', preview: '#2d1b00', colors: { sidebar: 'rgba(45,27,0,0.92)', sidebarText: '#fed7aa', sidebarActive: 'rgba(251,146,60,0.25)', sidebarHover: 'rgba(251,146,60,0.12)', primary: '#f97316', primaryHover: '#ea580c', accent: '#fb923c', headerBg: 'rgba(45,27,0,0.92)', headerBorder: 'rgba(251,146,60,0.3)', backgroundImage: 'https://img.freepik.com/premium-photo/abstract-gradient-blurred-background_753751-1511.jpg?semt=ais_hybrid&w=740&q=80', contentBg: 'rgba(45,27,0,0.72)' } },
  wp8: { label: 'Blue Abstract', preview: '#0a1a0a', colors: { sidebar: 'rgba(10,26,10,0.92)', sidebarText: '#bbf7d0', sidebarActive: 'rgba(74,222,128,0.25)', sidebarHover: 'rgba(74,222,128,0.12)', primary: '#22c55e', primaryHover: '#16a34a', accent: '#4ade80', headerBg: 'rgba(10,26,10,0.92)', headerBorder: 'rgba(74,222,128,0.3)', backgroundImage: 'https://marketplace.canva.com/EAGQ4hBhXII/1/0/1600w/canva-blue-abstract-desktop-wallpaper-htGu4av79Lo.jpg', contentBg: 'rgba(10,26,10,0.72)' } },
  wp9: { label: 'Retro Sunset', preview: '#1a0a2e', colors: { sidebar: 'rgba(26,10,46,0.92)', sidebarText: '#f5d0fe', sidebarActive: 'rgba(232,121,249,0.25)', sidebarHover: 'rgba(232,121,249,0.12)', primary: '#e879f9', primaryHover: '#d946ef', accent: '#f0abfc', headerBg: 'rgba(26,10,46,0.92)', headerBorder: 'rgba(232,121,249,0.3)', backgroundImage: 'https://wallpapers-clan.com/wp-content/uploads/2026/02/lofi-datsun-240z-palm-trees-retro-sunset-desktop-wallpaper-cover.jpg', contentBg: 'rgba(26,10,46,0.72)' } },
  wp10: { label: 'White Texture', preview: '#1a0f0a', colors: { sidebar: 'rgba(26,15,10,0.92)', sidebarText: '#fef3c7', sidebarActive: 'rgba(245,158,11,0.25)', sidebarHover: 'rgba(245,158,11,0.12)', primary: '#d97706', primaryHover: '#b45309', accent: '#fbbf24', headerBg: 'rgba(26,15,10,0.92)', headerBorder: 'rgba(245,158,11,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20240102/pngtree-sophisticated-white-texture-for-a-stunning-background-design-image_13888242.png', contentBg: 'rgba(26,15,10,0.72)' } },
  wp11: { label: 'Gold Luxury', preview: '#0a1a10', colors: { sidebar: 'rgba(10,26,16,0.92)', sidebarText: '#d1fae5', sidebarActive: 'rgba(16,185,129,0.25)', sidebarHover: 'rgba(16,185,129,0.12)', primary: '#059669', primaryHover: '#047857', accent: '#10b981', headerBg: 'rgba(10,26,16,0.92)', headerBorder: 'rgba(16,185,129,0.3)', backgroundImage: 'https://static.vecteezy.com/system/resources/previews/050/521/346/non_2x/abstract-white-gray-luxury-background-with-gold-lines-wallpaper-vector.jpg', contentBg: 'rgba(10,26,16,0.72)' } },
  wp12: { label: 'Purple Glow', preview: '#050f14', colors: { sidebar: 'rgba(5,15,20,0.92)', sidebarText: '#99f6e4', sidebarActive: 'rgba(45,212,191,0.25)', sidebarHover: 'rgba(45,212,191,0.12)', primary: '#14b8a6', primaryHover: '#0d9488', accent: '#2dd4bf', headerBg: 'rgba(5,15,20,0.92)', headerBorder: 'rgba(45,212,191,0.3)', backgroundImage: 'https://4kwallpapers.com/images/wallpapers/purple-aesthetic--25858.jpg', contentBg: 'rgba(5,15,20,0.72)' } },
  wp13: { label: 'Blue Veils', preview: '#1a0a00', colors: { sidebar: 'rgba(26,10,0,0.92)', sidebarText: '#fde68a', sidebarActive: 'rgba(234,179,8,0.25)', sidebarHover: 'rgba(234,179,8,0.12)', primary: '#ca8a04', primaryHover: '#a16207', accent: '#eab308', headerBg: 'rgba(26,10,0,0.92)', headerBorder: 'rgba(234,179,8,0.3)', backgroundImage: 'https://thumbs.dreamstime.com/b/abstract-background-blue-veils-10377888.jpg', contentBg: 'rgba(26,10,0,0.72)' } },
  wp14: { label: 'Mountain Lake', preview: '#050f1a', colors: { sidebar: 'rgba(5,15,26,0.92)', sidebarText: '#e0f2fe', sidebarActive: 'rgba(56,189,248,0.25)', sidebarHover: 'rgba(56,189,248,0.12)', primary: '#0ea5e9', primaryHover: '#0284c7', accent: '#38bdf8', headerBg: 'rgba(5,15,26,0.92)', headerBorder: 'rgba(56,189,248,0.3)', backgroundImage: 'https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg?semt=ais_hybrid&w=740&q=80', contentBg: 'rgba(5,15,26,0.72)' } },
  wp15: { label: 'Coastal', preview: '#1a0500', colors: { sidebar: 'rgba(26,5,0,0.92)', sidebarText: '#fed7aa', sidebarActive: 'rgba(251,146,60,0.25)', sidebarHover: 'rgba(251,146,60,0.12)', primary: '#ef4444', primaryHover: '#dc2626', accent: '#f87171', headerBg: 'rgba(26,5,0,0.92)', headerBorder: 'rgba(239,68,68,0.3)', backgroundImage: 'https://wallpapershome.com/images/pages/ico_h/29704.jpg', contentBg: 'rgba(26,5,0,0.72)' } },
  wp16: { label: 'Easter Eggs', preview: '#000d1a', colors: { sidebar: 'rgba(0,13,26,0.92)', sidebarText: '#bae6fd', sidebarActive: 'rgba(14,165,233,0.25)', sidebarHover: 'rgba(14,165,233,0.12)', primary: '#0284c7', primaryHover: '#0369a1', accent: '#38bdf8', headerBg: 'rgba(0,13,26,0.92)', headerBorder: 'rgba(14,165,233,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20260314/pngtree-colorful-easter-eggs-with-polka-dots-and-stripes-in-lush-grass-image_21580193.webp', contentBg: 'rgba(0,13,26,0.72)' } },
  wp17: { label: 'Spring Eggs', preview: '#1a0010', colors: { sidebar: 'rgba(26,0,16,0.92)', sidebarText: '#fce7f3', sidebarActive: 'rgba(236,72,153,0.25)', sidebarHover: 'rgba(236,72,153,0.12)', primary: '#db2777', primaryHover: '#be185d', accent: '#f472b6', headerBg: 'rgba(26,0,16,0.92)', headerBorder: 'rgba(236,72,153,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20250319/pngtree-colorful-easter-eggs-in-grass-with-daisies-on-a-blurred-green-image_17102518.jpg', contentBg: 'rgba(26,0,16,0.72)' } },
  wp18: { label: 'White Bunny', preview: '#05050f', colors: { sidebar: 'rgba(5,5,15,0.92)', sidebarText: '#ddd6fe', sidebarActive: 'rgba(139,92,246,0.3)', sidebarHover: 'rgba(139,92,246,0.15)', primary: '#7c3aed', primaryHover: '#6d28d9', accent: '#a78bfa', headerBg: 'rgba(5,5,15,0.92)', headerBorder: 'rgba(139,92,246,0.3)', backgroundImage: 'https://static.vecteezy.com/system/resources/thumbnails/067/570/865/small/cute-white-bunny-rabbit-on-light-blue-wooden-table-background-photo.jpg', contentBg: 'rgba(5,5,15,0.72)' } },
  wp19: { label: 'Cute Rabbit', preview: '#1a0f00', colors: { sidebar: 'rgba(26,15,0,0.92)', sidebarText: '#fef08a', sidebarActive: 'rgba(234,179,8,0.25)', sidebarHover: 'rgba(234,179,8,0.12)', primary: '#eab308', primaryHover: '#ca8a04', accent: '#facc15', headerBg: 'rgba(26,15,0,0.92)', headerBorder: 'rgba(234,179,8,0.3)', backgroundImage: 'https://thumbs.dreamstime.com/b/cute-white-rabbit-blue-eyes-bokeh-background-just-adorable-behold-charming-enchanting-bright-adds-beauty-pure-365625223.jpg', contentBg: 'rgba(26,15,0,0.72)' } },
  wp20: { label: 'Dreamy Sky', preview: '#0a0a0a', colors: { sidebar: 'rgba(10,10,10,0.92)', sidebarText: '#e5e7eb', sidebarActive: 'rgba(229,231,235,0.15)', sidebarHover: 'rgba(229,231,235,0.08)', primary: '#6366f1', primaryHover: '#4f46e5', accent: '#818cf8', headerBg: 'rgba(10,10,10,0.92)', headerBorder: 'rgba(99,102,241,0.3)', backgroundImage: 'https://wallpapershome.com/images/pages/ico_h/26618.jpg', contentBg: 'rgba(10,10,10,0.72)' } },
  wp21: { label: 'Yellow Bloom', preview: '#001a0a', colors: { sidebar: 'rgba(0,26,10,0.92)', sidebarText: '#a7f3d0', sidebarActive: 'rgba(52,211,153,0.25)', sidebarHover: 'rgba(52,211,153,0.12)', primary: '#10b981', primaryHover: '#059669', accent: '#34d399', headerBg: 'rgba(0,26,10,0.92)', headerBorder: 'rgba(52,211,153,0.3)', backgroundImage: 'https://c4.wallpaperflare.com/wallpaper/444/479/808/flowers-yellow-flowers-black-background-digital-art-wallpaper-preview.jpg', contentBg: 'rgba(0,26,10,0.72)' } },
  wp22: { label: 'Waterfall', preview: '#00051a', colors: { sidebar: 'rgba(0,5,26,0.92)', sidebarText: '#bfdbfe', sidebarActive: 'rgba(59,130,246,0.25)', sidebarHover: 'rgba(59,130,246,0.12)', primary: '#3b82f6', primaryHover: '#2563eb', accent: '#60a5fa', headerBg: 'rgba(0,5,26,0.92)', headerBorder: 'rgba(59,130,246,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20240916/pngtree-an-amazing-waterfall-tumbling-down-jagged-rocks-as-seen-in-this-image_16215718.jpg', contentBg: 'rgba(0,5,26,0.72)' } },
  wp23: { label: 'Cherry Blossom', preview: '#1a0530', colors: { sidebar: 'rgba(26,5,48,0.92)', sidebarText: '#e9d5ff', sidebarActive: 'rgba(167,139,250,0.25)', sidebarHover: 'rgba(167,139,250,0.12)', primary: '#9333ea', primaryHover: '#7e22ce', accent: '#a855f7', headerBg: 'rgba(26,5,48,0.92)', headerBorder: 'rgba(167,139,250,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20251222/pngtree-pink-cherry-blossoms-weeping-on-tender-grass-against-a-light-green-image_20875988.webp', contentBg: 'rgba(26,5,48,0.72)' } },
  wp24: { label: 'Galaxy Art', preview: '#001a1a', colors: { sidebar: 'rgba(0,26,26,0.92)', sidebarText: '#99f6e4', sidebarActive: 'rgba(45,212,191,0.25)', sidebarHover: 'rgba(45,212,191,0.12)', primary: '#0d9488', primaryHover: '#0f766e', accent: '#2dd4bf', headerBg: 'rgba(0,26,26,0.92)', headerBorder: 'rgba(45,212,191,0.3)', backgroundImage: 'https://i.pinimg.com/originals/ae/3d/80/ae3d80efc62aed929ce7253e831ceef8.jpg', contentBg: 'rgba(0,26,26,0.72)' } },
  wp25: { label: 'Dream Clouds', preview: '#1a0014', colors: { sidebar: 'rgba(26,0,20,0.92)', sidebarText: '#f5d0fe', sidebarActive: 'rgba(217,70,239,0.25)', sidebarHover: 'rgba(217,70,239,0.12)', primary: '#d946ef', primaryHover: '#c026d3', accent: '#e879f9', headerBg: 'rgba(26,0,20,0.92)', headerBorder: 'rgba(217,70,239,0.3)', backgroundImage: 'https://wallpaper-house.com/data/out/8/wallpaper2you_250348.jpg', contentBg: 'rgba(26,0,20,0.72)' } },
  wp26: { label: 'Sunset HD', preview: '#1a0a00', colors: { sidebar: 'rgba(26,10,0,0.92)', sidebarText: '#fed7aa', sidebarActive: 'rgba(249,115,22,0.25)', sidebarHover: 'rgba(249,115,22,0.12)', primary: '#ea580c', primaryHover: '#c2410c', accent: '#f97316', headerBg: 'rgba(26,10,0,0.92)', headerBorder: 'rgba(249,115,22,0.3)', backgroundImage: 'https://wallpaperset.com/w/full/f/0/b/224243.jpg', contentBg: 'rgba(26,10,0,0.72)' } },
  wp27: { label: 'Foggy Forest', preview: '#000a14', colors: { sidebar: 'rgba(0,10,20,0.92)', sidebarText: '#93c5fd', sidebarActive: 'rgba(59,130,246,0.25)', sidebarHover: 'rgba(59,130,246,0.12)', primary: '#1d4ed8', primaryHover: '#1e40af', accent: '#3b82f6', headerBg: 'rgba(0,10,20,0.92)', headerBorder: 'rgba(59,130,246,0.3)', backgroundImage: 'https://static.vecteezy.com/system/resources/thumbnails/075/217/020/small/foggy-forest-with-trees-and-mountains-in-the-background-photo.jpg', contentBg: 'rgba(0,10,20,0.72)' } },
  wp28: { label: 'Winter Lake', preview: '#0a0a0a', colors: { sidebar: 'rgba(10,10,10,0.92)', sidebarText: '#d1d5db', sidebarActive: 'rgba(255,255,255,0.15)', sidebarHover: 'rgba(255,255,255,0.08)', primary: '#4f46e5', primaryHover: '#4338ca', accent: '#6366f1', headerBg: 'rgba(10,10,10,0.92)', headerBorder: 'rgba(75,85,99,0.3)', backgroundImage: 'https://png.pngtree.com/thumb_back/fh260/background/20251022/pngtree-misty-winter-landscape-with-a-frozen-lake-and-snow-covered-forest-image_19954115.webp', contentBg: 'rgba(10,10,10,0.72)' } },
  wp29: { label: 'Fire Sunset', preview: '#1a0500', colors: { sidebar: 'rgba(26,5,0,0.92)', sidebarText: '#fca5a5', sidebarActive: 'rgba(239,68,68,0.3)', sidebarHover: 'rgba(239,68,68,0.15)', primary: '#dc2626', primaryHover: '#b91c1c', accent: '#ef4444', headerBg: 'rgba(26,5,0,0.92)', headerBorder: 'rgba(239,68,68,0.3)', backgroundImage: 'https://img.freepik.com/free-photo/painting-mountain-lake-with-mountain-background_188544-9126.jpg?semt=ais_hybrid&w=740&q=80', contentBg: 'rgba(26,5,0,0.72)' } },
  wp30: { label: 'Misty Nature', preview: '#0a0f1a', colors: { sidebar: 'rgba(10,15,26,0.92)', sidebarText: '#c7d2fe', sidebarActive: 'rgba(99,102,241,0.25)', sidebarHover: 'rgba(99,102,241,0.12)', primary: '#6366f1', primaryHover: '#4f46e5', accent: '#818cf8', headerBg: 'rgba(10,15,26,0.92)', headerBorder: 'rgba(99,102,241,0.3)', backgroundImage: 'https://wallpapershome.com/images/pages/ico_h/29704.jpg', contentBg: 'rgba(10,15,26,0.72)' } },
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
