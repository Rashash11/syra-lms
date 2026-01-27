'use client';

import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import OpacityIcon from '@mui/icons-material/Opacity';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { useThemeMode } from '@shared/theme/ThemeContext';

export const ThemeToggle: React.FC = () => {
    return null; // Hidden for now
    /*
    const { mode, toggleTheme } = useThemeMode();

    const getTooltipTitle = () => {
        if (mode === 'dark') return 'Switch to Liquid Glass';
        if (mode === 'liquid-glass') return 'Switch to Water Theme';
        return 'Switch to Dark Mode';
    };

    const getIcon = () => {
        if (mode === 'dark') return <OpacityIcon sx={{ fontSize: 20 }} />;
        if (mode === 'liquid-glass') return <WaterDropIcon sx={{ fontSize: 20 }} />;
        return <DarkModeIcon sx={{ fontSize: 20 }} />;
    };

    return (
        <Tooltip title={getTooltipTitle()}>
            <IconButton
                onClick={toggleTheme}
                sx={{
                    color: mode === 'liquid-glass' ? 'hsl(var(--primary))' : mode === 'water' ? '#06b6d4' : 'hsl(var(--muted-foreground))',
                    bgcolor: mode === 'liquid-glass' ? 'hsl(var(--primary) / 0.1)' : mode === 'water' ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    border: '1px solid',
                    borderColor: mode === 'liquid-glass' ? 'hsl(var(--primary) / 0.2)' : mode === 'water' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                    borderRadius: 2,
                    p: 1,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        bgcolor: mode === 'liquid-glass' ? 'hsl(var(--primary) / 0.2)' : mode === 'water' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    },
                }}
            >
                {getIcon()}
            </IconButton>
        </Tooltip>
    );
    */
};
