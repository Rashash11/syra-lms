'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button, LinearProgress,
    Chip, Paper, CircularProgress, Tooltip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { apiFetch } from '@shared/http/apiFetch';

export default function LearningPathsPage() {
    const { mode } = useThemeMode();
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const router = useRouter();

    const TEXT_COLOR = mode === 'liquid-glass' ? '#FFFFFF' : 'hsl(var(--foreground))';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.12)' : 'hsl(var(--border) / 0.1)';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    useEffect(() => {
        const fetchPaths = async () => {
            try {
                const res = await apiFetch<any>('/api/learner/learning-paths');
                setEnrollments(res.data || []);
            } catch (error) {
                console.error('Failed to fetch learning paths:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPaths();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight={700} sx={{ color: TEXT_COLOR }}>My Learning Paths</Typography>
                <Typography variant="body2" color={SECONDARY_TEXT}>Follow structured curriculum and master new skills.</Typography>
            </Box>

            {enrollments.length === 0 ? (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: 'hsl(var(--card) / 0.3)',
                    borderRadius: 4,
                    border: '1px dashed',
                    borderColor: DIVIDER,
                    ...glassStyle
                }}>
                    <ExploreOutlinedIcon sx={{ fontSize: 64, color: SECONDARY_TEXT, mb: 2, opacity: 0.5 }} />
                    <Typography variant="h6" color={TEXT_COLOR}>No Learning Paths Yet</Typography>
                    <Typography variant="body2" color={SECONDARY_TEXT} sx={{ mb: 3 }}>
                        You haven't been enrolled in any learning paths. Contact your instructor or browse the catalog to find one.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => router.push('/learner/catalog')}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                        Explore Catalog
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={4}>
                    {enrollments.map((enr) => (
                        <Grid size={{ xs: 12, md: 6, lg: 4 }} key={enr.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: mode === 'liquid-glass'
                                        ? '0 12px 24px rgba(0,0,0,0.3)'
                                        : '0 8px 16px rgba(0,0,0,0.1)'
                                },
                                borderRadius: 3,
                                ...glassStyle
                            }}>
                                <Box sx={{
                                    height: 6,
                                    background: `linear-gradient(90deg, hsl(var(--primary)) 0%, #64b5f6 100%)`
                                }} />

                                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                                        <Box sx={{
                                            p: 1.5,
                                            borderRadius: 2,
                                            bgcolor: 'hsl(var(--primary) / 0.1)',
                                            color: 'hsl(var(--primary))',
                                            display: 'flex'
                                        }}>
                                            <ExploreOutlinedIcon />
                                        </Box>
                                        <Chip
                                            label={enr.status.replace('_', ' ')}
                                            size="small"
                                            sx={{
                                                fontSize: '0.7rem',
                                                fontWeight: 700,
                                                borderRadius: 1.5,
                                                height: 24,
                                                color: enr.status === 'COMPLETED' ? 'success.main' : 'primary.main',
                                                bgcolor: enr.status === 'COMPLETED' ? 'success.lighter' : 'primary.lighter',
                                                borderColor: enr.status === 'COMPLETED' ? 'success.light' : 'primary.light',
                                                border: '1px solid'
                                            }}
                                        />
                                    </Box>

                                    <Box>
                                        <Typography variant="h6" fontWeight={700} sx={{
                                            mb: 1,
                                            lineHeight: 1.3,
                                            color: TEXT_COLOR
                                        }}>
                                            {enr.learningPath.name}
                                        </Typography>
                                        <Typography variant="body2" color={SECONDARY_TEXT} sx={{
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                            minHeight: '2.8em'
                                        }}>
                                            {enr.learningPath.description || 'No description provided.'}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ mt: 'auto', pt: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: SECONDARY_TEXT }}>
                                                <MenuBookOutlinedIcon sx={{ fontSize: 14 }} />
                                                <Typography variant="caption" fontWeight={600}>
                                                    {enr.learningPath.courseCount} Courses
                                                </Typography>
                                            </Box>
                                            <Typography variant="caption" fontWeight={700} color={TEXT_COLOR}>
                                                {enr.progress}%
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={enr.progress}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                    bgcolor: enr.status === 'COMPLETED' ? 'success.main' : 'primary.main'
                                                }
                                            }}
                                        />
                                    </Box>
                                </CardContent>

                                <CardActions sx={{ p: 3, pt: 0 }}>
                                    <Button
                                        fullWidth
                                        variant={mode === 'liquid-glass' ? 'outlined' : 'contained'}
                                        startIcon={enr.status === 'COMPLETED' ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                        onClick={() => router.push(`/learner/learning-paths/${enr.pathId}`)}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            boxShadow: 'none',
                                            borderWidth: mode === 'liquid-glass' ? 1 : 0,
                                            borderColor: DIVIDER,
                                            color: mode === 'liquid-glass' ? TEXT_COLOR : 'white',
                                            bgcolor: mode === 'liquid-glass' ? 'transparent' : (enr.status === 'COMPLETED' ? 'success.main' : 'primary.main'),
                                            '&:hover': {
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : (enr.status === 'COMPLETED' ? 'success.dark' : 'primary.dark'),
                                                boxShadow: 'none',
                                                borderWidth: mode === 'liquid-glass' ? 1 : 0
                                            }
                                        }}
                                    >
                                        {enr.status === 'COMPLETED' ? 'Review' : enr.progress > 0 ? 'Continue' : 'Start Path'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}
