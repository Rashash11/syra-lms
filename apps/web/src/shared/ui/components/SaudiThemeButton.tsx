'use client';

import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { saudiThemePalette } from '@shared/theme/colors';
import Image from 'next/image';

export const SaudiThemeButton: React.FC = () => {
    return null; // Hidden for now
    /*
    const { mode, setTheme } = useThemeMode();
    const isSaudi = mode === 'saudi';

    return (
        <Tooltip title="Switch to Saudi Arabian Theme">
            <IconButton
                onClick={() => setTheme('saudi')}
                sx={{
                    color: isSaudi ? saudiThemePalette.primary.main : 'rgba(255, 255, 255, 0.7)',
                    bgcolor: isSaudi ? 'rgba(212, 175, 55, 0.1)' : 'transparent',
                    border: '1px solid',
                    borderColor: isSaudi ? saudiThemePalette.primary.main : 'transparent',
                    borderRadius: 2,
                    p: 1,
                    ml: 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        bgcolor: isSaudi ? 'rgba(212, 175, 55, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: saudiThemePalette.primary.main,
                        transform: 'translateY(-2px)',
                        boxShadow: isSaudi ? saudiThemePalette.shadows.glassButton : 'none',
                    },
                }}
            >
                <Box sx={{ 
                    position: 'relative', 
                    width: 32, 
                    height: 32,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    // Use the image as-is, just ensure it fits nicely
                    filter: isSaudi 
                        ? 'drop-shadow(0 0 2px #D4AF37)' 
                        : 'none'
                }}>
                    <Image
                        src="/logos/saudi-theme-logo.png"
                        alt="Saudi Theme"
                        fill
                        style={{ objectFit: 'cover' }}
                        unoptimized
                    />
                </Box>
            </IconButton>
        </Tooltip>
    );
    */
};
