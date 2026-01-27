'use client';

import React, { useRef, useEffect, useCallback, useId, useState } from 'react';
import { Box, BoxProps } from '@mui/material';
import { AdvancedGlassFilter } from './AdvancedGlassFilter';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { ShaderDisplacementGenerator, fragmentShaders } from './displacement-map';

interface LiquidGlassEffectProps extends BoxProps {
    children: React.ReactNode;
    displacementScale?: number;
    aberrationIntensity?: number;
    elasticity?: number;
    blurAmount?: number;
    saturation?: number;
    cornerRadius?: number;
    active?: boolean;
    overLight?: boolean;
    edgePadding?: number;
}

/**
 * LiquidGlassEffect wraps content in a highly interactive "liquid" glass surface.
 * It features mouse elasticity (stretching towards the cursor) and integrates 
 * the custom SVG refraction filter.
 */
export const LiquidGlassEffect: React.FC<LiquidGlassEffectProps> = ({
    children,
    displacementScale = 100, // Aggressive displacement for strong refraction
    aberrationIntensity = 5, // High chromatic aberration
    elasticity = 0.1,
    blurAmount = 0.2, // Low blur for sharp, glass-like clarity
    saturation = 140,
    cornerRadius = 32, // More rounded
    active = true,
    overLight = false,
    sx,
    edgePadding = 6,
    ...props
}) => {
    const { mode } = useThemeMode();
    const isLiquid = mode === 'liquid-glass' && active;
    const containerRef = useRef<HTMLDivElement>(null);
    const animationFrameRef = useRef<number>();
    const isResetRef = useRef(true);
    const filterId = useId().replace(/:/g, '');
    const [mapUrl, setMapUrl] = useState<string>('');
    const generatorRef = useRef<ShaderDisplacementGenerator | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    // Visibility Observer
    useEffect(() => {
        if (!isLiquid || !containerRef.current) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.01 }
        );

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [isLiquid]);

    const sizeRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
    // Generate displacement map on mount and resize
    useEffect(() => {
        if (!isLiquid || !containerRef.current || !isVisible) return;

        const updateMap = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const width = Math.floor(rect.width);
            const height = Math.floor(rect.height);

            if (width <= 0 || height <= 0) return;
            if (Math.abs(sizeRef.current.w - width) < 2 && Math.abs(sizeRef.current.h - height) < 2) return;

            sizeRef.current = { w: width, h: height };

            // Destroy old generator if exists
            if (generatorRef.current) {
                generatorRef.current.destroy();
            }

            // Create new generator
            const generator = new ShaderDisplacementGenerator({
                width,
                height,
                fragment: fragmentShaders.liquidGlass
            });
            generatorRef.current = generator;

            // Generate map
            const url = generator.updateShader();
            setMapUrl(url);
        };

        const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateMap);
        });
        observer.observe(containerRef.current);

        // Initial generation
        updateMap();

        return () => {
            observer.disconnect();
            if (generatorRef.current) {
                generatorRef.current.destroy();
            }
        };
    }, [isLiquid, isVisible]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isLiquid || !isVisible || !containerRef.current) return;

        const { clientX, clientY } = e;

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        animationFrameRef.current = requestAnimationFrame(() => {
            if (!containerRef.current || !isVisible) return;

            const rect = containerRef.current.getBoundingClientRect();
            // Fallback if width/height are 0
            const rectWidth = rect.width || 1;
            const rectHeight = rect.height || 1;
            const rectLeft = rect.left;
            const rectTop = rect.top;

            const centerX = rectLeft + rectWidth / 2;
            const centerY = rectTop + rectHeight / 2;

            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;

            // Calculate distance for activation zone (fade effect)
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // OPTIMIZATION: Return early if mouse is far from card
            const activationZone = 500; // Slightly larger for smoother entry
            if (distance > activationZone) {
                if (!isResetRef.current) {
                    containerRef.current.style.setProperty('--spotlight-opacity', '0');
                    isResetRef.current = true;
                }
                return;
            }

            const fadeInFactor = Math.max(0, 1 - distance / activationZone);
            isResetRef.current = false;

            // Spotlight & Gradient Variables
            const spotlightX = clientX - rectLeft;
            const spotlightY = clientY - rectTop;

            // Performance: Only update if mouse actually moved within bounds
            containerRef.current.style.setProperty('--spotlight-x', `${spotlightX.toFixed(0)}px`);
            containerRef.current.style.setProperty('--spotlight-y', `${spotlightY.toFixed(0)}px`);
            containerRef.current.style.setProperty('--spotlight-opacity', fadeInFactor.toFixed(2));

            // Reduce calculation frequency for gradients if needed, but keeping for now as they are cheap
            const mouseOffsetX = (deltaX / rectWidth) * 100;
            const mouseOffsetY = (deltaY / rectHeight) * 100;
            const gradDeg = 135 + mouseOffsetX * 1.2;
            const gradAlpha1 = 0.4 + Math.abs(mouseOffsetX) * 0.005;
            const gradStop1 = Math.max(10, 33 + mouseOffsetY * 0.3);
            const gradAlpha2 = 0.8 + Math.abs(mouseOffsetX) * 0.005;
            const gradStop2 = Math.min(90, 66 + mouseOffsetY * 0.4);

            containerRef.current.style.setProperty('--grad-deg', `${gradDeg.toFixed(1)}deg`);
            containerRef.current.style.setProperty('--grad-alpha1', gradAlpha1.toFixed(3));
            containerRef.current.style.setProperty('--grad-stop1', `${gradStop1.toFixed(1)}%`);
            containerRef.current.style.setProperty('--grad-alpha2', gradAlpha2.toFixed(3));
            containerRef.current.style.setProperty('--grad-stop2', `${gradStop2.toFixed(1)}%`);
        });
    }, [isLiquid, isVisible]);

    useEffect(() => {
        if (!isLiquid || !isVisible) {
            if (containerRef.current && !isVisible) {
                containerRef.current.style.transform = 'translate(0,0) scale(1)';
            }
            return;
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isLiquid, isVisible, handleMouseMove]);

    if (!isLiquid) {
        return <Box sx={sx} {...props}>{children}</Box>;
    }

    // Minimized blur for maximum clarity
    const calculatedBlur = blurAmount * 8;
    const hasFilter = displacementScale > 0 || aberrationIntensity > 0;

    return (
        <Box
            ref={containerRef}
            sx={{
                position: 'relative',
                willChange: 'transform', // Hardware acceleration hint
                borderRadius: `${cornerRadius}px`,
                ...sx,
                // transform is now handled by JS directly
                '& > .glass-surface': {
                    ...(hasFilter && { filter: `url(#${filterId})` }),
                    // "Liquid" Apple Style: High blur to smooth out background noise
                    backdropFilter: `blur(${calculatedBlur}px) saturate(${saturation}%) contrast(115%) brightness(105%)`,
                    WebkitBackdropFilter: `blur(${calculatedBlur}px) saturate(${saturation}%) contrast(115%) brightness(105%)`,
                }
            }}
            {...props}
        >
            {hasFilter && (
                <AdvancedGlassFilter
                    id={filterId}
                    displacementScale={displacementScale}
                    aberrationIntensity={aberrationIntensity}
                    mapUrl={mapUrl}
                />
            )}

            {/* The Actual Glass Background Layer */}
            <Box
                className="glass-surface"
                sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    // Clear, wet-looking gradient with a subtle cyan tint
                    background: overLight
                        ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.8) 0%, rgba(200, 240, 255, 0.4) 100%)'
                        : 'linear-gradient(145deg, rgba(255, 255, 255, 0.16) 0%, rgba(180, 220, 255, 0.06) 100%)',
                    zIndex: -1,
                    pointerEvents: 'none',
                    // Caustic Rim Lighting: Sharp inner white highlights that mimic refraction
                    boxShadow: overLight
                        ? '0 15px 35px rgba(0,0,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.8), inset 0 0 20px 0 rgba(255,255,255,0.3)'
                        : `
                            0 12px 32px -18px rgba(0, 0, 0, 0.45),
                            inset 0 1px 0 0 rgba(255, 255, 255, 0.4),
                            inset 0 0 0 1px rgba(255, 255, 255, 0.08),
                            inset 0 0 24px 0 rgba(200, 240, 255, 0.08),
                            inset 0 -12px 24px -12px rgba(0, 0, 0, 0.45)
                          `,

                    // Glossy Specular Reflection (The "Wet" Look)
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        // Dynamic mouse-following shimmer
                        background: `radial-gradient(
                            circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), 
                            rgba(255, 255, 255, calc(0.18 * var(--spotlight-opacity, 0))) 0%, 
                            rgba(255, 255, 255, calc(0.04 * var(--spotlight-opacity, 0))) 25%, 
                            transparent 60%
                        )`,
                        zIndex: 1,
                        pointerEvents: 'none',
                    },

                    // Secondary static reflection for constant glass feel
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.06) 30%, transparent 70%)',
                        maskImage: 'radial-gradient(circle at 0% 0%, black 0%, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at 0% 0%, black 0%, transparent 80%)',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }
                }}
            />

            {/* Sharp Edge Highlight Border */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    zIndex: 2,
                    padding: '1px',
                    background: `linear-gradient(
                        180deg,
                        rgba(255, 255, 255, 0.22) 0%, 
                        rgba(255, 255, 255, 0.06) 20%,
                        rgba(255, 255, 255, 0.02) 60%,
                        rgba(255, 255, 255, 0.12) 100%
                    )`,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
            />

            {/* Inner depth shading */}
            <Box
                sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 'inherit',
                    pointerEvents: 'none',
                    zIndex: -1,
                    mixBlendMode: 'overlay',
                    opacity: 0.08,
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.06) 100%)',
                }}
            />

            {/* Content Layer (stays relatively sharp) */}
            <Box sx={{ position: 'relative', zIndex: 1, pointerEvents: 'auto', height: '100%' }}>
                {children}
            </Box>
        </Box>
    );
};
