'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    Menu,
    MenuItem,
    CircularProgress,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GridOnIcon from '@mui/icons-material/GridOn';
import TimelineIcon from '@mui/icons-material/Timeline';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import OverviewTab from '@modules/reports/ui/OverviewTab';
import TrainingMatrixTab from '@modules/reports/ui/TrainingMatrixTab';
import TimelineTab from '@modules/reports/ui/TimelineTab';
import { getCsrfToken } from '@/lib/client-csrf';

// Consistent styling constants
const TEXT_COLOR = '#ffffff';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.7)';
const ACCENT_COLOR = '#1dd3c5';
const PRIMARY_GRADIENT = 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';

function ReportsPageContent() {
    const { mode } = useThemeMode();
    const [currentTab, setCurrentTab] = useState(0);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab');

    useEffect(() => {
        if (tabParam === 'matrix') setCurrentTab(1);
        else if (tabParam === 'timeline') setCurrentTab(2);
        else setCurrentTab(0);
    }, [tabParam]);

    const handleExportTrainingProgress = async () => {
        try {
            const res = await fetch('/api/reports/export/training-progress', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'x-csrf-token': getCsrfToken() || '',
                },
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Training_progress.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting training progress:', error);
        }
        setExportAnchor(null);
    };

    return (
        <Box sx={{ maxWidth: 1600, mx: 'auto' }}>
            {/* Header */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                position: 'relative',
                zIndex: 1
            }}>
                <Box>
                    <Typography variant="h4" sx={{
                        fontWeight: 800,
                        color: TEXT_COLOR,
                        mb: 1,
                        background: 'linear-gradient(45deg, #fff 30%, #1dd3c5 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}>
                        Reports Dashboard
                    </Typography>
                    <Typography variant="body1" sx={{ color: MUTED_TEXT }}>
                        Monitor training progress, completion rates, and user activity
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        background: PRIMARY_GRADIENT,
                        color: '#fff',
                        borderRadius: '12px',
                        px: 3,
                        py: 1.5,
                        boxShadow: '0 8px 16px rgba(0, 114, 255, 0.25)',
                        transition: 'all 0.2s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px rgba(0, 114, 255, 0.4)'
                        }
                    }}
                >
                    Training progress
                </Button>
            </Box>

            {/* Export Menu */}
            <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1f2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        marginTop: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        minWidth: 200
                    }
                }}
            >
                <MenuItem
                    onClick={handleExportTrainingProgress}
                    sx={{
                        fontWeight: 500,
                        color: TEXT_COLOR,
                        py: 1.5,
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                    }}
                >
                    Download Excel Report
                </MenuItem>
            </Menu>

            {/* Tabs */}
            <Box sx={{ mb: 4 }}>
                <Tabs
                    value={currentTab}
                    onChange={(_, newValue) => setCurrentTab(newValue)}
                    sx={{
                        minHeight: 0,
                        '& .MuiTabs-indicator': {
                            display: 'none'
                        },
                        '& .MuiTabs-flexContainer': {
                            gap: 1
                        }
                    }}
                >
                    {[
                        { label: 'Overview', icon: <AssessmentIcon /> },
                        { label: 'Training Matrix', icon: <GridOnIcon /> },
                        { label: 'Timeline', icon: <TimelineIcon /> }
                    ].map((tab, index) => (
                        <Tab
                            key={tab.label}
                            label={tab.label}
                            icon={tab.icon}
                            iconPosition="start"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                color: MUTED_TEXT,
                                minHeight: 48,
                                borderRadius: '12px',
                                px: 3,
                                transition: 'all 0.2s',
                                border: '1px solid transparent',
                                '&.Mui-selected': {
                                    color: '#fff',
                                    bgcolor: 'rgba(29, 211, 197, 0.1)',
                                    borderColor: 'rgba(29, 211, 197, 0.2)',
                                    '& .MuiSvgIcon-root': {
                                        color: ACCENT_COLOR
                                    }
                                },
                                '&:hover:not(.Mui-selected)': {
                                    bgcolor: 'rgba(255,255,255,0.05)',
                                    color: '#fff'
                                }
                            }}
                        />
                    ))}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <Box sx={{
                position: 'relative',
                animation: 'fadeIn 0.5s ease-out',
                '@keyframes fadeIn': {
                    '0%': { opacity: 0, transform: 'translateY(10px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' }
                }
            }}>
                {currentTab === 0 && <OverviewTab />}
                {currentTab === 1 && <TrainingMatrixTab />}
                {currentTab === 2 && <TimelineTab />}
            </Box>
        </Box>
    );
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <CircularProgress />
            </Box>
        }>
            <ReportsPageContent />
        </Suspense>
    );
}
