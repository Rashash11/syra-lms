'use client';

import React from 'react';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { Box } from '@mui/material';
import { saudiThemePalette } from '@shared/theme/colors';

const SaudiBackground = () => {
    const { mode } = useThemeMode();
    const [videoSrc, setVideoSrc] = React.useState('/videos/saudi-theme-bg.mp4');
    const [triedFallback, setTriedFallback] = React.useState(false);

    if (mode !== 'saudi') return null;

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
                '& video': {
                    objectFit: 'cover',
                    width: '100%',
                    height: '100%',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: saudiThemePalette.background.overlay,
                    backdropFilter: 'blur(0px)',
                }
            }}
        >
            <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                style={{
                    opacity: 1
                }}
                onError={() => {
                    if (triedFallback) return;
                    setTriedFallback(true);
                    setVideoSrc('/videos/water-theme-bg.mp4');
                }}
            >
                Your browser does not support the video tag.
            </video>
        </Box>
    );
};

export default SaudiBackground;
