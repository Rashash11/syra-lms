import { createTheme, Theme } from '@mui/material/styles';
import { waterThemePalette, liquidGlassPalette, saudiThemePalette } from './colors';

const getTheme = (mode: 'dark' | 'liquid-glass' | 'water' | 'saudi'): Theme => {
    const isLiquid = mode === 'liquid-glass';
    const isWater = mode === 'water';
    const isSaudi = mode === 'saudi';

    return createTheme({
        palette: {
            mode: 'dark', // Always dark mode base
            primary: {
                main: isSaudi ? saudiThemePalette.primary.main : isWater ? waterThemePalette.primary.main : 'hsl(var(--primary))',
                light: isSaudi ? saudiThemePalette.primary.light : isWater ? waterThemePalette.primary.light : 'hsl(var(--primary) / 0.85)',
                dark: isSaudi ? saudiThemePalette.primary.dark : isWater ? waterThemePalette.primary.dark : 'hsl(var(--primary) / 0.65)',
                contrastText: isSaudi ? saudiThemePalette.primary.contrastText : isWater ? waterThemePalette.primary.contrastText : 'hsl(var(--primary-foreground))',
            },
            secondary: {
                main: 'hsl(var(--secondary))',
                light: 'hsl(var(--secondary) / 0.85)',
                dark: 'hsl(var(--secondary) / 0.65)',
                contrastText: 'hsl(var(--secondary-foreground))',
            },
            background: {
                default: isLiquid ? 'transparent' : isSaudi ? saudiThemePalette.background.default : isWater ? waterThemePalette.background.default : 'hsl(var(--background))',
                paper: isLiquid ? liquidGlassPalette.background.paper : isSaudi ? saudiThemePalette.background.paper : isWater ? waterThemePalette.background.paper : 'hsl(var(--card))',
            },
            text: {
                primary: isSaudi ? saudiThemePalette.text.primary : isWater ? waterThemePalette.text.primary : 'hsl(var(--foreground))',
                secondary: isSaudi ? saudiThemePalette.text.secondary : isWater ? waterThemePalette.text.secondary : 'hsl(var(--muted-foreground))',
            },
            divider: isSaudi ? saudiThemePalette.border.divider : isWater ? waterThemePalette.border.divider : 'hsl(var(--border))',
        },
        typography: {
            fontFamily: "'SF Pro Display', 'Inter', '-apple-system', 'BlinkMacSystemFont', sans-serif",
            h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '0.05em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.primary.main : 'rgba(255,255,255,0.95)' },
            h2: { fontSize: '2rem', fontWeight: 600, letterSpacing: '0.02em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.text.primary : 'rgba(255,255,255,0.95)' },
            h3: { fontSize: '1.75rem', fontWeight: 600, letterSpacing: '0.02em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.text.primary : 'rgba(255,255,255,0.9)' },
            h4: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '0.02em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.text.primary : 'rgba(255,255,255,0.9)' },
            h5: { fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.01em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.text.primary : 'rgba(255,255,255,0.85)' },
            h6: { fontSize: '1rem', fontWeight: 600, letterSpacing: '0.01em', color: isSaudi ? saudiThemePalette.text.heading : isWater ? waterThemePalette.text.primary : 'rgba(255,255,255,0.85)' },
            body1: { color: isSaudi ? saudiThemePalette.text.body : isWater ? waterThemePalette.text.body : 'rgba(255,255,255,0.85)', letterSpacing: '0.01em', lineHeight: 1.6 },
            body2: { color: isSaudi ? saudiThemePalette.text.muted : isWater ? waterThemePalette.text.muted : 'rgba(255,255,255,0.7)', letterSpacing: '0.01em', lineHeight: 1.6 },
        },
        shape: {
            borderRadius: 24,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        scrollbarColor: isSaudi ? `${saudiThemePalette.scroll.thumb} transparent` : isWater ? `${waterThemePalette.scroll.thumb} transparent` : "rgba(255,255,255,0.1) transparent",
                        "&::-webkit-scrollbar": {
                            width: "8px",
                            height: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                            background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                            background: isSaudi ? saudiThemePalette.scroll.thumb : isWater ? waterThemePalette.scroll.thumb : "rgba(255,255,255,0.1)",
                            borderRadius: "10px",
                            border: "2px solid transparent",
                            backgroundClip: "content-box",
                            "&:hover": {
                                background: isSaudi ? saudiThemePalette.scroll.thumbHover : isWater ? waterThemePalette.scroll.thumbHover : "rgba(255,255,255,0.2)",
                            },
                        },
                        ...(isLiquid && {
                            backgroundColor: 'transparent',
                            backgroundImage: 'none',
                        }),
                        ...(isWater && {
                            backgroundColor: 'transparent',
                            backgroundImage: 'none',
                        }),
                        ...(isSaudi && {
                            backgroundColor: 'transparent',
                            backgroundImage: 'none',
                        }),
                    },
                    'input:-webkit-autofill': {
                        WebkitBoxShadow: isSaudi ? `0 0 0 100px ${saudiThemePalette.background.paper} inset !important` : isWater ? '0 0 0 100px rgba(0,0,0,0.5) inset !important' : '0 0 0 100px hsl(var(--card)) inset !important',
                        WebkitTextFillColor: isSaudi ? `${saudiThemePalette.text.primary} !important` : isWater ? '#ffffff !important' : 'hsl(var(--foreground)) !important',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        borderRadius: 30, // Pill shape like "BOOK NOW"
                        fontWeight: 500,
                        padding: '10px 24px',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        ...(isLiquid && {
                            backdropFilter: 'blur(8px)',
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${waterThemePalette.border.button}`,
                            color: waterThemePalette.text.primary,
                            backgroundColor: waterThemePalette.background.glassButton,
                            '&:hover': {
                                backgroundColor: waterThemePalette.background.glassButtonHover,
                                transform: 'translateY(-2px)',
                                borderColor: waterThemePalette.primary.main,
                            }
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${saudiThemePalette.border.button}`,
                            color: saudiThemePalette.text.primary,
                            backgroundColor: saudiThemePalette.background.glassButton,
                            '&:hover': {
                                backgroundColor: saudiThemePalette.background.glassButtonHover,
                                transform: 'translateY(-2px)',
                                borderColor: saudiThemePalette.primary.main,
                            }
                        }),
                    },
                    containedPrimary: {
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                        boxShadow: 'none',
                        '&:hover': {
                            background: 'linear-gradient(135deg, hsl(var(--primary) / 0.95), hsl(var(--primary) / 0.7))',
                            transform: 'translateY(-1px)',
                            boxShadow: 'none',
                        },
                        ...(isWater && {
                             background: waterThemePalette.primary.main,
                             color: waterThemePalette.primary.contrastText,
                             boxShadow: waterThemePalette.shadows.glassButton,
                             border: 'none',
                             '&:hover': {
                                 background: waterThemePalette.primary.light,
                                 boxShadow: waterThemePalette.shadows.glassHover,
                             }
                        }),
                        ...(isSaudi && {
                             background: saudiThemePalette.primary.main,
                             color: saudiThemePalette.primary.contrastText,
                             boxShadow: saudiThemePalette.shadows.glassButton,
                             border: 'none',
                             '&:hover': {
                                 background: saudiThemePalette.primary.light,
                                 boxShadow: saudiThemePalette.shadows.glassHover,
                             }
                        }),
                    },
                    outlined: {
                        borderColor: 'hsl(var(--border))',
                        '&:hover': {
                            borderColor: 'hsl(var(--primary))',
                            backgroundColor: 'hsl(var(--primary) / 0.06)',
                        },
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundImage: 'none',
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        ...(isLiquid && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: liquidGlassPalette.background.glass,
                            border: `1px solid ${liquidGlassPalette.border.glass}`,
                            boxShadow: liquidGlassPalette.shadows.glass,
                            borderRadius: 32,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '-150%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                                pointerEvents: 'none',
                                zIndex: 1,
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD893Y6AAAAGXRSTlMABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fH6ChIuNkJIAAAAnSURBVDjLY2DmAAMmBjQAU80E6mYIdTMEuhkC3QyBboZAN0OgWwYDAByvALWzP0S4AAAAAElFTkSuQmCC")',
                                backgroundRepeat: 'repeat',
                                opacity: 0.025,
                                pointerEvents: 'none',
                                zIndex: 0,
                            },
                            '&:hover': {
                                transform: 'translateY(-6px) scale(1.01)',
                                borderColor: 'rgba(255, 255, 255, 0.45)',
                                boxShadow: liquidGlassPalette.shadows.glassHover,
                            },
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: waterThemePalette.background.glass,
                            border: `1px solid ${waterThemePalette.border.glass}`,
                            boxShadow: waterThemePalette.shadows.glass,
                            borderRadius: 4,
                            '&:hover': {
                                backgroundColor: waterThemePalette.background.glassHover,
                                borderColor: waterThemePalette.border.glassHover,
                                transform: 'none',
                            }
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: saudiThemePalette.background.glass,
                            border: `1px solid ${saudiThemePalette.border.glass}`,
                            boxShadow: saudiThemePalette.shadows.glass,
                            borderRadius: 4,
                            '&:hover': {
                                backgroundColor: saudiThemePalette.background.glassHover,
                                borderColor: saudiThemePalette.border.glassHover,
                                transform: 'none',
                            }
                        }),
                    }),
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        borderRadius: 24,
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                        ...(isLiquid && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: liquidGlassPalette.background.glass,
                            border: `1px solid ${liquidGlassPalette.border.glass}`,
                            boxShadow: liquidGlassPalette.shadows.glass,
                            borderRadius: 32,
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: '-150%',
                                width: '100%',
                                height: '100%',
                                background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                                pointerEvents: 'none',
                                zIndex: 1,
                            },
                            '&::after': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundImage: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD893Y6AAAAGXRSTlMABAgMEBQYHCAkKCwwNDg8QERITFBUWFxgZGhscHR4fH6ChIuNkJIAAAAnSURBVDjLY2DmAAMmBjQAU80E6mYIdTMEuhkC3QyBboZAN0OgWwYDAByvALWzP0S4AAAAAElFTkSuQmCC")',
                                backgroundRepeat: 'repeat',
                                opacity: 0.025,
                                pointerEvents: 'none',
                                zIndex: 0,
                            },
                            '&:hover': {
                                transform: 'translateY(-6px) scale(1.01)',
                                borderColor: 'rgba(255, 255, 255, 0.45)',
                                boxShadow: liquidGlassPalette.shadows.glassHover,
                            },
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: waterThemePalette.background.glass,
                            border: `1px solid ${waterThemePalette.border.glass}`,
                            boxShadow: waterThemePalette.shadows.glass,
                            borderRadius: 4,
                            '&:hover': {
                                backgroundColor: waterThemePalette.background.glassHover,
                                borderColor: waterThemePalette.border.glassHover,
                                transform: 'none',
                            }
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: saudiThemePalette.background.glass,
                            border: `1px solid ${saudiThemePalette.border.glass}`,
                            boxShadow: saudiThemePalette.shadows.glass,
                            borderRadius: 4,
                            '&:hover': {
                                backgroundColor: saudiThemePalette.background.glassHover,
                                borderColor: saudiThemePalette.border.glassHover,
                                transform: 'none',
                            }
                        }),
                    }),
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        borderRadius: '16px',
                        ...(isLiquid && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: liquidGlassPalette.background.glass,
                            border: `1px solid ${liquidGlassPalette.border.glass}`,
                            boxShadow: liquidGlassPalette.shadows.glass,
                            borderRadius: '24px',
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: waterThemePalette.background.glassLight,
                            border: `1px solid ${waterThemePalette.border.glassLight}`,
                            boxShadow: waterThemePalette.shadows.glassLight,
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(20px)',
                            backgroundColor: saudiThemePalette.background.glassLight,
                            border: `1px solid ${saudiThemePalette.border.glassLight}`,
                            boxShadow: saudiThemePalette.shadows.glassLight,
                        }),
                    }),
                },
            },
            MuiMenu: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        ...(isLiquid && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: liquidGlassPalette.background.glass,
                            border: `1px solid ${liquidGlassPalette.border.glass}`,
                            boxShadow: liquidGlassPalette.shadows.glass,
                            borderRadius: '16px',
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: waterThemePalette.background.glassLight,
                            border: `1px solid ${waterThemePalette.border.glassLight}`,
                            boxShadow: waterThemePalette.shadows.glassLight,
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: saudiThemePalette.background.glassLight,
                            border: `1px solid ${saudiThemePalette.border.glassLight}`,
                            boxShadow: saudiThemePalette.shadows.glassLight,
                        }),
                    }),
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        backgroundImage: 'none',
                        border: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        ...(isLiquid && {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: liquidGlassPalette.background.glass,
                            border: `1px solid ${liquidGlassPalette.border.glass}`,
                            boxShadow: liquidGlassPalette.shadows.glass,
                            borderRadius: '16px',
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: waterThemePalette.background.glassLight,
                            border: `1px solid ${waterThemePalette.border.glassLight}`,
                            boxShadow: waterThemePalette.shadows.glassLight,
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: saudiThemePalette.background.glassLight,
                            border: `1px solid ${saudiThemePalette.border.glassLight}`,
                            boxShadow: saudiThemePalette.shadows.glassLight,
                        }),
                    }),
                },
            },
            MuiSelect: {
                styleOverrides: {
                    select: {
                        ...(isLiquid && {
                            backgroundColor: liquidGlassPalette.background.select,
                            borderRadius: '12px',
                        }),
                        ...(isWater && {
                            backgroundColor: waterThemePalette.background.select,
                            borderRadius: '12px',
                        }),
                        ...(isSaudi && {
                            backgroundColor: saudiThemePalette.background.select,
                            borderRadius: '12px',
                        }),
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        boxShadow: 'none',
                        ...(isLiquid && {
                            backdropFilter: 'blur(30px) saturate(190%) contrast(1.1) brightness(1.05)',
                            backgroundColor: liquidGlassPalette.background.appBar,
                            borderColor: liquidGlassPalette.border.glassLight,
                            borderBottom: `1px solid ${liquidGlassPalette.border.glassLight}`,
                            boxShadow: liquidGlassPalette.shadows.appBar,
                            borderRadius: 24,
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(20px) saturate(180%)',
                            backgroundColor: waterThemePalette.background.appBar,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(20px) saturate(180%)',
                            backgroundColor: saudiThemePalette.background.appBar,
                            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                        }),
                    }),
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: ({ theme }) => ({
                        backgroundColor: theme.palette.background.paper,
                        border: 'none',
                        '&.MuiDrawer-paperAnchorLeft': {
                            borderRight: `1px solid ${theme.palette.divider}`,
                        },
                        ...(isLiquid && {
                            backdropFilter: 'blur(35px) saturate(190%) contrast(1.1) brightness(1.05)',
                            backgroundColor: liquidGlassPalette.background.appBar,
                            borderColor: liquidGlassPalette.border.glassLight,
                            borderRight: `1px solid ${liquidGlassPalette.border.glassLight} !important`,
                            boxShadow: liquidGlassPalette.shadows.appBar,
                            borderRadius: 24,
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(20px) saturate(180%)',
                            backgroundColor: waterThemePalette.background.drawer,
                            borderRight: '1px solid rgba(0, 0, 0, 0.05) !important',
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(20px) saturate(180%)',
                            backgroundColor: saudiThemePalette.background.drawer,
                            borderRight: '1px solid rgba(0, 0, 0, 0.05) !important',
                        }),
                    }),
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                        margin: '4px 12px',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                        '&.Mui-selected': {
                            backgroundColor: liquidGlassPalette.primary.selectedBg,
                            color: '#1dd3c5',
                            boxShadow: `0 0 20px ${liquidGlassPalette.primary.shadow}`,
                            '&:hover': {
                                backgroundColor: liquidGlassPalette.primary.selectedHover,
                            },
                        },
                        '&:hover': {
                            backgroundColor: liquidGlassPalette.background.glassHover,
                            transform: 'translateX(4px)',
                        },
                        ...(isWater && {
                            '&.Mui-selected': {
                                backgroundColor: waterThemePalette.background.listItemSelected,
                                color: waterThemePalette.text.highlight,
                                boxShadow: waterThemePalette.shadows.select,
                                '&:hover': {
                                    backgroundColor: waterThemePalette.background.listItemSelectedHover,
                                },
                            },
                            '&:hover': {
                                backgroundColor: waterThemePalette.background.listItemHover,
                            },
                        }),
                        ...(isSaudi && {
                            '&.Mui-selected': {
                                backgroundColor: saudiThemePalette.background.listItemSelected,
                                color: saudiThemePalette.text.highlight,
                                boxShadow: saudiThemePalette.shadows.select,
                                '&:hover': {
                                    backgroundColor: saudiThemePalette.background.listItemSelectedHover,
                                },
                            },
                            '&:hover': {
                                backgroundColor: saudiThemePalette.background.listItemHover,
                            },
                        }),
                    },
                },
            },
            MuiInputBase: {
                styleOverrides: {
                    root: {
                        borderRadius: '8px',
                        '&.Mui-focused': {
                            backgroundColor: 'hsl(var(--card) / 0.6)',
                        },
                        ...(isLiquid && {
                            backdropFilter: 'blur(8px)',
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(4px)',
                            color: waterThemePalette.text.input,
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(4px)',
                            color: saudiThemePalette.text.input,
                        }),
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        borderRadius: 12,
                        '& fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.12)',
                        },
                        '&:hover fieldset': {
                            borderColor: 'rgba(255, 255, 255, 0.25)',
                        },
                        '&.Mui-focused fieldset': {
                            borderColor: '#1dd3c5',
                        },
                        ...(isLiquid && {
                            backdropFilter: 'blur(12px)',
                            backgroundColor: liquidGlassPalette.background.input,
                        }),
                        ...(isWater && {
                            backdropFilter: 'blur(8px)',
                            backgroundColor: waterThemePalette.background.input,
                            '& fieldset': {
                                borderColor: waterThemePalette.border.input,
                            },
                            '&:hover fieldset': {
                                borderColor: waterThemePalette.border.inputHover,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: waterThemePalette.border.inputFocused,
                            },
                        }),
                        ...(isSaudi && {
                            backdropFilter: 'blur(8px)',
                            backgroundColor: saudiThemePalette.background.input,
                            '& fieldset': {
                                borderColor: saudiThemePalette.border.input,
                            },
                            '&:hover fieldset': {
                                borderColor: saudiThemePalette.border.inputHover,
                            },
                            '&.Mui-focused fieldset': {
                                borderColor: saudiThemePalette.border.inputFocused,
                            },
                        }),
                    },
                },
            },
        },
    });
};

export default getTheme;
