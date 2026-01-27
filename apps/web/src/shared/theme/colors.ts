/**
 * Shared color palettes for application themes.
 * Extracts hardcoded color values for better maintainability and consistency.
 */

export const waterThemePalette = {
    primary: {
        main: '#06b6d4', // Cyan to match new background
        light: '#22d3ee',
        dark: '#0891b2',
        contrastText: '#ffffff',
    },
    background: {
        default: '#1a1a1a',
        paper: 'rgba(0, 0, 0, 0.4)',
        overlay: 'rgba(0, 0, 0, 0.4)',
        glass: 'rgba(28, 32, 38, 0.6)',
        glassHover: 'rgba(28, 32, 38, 0.75)',
        glassLight: 'rgba(255, 255, 255, 0.85)', // For dialogs/menus
        glassButton: 'rgba(255, 255, 255, 0.1)',
        glassButtonHover: 'rgba(196, 215, 209, 0.2)',
        input: 'rgba(255, 255, 255, 0.5)',
        select: 'rgba(6, 182, 212, 0.05)',
        appBar: 'rgba(255, 255, 255, 0.7)',
        drawer: 'rgba(255, 255, 255, 0.7)',
        listItemHover: 'rgba(0, 0, 0, 0.04)',
        listItemSelected: 'rgba(6, 182, 212, 0.1)',
        listItemSelectedHover: 'rgba(6, 182, 212, 0.15)',
    },
    text: {
        primary: '#ffffff',
        secondary: 'rgba(255, 255, 255, 0.7)',
        heading: 'rgba(255, 255, 255, 0.95)',
        body: 'rgba(255, 255, 255, 0.9)',
        muted: 'rgba(255, 255, 255, 0.6)',
        input: '#1d1d1f',
        highlight: '#0891b2', // Cyan/Teal for selected text
    },
    border: {
        divider: 'rgba(255, 255, 255, 0.1)',
        glass: 'rgba(255, 255, 255, 0.08)',
        glassHover: 'rgba(255, 255, 255, 0.15)',
        glassLight: 'rgba(255, 255, 255, 0.6)', // For dialogs/menus
        button: 'rgba(255, 255, 255, 0.2)',
        input: 'rgba(0, 0, 0, 0.1)',
        inputHover: 'rgba(6, 182, 212, 0.4)',
        inputFocused: '#06b6d4',
    },
    shadows: {
        glass: '0 20px 40px rgba(0, 0, 0, 0.4)',
        glassHover: '0 6px 25px rgba(0, 0, 0, 0.3)',
        glassLight: '0 20px 40px rgba(0,0,0,0.1)',
        glassButton: '0 4px 20px rgba(0, 0, 0, 0.2)',
        select: '0 2px 10px rgba(6, 182, 212, 0.1)',
    },
    scroll: {
        track: 'rgba(255,255,255,0.1)',
        thumb: 'rgba(255,255,255,0.1)',
        thumbHover: 'rgba(255,255,255,0.2)',
    }
};

export const liquidGlassPalette = {
    primary: {
        main: '#1dd3c5',
        selectedBg: 'rgba(29, 211, 197, 0.15)',
        selectedHover: 'rgba(29, 211, 197, 0.25)',
        shadow: 'rgba(29, 211, 197, 0.25)',
    },
    background: {
        paper: 'hsl(var(--card) / 0.4)',
        glass: 'rgba(255, 255, 255, 0.1)',
        glassHover: 'rgba(255, 255, 255, 0.08)',
        input: 'rgba(255, 255, 255, 0.06)',
        select: 'rgba(255, 255, 255, 0.05)',
        appBar: 'rgba(15, 23, 42, 0.45)',
    },
    border: {
        glass: 'rgba(255, 255, 255, 0.4)',
        glassLight: 'rgba(255, 255, 255, 0.2)',
        glassHover: 'rgba(255, 255, 255, 0.45)',
        input: 'rgba(255, 255, 255, 0.12)',
        inputHover: 'rgba(255, 255, 255, 0.25)',
    },
    shadows: {
        glass: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
        glassHover: '0 25px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(29, 211, 197, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.4)',
        appBar: '0 10px 30px rgba(0,0,0,0.3)',
    }
};

export const saudiThemePalette = {
    primary: {
        main: '#D4AF37', // Gold
        light: '#F4CF57',
        dark: '#A48F17',
        contrastText: '#1a0f00',
    },
    background: {
        default: '#1a0f00', // Very dark brown
        paper: 'rgba(30, 20, 5, 0.6)',
        overlay: 'rgba(30, 20, 5, 0.5)',
        glass: 'rgba(45, 30, 10, 0.6)',
        glassHover: 'rgba(45, 30, 10, 0.75)',
        glassLight: 'rgba(255, 248, 220, 0.85)', // Cornsilk/Cream
        glassButton: 'rgba(212, 175, 55, 0.15)',
        glassButtonHover: 'rgba(212, 175, 55, 0.25)',
        input: 'rgba(255, 245, 230, 0.1)',
        select: 'rgba(212, 175, 55, 0.05)',
        appBar: 'rgba(45, 30, 10, 0.7)',
        drawer: 'rgba(45, 30, 10, 0.7)',
        listItemHover: 'rgba(212, 175, 55, 0.08)',
        listItemSelected: 'rgba(212, 175, 55, 0.15)',
        listItemSelectedHover: 'rgba(212, 175, 55, 0.2)',
    },
    text: {
        primary: '#FFD700', // Gold for primary text to pop
        secondary: 'rgba(255, 215, 0, 0.7)',
        heading: '#D4AF37',
        body: 'rgba(255, 235, 205, 0.9)', // BlanchedAlmond
        muted: 'rgba(255, 235, 205, 0.6)',
        input: '#FFD700',
        highlight: '#D4AF37',
    },
    border: {
        divider: 'rgba(212, 175, 55, 0.2)',
        glass: 'rgba(212, 175, 55, 0.3)',
        glassHover: 'rgba(212, 175, 55, 0.5)',
        glassLight: 'rgba(212, 175, 55, 0.6)',
        button: 'rgba(212, 175, 55, 0.4)',
        input: 'rgba(212, 175, 55, 0.2)',
        inputHover: 'rgba(212, 175, 55, 0.5)',
        inputFocused: '#D4AF37',
    },
    shadows: {
        glass: '0 20px 40px rgba(0, 0, 0, 0.5)',
        glassHover: '0 6px 25px rgba(212, 175, 55, 0.2)',
        glassLight: '0 20px 40px rgba(0,0,0,0.2)',
        glassButton: '0 4px 20px rgba(212, 175, 55, 0.1)',
        select: '0 2px 10px rgba(212, 175, 55, 0.2)',
    },
    scroll: {
        track: 'rgba(212, 175, 55, 0.1)',
        thumb: 'rgba(212, 175, 55, 0.3)',
        thumbHover: 'rgba(212, 175, 55, 0.5)',
    }
};
