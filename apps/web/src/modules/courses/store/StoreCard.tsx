'use client';

import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface StoreCardProps {
    id: string;
    title: string;
    code: string;
    price: string;
    imageUrl: string;
    onAdd?: (id: string) => void;
}

export default function StoreCard({ id, title, code, price, imageUrl, onAdd }: StoreCardProps) {
    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAdd?.(id);
    };

    return (
        <GlassCard 
            interactive 
            cornerRadius={16}
            sx={{ 
                width: '260px',
                flexShrink: 0,
                border: `1px solid ${DIVIDER}`,
                overflow: 'hidden',
                p: 0
            }}
        >
            <Box sx={{ position: 'relative', height: '150px', width: '100%', overflow: 'hidden' }}>
                <Box 
                    component="img" 
                    src={imageUrl} 
                    alt={title}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <Chip 
                    label={price}
                    sx={{ 
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        bgcolor: 'hsl(var(--primary) / 0.9)',
                        color: 'white',
                        fontWeight: 700,
                        backdropFilter: 'blur(4px)',
                        height: '24px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        border: `1px solid ${DIVIDER}`
                    }}
                />
                <IconButton 
                    onClick={handleAddClick} 
                    size="small"
                    sx={{ 
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        width: '40px',
                        height: '40px',
                        bgcolor: ICON_COLOR,
                        color: 'white',
                        boxShadow: '0 4px 12px hsl(var(--primary) / 0.3)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary) / 0.8)',
                            transform: 'scale(1.05)'
                        },
                        transition: 'all 0.2s'
                    }}
                >
                    <AddIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box sx={{ p: 2.5 }}>
                <Typography 
                    variant="subtitle1" 
                    sx={{ 
                        fontWeight: 600, 
                        color: TEXT_COLOR,
                        lineHeight: 1.3,
                        mb: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        height: '2.6em'
                    }}
                >
                    {title}
                </Typography>
                <Typography variant="caption" sx={{ color: MUTED_TEXT, display: 'block' }}>
                    {code}
                </Typography>
            </Box>
        </GlassCard>
    );
}
