'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { liquidGlassPalette, saudiThemePalette, waterThemePalette } from './colors';

type ThemeMode = 'dark' | 'liquid-glass' | 'water' | 'saudi';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
    setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

type Rgb = { r: number; g: number; b: number; a?: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const parseHexColor = (input: string): Rgb | null => {
    const hex = input.trim().replace('#', '');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b };
};

const parseRgbColor = (input: string): Rgb | null => {
    const match = input.trim().match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
    if (!match) return null;
    const r = Number(match[1]);
    const g = Number(match[2]);
    const b = Number(match[3]);
    const a = match[4] !== undefined ? clamp01(Number(match[4])) : undefined;
    if ([r, g, b].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a };
};

const parseColorToRgb = (input: string): Rgb | null => {
    if (!input) return null;
    if (input.startsWith('#')) return parseHexColor(input);
    if (input.toLowerCase().startsWith('rgb')) return parseRgbColor(input);
    return null;
};

const rgbToHsl = ({ r, g, b }: Rgb): { h: number; s: number; l: number } => {
    const r1 = r / 255;
    const g1 = g / 255;
    const b1 = b / 255;
    const max = Math.max(r1, g1, b1);
    const min = Math.min(r1, g1, b1);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === r1) h = ((g1 - b1) / delta) % 6;
        else if (max === g1) h = (b1 - r1) / delta + 2;
        else h = (r1 - g1) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    return { h, s: s * 100, l: l * 100 };
};

const formatHslVar = (hsl: { h: number; s: number; l: number }, alpha?: number) => {
    const h = Math.round(hsl.h * 10) / 10;
    const s = Math.round(hsl.s * 10) / 10;
    const l = Math.round(hsl.l * 10) / 10;
    if (alpha === undefined) return `${h} ${s}% ${l}%`;
    const a = Math.round(clamp01(alpha) * 1000) / 1000;
    return `${h} ${s}% ${l}% / ${a}`;
};

const toHslVarValue = (color: string, options?: { includeAlpha?: boolean; alphaOverride?: number }) => {
    const parsed = parseColorToRgb(color);
    if (!parsed) return null;
    const hsl = rgbToHsl(parsed);
    const alpha = options?.alphaOverride ?? (options?.includeAlpha ? parsed.a : undefined);
    return formatHslVar(hsl, alpha);
};

const THEME_VAR_KEYS = [
    '--primary',
    '--primary-foreground',
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--muted',
    '--muted-foreground',
    '--border',
    '--input',
    '--ring',
    '--glass-bg',
    '--glass-border',
    '--glass-shadow',
    '--glass-glow',
    '--glass-inner-fade',
    '--glass-accent',
    '--glass-accent-border',
    '--glass-accent-glow',
] as const;

const clearThemeVars = () => {
    const root = document.documentElement;
    THEME_VAR_KEYS.forEach((key) => root.style.removeProperty(key));
};

const applyThemeVars = (mode: ThemeMode) => {
    const root = document.documentElement;

    root.dataset.theme = mode;

    if (mode === 'dark') {
        clearThemeVars();
        return;
    }

    const setNoAlpha = (key: string, color: string) => {
        const value = toHslVarValue(color, { includeAlpha: false });
        if (value) root.style.setProperty(key, value);
    };

    const setWithAlpha = (key: string, color: string) => {
        const value = toHslVarValue(color, { includeAlpha: true });
        if (value) root.style.setProperty(key, value);
    };

    if (mode === 'water') {
        setNoAlpha('--primary', waterThemePalette.primary.main);
        setNoAlpha('--primary-foreground', waterThemePalette.primary.contrastText);

        setNoAlpha('--background', waterThemePalette.background.default);
        setNoAlpha('--foreground', waterThemePalette.text.body);

        setNoAlpha('--card', waterThemePalette.background.glass);
        setNoAlpha('--card-foreground', waterThemePalette.text.body);

        setNoAlpha('--muted', waterThemePalette.background.paper);
        setNoAlpha('--muted-foreground', waterThemePalette.text.muted);

        setNoAlpha('--border', waterThemePalette.border.divider);
        setNoAlpha('--input', waterThemePalette.border.input);
        setNoAlpha('--ring', waterThemePalette.border.inputFocused);

        setWithAlpha('--glass-bg', waterThemePalette.background.glass);
        setWithAlpha('--glass-border', waterThemePalette.border.glass);
        const shadowBase = toHslVarValue(waterThemePalette.background.default, { includeAlpha: false });
        if (shadowBase) root.style.setProperty('--glass-shadow', `${shadowBase} / 0.15`);
        const glowBase = toHslVarValue(waterThemePalette.primary.main, { includeAlpha: false });
        if (glowBase) {
            root.style.setProperty('--glass-glow', `${glowBase} / 0.12`);
            root.style.setProperty('--glass-accent', `${glowBase} / 0.06`);
            root.style.setProperty('--glass-accent-border', `${glowBase} / 0.25`);
            root.style.setProperty('--glass-accent-glow', `${glowBase} / 0.1`);
        }
        root.style.setProperty('--glass-inner-fade', '0 0% 100% / 0.04');
        return;
    }

    if (mode === 'saudi') {
        setNoAlpha('--primary', saudiThemePalette.primary.main);
        setNoAlpha('--primary-foreground', saudiThemePalette.primary.contrastText);

        setNoAlpha('--background', saudiThemePalette.background.default);
        setNoAlpha('--foreground', saudiThemePalette.text.body);

        setNoAlpha('--card', saudiThemePalette.background.glass);
        setNoAlpha('--card-foreground', saudiThemePalette.text.body);

        setNoAlpha('--muted', saudiThemePalette.background.paper);
        setNoAlpha('--muted-foreground', saudiThemePalette.text.muted);

        setNoAlpha('--border', saudiThemePalette.border.divider);
        setNoAlpha('--input', saudiThemePalette.border.input);
        setNoAlpha('--ring', saudiThemePalette.primary.main);

        setWithAlpha('--glass-bg', saudiThemePalette.background.glass);
        setWithAlpha('--glass-border', saudiThemePalette.border.glass);
        const shadowBase = toHslVarValue(saudiThemePalette.background.default, { includeAlpha: false });
        if (shadowBase) root.style.setProperty('--glass-shadow', `${shadowBase} / 0.15`);
        const glowBase = toHslVarValue(saudiThemePalette.primary.main, { includeAlpha: false });
        if (glowBase) {
            root.style.setProperty('--glass-glow', `${glowBase} / 0.12`);
            root.style.setProperty('--glass-accent', `${glowBase} / 0.06`);
            root.style.setProperty('--glass-accent-border', `${glowBase} / 0.25`);
            root.style.setProperty('--glass-accent-glow', `${glowBase} / 0.1`);
        }
        root.style.setProperty('--glass-inner-fade', '0 0% 100% / 0.04');
        return;
    }

    if (mode === 'liquid-glass') {
        setNoAlpha('--primary', liquidGlassPalette.primary.main);
        setNoAlpha('--ring', liquidGlassPalette.primary.main);
        setNoAlpha('--card', '#0f172a');
        setNoAlpha('--background', '#000000');
        setNoAlpha('--foreground', '#ffffff');
        setNoAlpha('--border', liquidGlassPalette.border.glass);
        setNoAlpha('--muted', '#0b1220');
        setNoAlpha('--muted-foreground', '#94a3b8');

        setWithAlpha('--glass-bg', liquidGlassPalette.background.glass);
        setWithAlpha('--glass-border', liquidGlassPalette.border.glass);
        const shadowBase = toHslVarValue('#000000', { includeAlpha: false });
        if (shadowBase) root.style.setProperty('--glass-shadow', `${shadowBase} / 0.25`);
        const glowBase = toHslVarValue(liquidGlassPalette.primary.main, { includeAlpha: false });
        if (glowBase) root.style.setProperty('--glass-glow', `${glowBase} / 0.12`);
        root.style.setProperty('--glass-inner-fade', '0 0% 100% / 0.04');
    }
};

export const ThemeContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<ThemeMode>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        // const savedTheme = localStorage.getItem('theme-mode') as ThemeMode;
        // if (savedTheme && (savedTheme === 'dark' || savedTheme === 'liquid-glass' || savedTheme === 'water' || savedTheme === 'saudi')) {
        //     setMode(savedTheme);
        // }
        setMode('dark'); // Force dark mode for now
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        applyThemeVars(mode);
    }, [mode, mounted]);

    const toggleTheme = () => {
        // Disabled for now
        // let newMode: ThemeMode = 'dark';
        // if (mode === 'dark') {
        //     newMode = 'liquid-glass';
        // } else if (mode === 'liquid-glass') {
        //     newMode = 'water';
        // } else {
        //     newMode = 'dark';
        // }
        // setMode(newMode);
        // localStorage.setItem('theme-mode', newMode);
    };

    const setTheme = (newMode: ThemeMode) => {
        setMode(newMode);
        localStorage.setItem('theme-mode', newMode);
    };

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme, setTheme }}>
            <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
};

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        // Fallback for SSR/initial render before context is available
        return {
            mode: 'dark' as ThemeMode,
            toggleTheme: () => { },
            setTheme: () => { },
        };
    }
    return context;
};
