'use client';

import React, { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';

export const LiquidMeshBackground: React.FC = () => {
    const { mode } = useThemeMode();
    const isLiquid = mode === 'liquid-glass';
    // Explicitly disable mouse interaction in water theme by not attaching listeners or rendering mesh
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        if (!isLiquid) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Normalize coordinates to -1 to 1 range
            const x = (e.clientX / window.innerWidth) * 2 - 1;
            const y = (e.clientY / window.innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        const handleScroll = () => {
            setScrollY(window.scrollY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [isLiquid]);

    if (!isLiquid) return null;

    return (
        <>
            <Box className="liquid-mesh-container">
                {/* Layer 1: Foreground Cards (Parallax + Rotation on Scroll) */}
                <Box sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    transform: `translate3d(${mousePos.x * -20}px, ${mousePos.y * -20 - scrollY * 0.15}px, 0) rotate3d(1, 0, 0, ${scrollY * 0.01}deg)`,
                    transition: 'transform 0.1s cubic-bezier(0,0,0.2,1)',
                    willChange: 'transform'
                }}>
                    <Box className="liquid-background-card" />
                    <Box className="liquid-background-card card-2" />
                    <Box className="liquid-background-card card-3" />
                </Box>

                {/* Layer 2: Particles (Subtle vertical drift) */}
                <Box sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    transform: `translate3d(${mousePos.x * 10}px, ${mousePos.y * 10 - scrollY * 0.08}px, 0)`,
                    transition: 'transform 0.2s cubic-bezier(0,0,0.2,1)',
                    willChange: 'transform'
                }}>
                    <Box className="liquid-particle p-1" />
                    <Box className="liquid-particle p-2" />
                    <Box className="liquid-particle p-3" />
                    <Box className="liquid-particle p-4" />
                    <Box className="liquid-particle p-5" />
                </Box>

                {/* Layer 3: Background Blobs (Deep layer, moves very slowly) */}
                <Box sx={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    transform: `translate3d(${mousePos.x * 5}px, ${mousePos.y * 5 - scrollY * 0.03}px, 0)`,
                    transition: 'transform 0.4s cubic-bezier(0,0,0.2,1)',
                    willChange: 'transform'
                }}>
                    <Box className="liquid-mesh-blob blob-1" />
                    <Box className="liquid-mesh-blob blob-2" />
                    <Box className="liquid-mesh-blob blob-3" />
                    <Box className="liquid-mesh-blob blob-4" />
                </Box>
            </Box>
            <Box className="bg-noise" />
            <Box 
                className="bg-grid" 
                sx={{
                    transform: `translate3d(${mousePos.x * 15}px, ${mousePos.y * 15 - scrollY * 0.05}px, 0)`,
                    transition: 'transform 0.3s cubic-bezier(0,0,0.2,1)',
                    willChange: 'transform'
                }}
            />
        </>
    );
};
