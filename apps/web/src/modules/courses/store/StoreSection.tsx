'use client';

import React from 'react';
import { Box, Typography, Chip, Button } from '@mui/material';
import Link from '@shared/ui/AppLink';
import StoreCarousel from './StoreCarousel';
import type { Course } from '@modules/courses/store/mock';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface StoreSectionProps {
    title: string;
    chips: string[];
    description: string;
    viewAllUrl: string;
    courses: Course[];
    onAddCourse?: (id: string) => void;
}

export default function StoreSection({
    title,
    chips,
    description,
    viewAllUrl,
    courses,
    onAddCourse,
}: StoreSectionProps) {
    // Parse description to handle <link> tags
    const parseDescription = (text: string) => {
        const parts = text.split(/<link>|<\/link>/);
        return parts.map((part, index) => {
            if (index % 2 === 1) {
                // This is inside <link> tags
                return (
                    <span 
                        key={index} 
                        style={{ 
                            color: ICON_COLOR, 
                            textDecoration: 'none', 
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    };

    return (
        <Box sx={{ mt: 6 }}>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start', 
                mb: 1,
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 2
            }}>
                <Box>
                    <Typography 
                        variant="h5" 
                        sx={{ 
                            fontWeight: 700, 
                            color: TEXT_COLOR, 
                            letterSpacing: '-0.01em',
                            mb: 1
                        }}
                    >
                        {title}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                        {chips.map((chip, index) => (
                            <Chip 
                                key={index} 
                                label={chip} 
                                size="small"
                                sx={{ 
                                    bgcolor: 'hsl(var(--primary) / 0.08)',
                                    color: ICON_COLOR,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    height: '22px',
                                    borderRadius: '6px',
                                    border: `1px solid hsl(var(--primary) / 0.1)`
                                }}
                            />
                        ))}
                    </Box>
                </Box>
                <Button
                    variant="outlined"
                    component={Link}
                    href={viewAllUrl}
                    sx={{
                        height: '36px',
                        borderRadius: '10px',
                        px: 2,
                        borderColor: 'hsl(var(--primary) / 0.3)',
                        color: ICON_COLOR,
                        textTransform: 'none',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        '&:hover': {
                            borderColor: ICON_COLOR,
                            bgcolor: 'hsl(var(--primary) / 0.04)',
                        },
                    }}
                >
                    View all
                </Button>
            </Box>
            <Typography 
                variant="body1" 
                sx={{ 
                    color: MUTED_TEXT, 
                    lineHeight: 1.6, 
                    mb: 3,
                    maxWidth: '900px'
                }}
            >
                {parseDescription(description)}
            </Typography>
            <StoreCarousel courses={courses} onAddCourse={onAddCourse} />
        </Box>
    );
}
