'use client';

import React, { useState } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import LogoMarquee from '@modules/courses/store/LogoMarquee';
import StoreSection from '@modules/courses/store/StoreSection';
import { marqueeLogos, sections } from '@modules/courses/store/mock';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

export default function CourseStorePage() {
    const { mode } = useThemeMode();
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [addedCourse, setAddedCourse] = useState('');

    const handleAddCourse = (courseId: string) => {
        setAddedCourse(courseId);
        setSnackbarOpen(true);
    };

    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };

    return (
        <Box sx={{ p: 4, maxWidth: '1400px', margin: '0 auto' }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" sx={{ fontWeight: 800, color: TEXT_COLOR, mb: 2, letterSpacing: '-0.02em' }}>
                    Course store
                </Typography>
                <Typography variant="h6" sx={{ color: MUTED_TEXT, fontWeight: 500, maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
                    Find the right courses for every learning need. From soft skills to compliance and beyond, we have got you covered.
                </Typography>
            </Box>

            <Box sx={{ mb: 6 }}>
                <LogoMarquee />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {sections.map((section) => (
                    <StoreSection
                        key={section.id}
                        title={section.title}
                        chips={section.chips}
                        description={section.description}
                        viewAllUrl={section.viewAllUrl}
                        courses={section.courses}
                        onAddCourse={handleAddCourse}
                    />
                ))}
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseSnackbar} 
                    severity="success" 
                    sx={{ 
                        width: '100%',
                        borderRadius: '12px',
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary) / 0.9)',
                        color: mode === 'liquid-glass' ? TEXT_COLOR : 'white',
                        backdropFilter: 'blur(10px)',
                        border: `1px solid ${DIVIDER}`,
                        '& .MuiAlert-icon': { color: mode === 'liquid-glass' ? ICON_COLOR : 'white' },
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                        } : {})
                    }}
                >
                    Course added to your selection!
                </Alert>
            </Snackbar>
        </Box>
    );
}
