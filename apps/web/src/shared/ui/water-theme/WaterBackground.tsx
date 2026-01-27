'use client';

import React from 'react';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { Box } from '@mui/material';
import { waterThemePalette } from '@shared/theme/colors';

const WaterBackground = () => {
    const { mode } = useThemeMode();

    if (mode !== 'water') return null;

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: -1,
                overflow: 'hidden',
                backgroundImage: 'url(/videos/water-theme-bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                opacity: 1, // Full opacity for the new image
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)', // Lighter overlay to show more of the image
                    backdropFilter: 'blur(4px)', // Slight blur for better glass effect
                }
            }}
        />
    );
};

export default WaterBackground;
