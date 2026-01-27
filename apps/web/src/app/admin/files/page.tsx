'use client';

import React from 'react';
import { Box, Typography, Button, Grid } from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const PRIMARY_COLOR_TRANSPARENT_LIGHT = 'hsl(var(--primary) / 0.15)';
const ERROR_COLOR_TRANSPARENT_LIGHT = 'hsl(var(--destructive) / 0.15)';
const SUCCESS_COLOR_TRANSPARENT_LIGHT = 'hsl(var(--success) / 0.15)';
const INFO_COLOR_TRANSPARENT_LIGHT = 'hsl(var(--info) / 0.15)';
const ERROR_COLOR_MAIN = 'hsl(var(--destructive))';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
const INFO_COLOR_MAIN = 'hsl(var(--info))';
const BORDER_COLOR_TRANSPARENT = 'hsl(var(--border) / 0.1)';
const CARD_BG_TRANSPARENT_LIGHT = 'hsl(var(--card) / 0.05)';
const WARNING_COLOR = 'hsl(var(--warning))';

import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import ImageIcon from '@mui/icons-material/Image';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const folders = [
    { name: 'Course Materials', files: 156, size: '2.3 GB' },
    { name: 'User Uploads', files: 89, size: '1.1 GB' },
    { name: 'Certificates', files: 45, size: '120 MB' },
    { name: 'Assignments', files: 234, size: '890 MB' },
];

const stats = [
    { label: 'Images', value: 234, icon: <ImageIcon />, color: 'primary' },
    { label: 'Videos', value: 56, icon: <VideoFileIcon />, color: 'error' },
    { label: 'Documents', value: 189, icon: <InsertDriveFileIcon />, color: 'success' },
    { label: 'Storage Used', value: '4.5 GB', icon: <FolderIcon />, color: 'info' },
];

export default function FilesPage() {
    const { mode } = useThemeMode();
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: TEXT_COLOR, letterSpacing: '-0.02em' }}>
                    Files & Assets
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: ICON_COLOR,
                        color: 'hsl(var(--primary-foreground))',
                        borderRadius: '12px',
                        px: 3,
                        height: 44,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary) / 0.9)',
                            transform: 'translateY(-2px)'
                        },
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                        } : {})
                    }}
                >
                    Upload Files
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
                        <GlassCard sx={{
                            p: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            border: mode === 'liquid-glass' ? 'none' : `1px solid ${BORDER_COLOR_TRANSPARENT}`,
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                                borderRadius: '24px',
                            } : {})
                        }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : (stat.color === 'primary' ? PRIMARY_COLOR_TRANSPARENT_LIGHT : stat.color === 'error' ? ERROR_COLOR_TRANSPARENT_LIGHT : stat.color === 'success' ? SUCCESS_COLOR_TRANSPARENT_LIGHT : INFO_COLOR_TRANSPARENT_LIGHT),
                                color: stat.color === 'primary' ? ICON_COLOR : stat.color === 'error' ? ERROR_COLOR_MAIN : stat.color === 'success' ? SUCCESS_COLOR_MAIN : INFO_COLOR_MAIN,
                                display: 'flex'
                            }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} sx={{ color: TEXT_COLOR }}>{stat.value}</Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>{stat.label}</Typography>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: TEXT_COLOR }}>Folders</Typography>
            <Grid container spacing={3}>
                {folders.map((folder) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={folder.name}>
                        <GlassCard
                            sx={{
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                border: mode === 'liquid-glass' ? 'none' : `1px solid ${BORDER_COLOR_TRANSPARENT}`,
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    borderColor: ICON_COLOR,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : CARD_BG_TRANSPARENT_LIGHT
                                },
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    borderRadius: '24px',
                                } : {})
                            }}
                        >
                            <Box sx={{ p: 3, textAlign: 'center' }}>
                                <FolderIcon sx={{ fontSize: 48, color: WARNING_COLOR, mb: 2 }} />
                                <Typography variant="subtitle1" fontWeight={700} sx={{ color: TEXT_COLOR }}>{folder.name}</Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT, mt: 0.5 }}>{folder.files} files • {folder.size}</Typography>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
}
