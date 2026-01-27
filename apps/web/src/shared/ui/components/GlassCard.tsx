'use client';

import React from 'react';
import { Box, BoxProps, Typography } from '@mui/material';
import { LiquidGlassEffect } from './LiquidGlassEffect';
import { useThemeMode } from '@shared/theme/ThemeContext';

interface GlassCardProps extends Omit<BoxProps, 'title'> {
    children: React.ReactNode;
    active?: boolean;
    activeEffect?: boolean;
    interactive?: boolean;
    displacementScale?: number;
    blurAmount?: number;
    saturation?: number;
    elasticity?: number;
    cornerRadius?: number;
    overLight?: boolean;
    aberrationIntensity?: number;
    title?: React.ReactNode;
    subtitle?: React.ReactNode;
    action?: React.ReactNode;
}

/**
 * GlassCard is a high-level UI component that combines LiquidGlassEffect 
 * with consistent styling for dashboard widgets and sections.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
    children,
    active = true,
    activeEffect = false,
    interactive = false,
    displacementScale,
    blurAmount,
    saturation,
    elasticity,
    cornerRadius = 28, // Default to Apple-style 28px
    overLight,
    aberrationIntensity,
    title,
    subtitle,
    action,
    sx,
    onClick,
    className,
    ...props
}) => {
    const { mode } = useThemeMode();
    const isLiquid = mode === 'liquid-glass';

    const renderContent = () => (
        <>
            {(title || subtitle || action) && (
                <Box sx={{ 
                    mb: children ? 2 : 0, 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    justifyContent: 'space-between', 
                    gap: 2 
                }}>
                    <Box>
                        {title && (
                            <Typography variant="h6" sx={{ 
                                fontWeight: 700, 
                                letterSpacing: '-0.02em',
                                color: 'hsl(var(--foreground))',
                                fontSize: '1.1rem',
                                lineHeight: 1.3
                            }}>
                                {title}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography variant="body2" sx={{ 
                                color: 'hsl(var(--muted-foreground))',
                                mt: 0.5,
                                fontWeight: 500,
                                fontSize: '0.875rem'
                            }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    {action && <Box>{action}</Box>}
                </Box>
            )}
            {children}
        </>
    );

    if (isLiquid) {
        return (
            <Box
                className={`liquid-glass ${className || ''}`}
                onClick={onClick}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: onClick ? 'pointer' : 'default',
                    borderRadius: `${cornerRadius}px`,
                    zIndex: 1, // Ensure it stays above background
                    ...sx
                }}
                {...props}
            >
                <Box sx={{
                    p: (sx as any)?.p !== undefined ? 0 : 3,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    zIndex: 2
                }}>
                    {renderContent()}
                </Box>
            </Box>
        );
    }

    const cardProps = {
        ...props,
        className,
        onClick,
        sx: {
            borderRadius: `${cornerRadius}px`,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            bgcolor: 'hsl(var(--glass-bg))',
            backdropFilter: 'blur(20px) saturate(150%)',
            WebkitBackdropFilter: 'blur(20px) saturate(150%)',
            border: '1px solid',
            borderColor: 'hsl(var(--glass-border))',
            boxShadow: `
                0 0 20px -5px hsl(var(--glass-glow)),
                0 8px 32px -8px hsl(var(--glass-shadow)),
                inset 0 0 0 1px hsl(var(--glass-border))
            `,
            overflow: 'hidden',
            ...(interactive && {
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 32px -8px hsl(var(--glass-shadow))',
                    borderColor: 'hsl(var(--primary) / 0.3)',
                }
            }),
            ...(onClick && { cursor: 'pointer' }),
            ...sx
        }
    } as Omit<React.ComponentProps<typeof LiquidGlassEffect>, 'children'>;

    const effectiveDisplacementScale = displacementScale ?? (activeEffect ? 15 : 0);
    const effectiveAberrationIntensity = aberrationIntensity ?? (activeEffect ? 2 : 0);
    const effectiveBlurAmount = blurAmount ?? (activeEffect ? 0.15 : 0.5);
    const effectiveSaturation = saturation ?? (activeEffect ? 160 : 100);
    const effectiveElasticity = elasticity ?? (activeEffect ? 0.2 : 0.1);
    
    return (
        <LiquidGlassEffect
            active={active}
            displacementScale={effectiveDisplacementScale}
            blurAmount={effectiveBlurAmount}
            saturation={effectiveSaturation}
            elasticity={effectiveElasticity}
            cornerRadius={cornerRadius}
            overLight={overLight}
            aberrationIntensity={effectiveAberrationIntensity}
            {...cardProps}
        >
            <Box sx={{
                p: (sx as any)?.p !== undefined ? 0 : 3,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                zIndex: 1
            }}>
                {renderContent()}
            </Box>
        </LiquidGlassEffect>
    );
};
