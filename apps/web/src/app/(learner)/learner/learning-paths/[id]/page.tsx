'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Card, CardContent, Button, LinearProgress,
    Chip, Paper, CircularProgress, IconButton, Avatar, Divider, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import Grid from '@mui/material/Grid';
import { useRouter, useParams } from 'next/navigation';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { apiFetch } from '@shared/http/apiFetch';

export default function LearningPathDetailPage() {
    const { mode } = useThemeMode();
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [path, setPath] = useState<any>(null);
    const [courseEnrollments, setCourseEnrollments] = useState<Record<string, any>>({});
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
        const fetchData = async () => {
            try {
                // Fetch path details
                const pathData = await apiFetch<any>(`/api/learning-paths/${id}`);
                setPath(pathData);

                // Fetch learner's course enrollments to show progress
                const enrollData = await apiFetch<any>('/api/learner/enrollments');
                const enrollList = Array.isArray(enrollData) ? enrollData : (enrollData.data || []);
                const enrollMap: Record<string, any> = {};
                enrollList.forEach((e: any) => {
                    enrollMap[e.courseId] = e;
                });
                setCourseEnrollments(enrollMap);
            } catch (error) {
                console.error('Failed to fetch learning path details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: 'background.default' }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    if (!path) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5">Learning Path not found</Typography>
                <Button onClick={() => router.push('/learner/learning-paths')}>Back to My Paths</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ pb: 8 }}>
            {/* Header Area */}
            <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton
                    onClick={() => router.push('/learner/learning-paths')}
                    sx={{ color: TEXT_COLOR, border: `1px solid ${DIVIDER}`, bgcolor: 'hsl(var(--card) / 0.3)' }}
                >
                    <ArrowBackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight={800} sx={{ color: TEXT_COLOR, letterSpacing: '-0.02em' }}>
                        {path.name}
                    </Typography>
                    <Typography variant="body2" color={SECONDARY_TEXT}>
                        {path.description || 'Complete all courses in this path to achieve your goal.'}
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={4}>
                {/* Left Side: Path Content */}
                <Grid size={{ xs: 12, md: 8 }}>
                    {path.sections?.sort((a: any, b: any) => a.order - b.order).map((section: any) => (
                        <Box key={section.id} sx={{ mb: 4 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: TEXT_COLOR }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'hsl(var(--primary))' }} />
                                {section.name}
                            </Typography>
                            <Paper sx={{
                                borderRadius: 4,
                                overflow: 'hidden',
                                border: `1px solid ${DIVIDER}`,
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                ...glassStyle
                            }}>
                                <List disablePadding>
                                    {section.courses?.sort((a: any, b: any) => a.order - b.order).map((pc: any, idx: number) => {
                                        const enrollment = courseEnrollments[pc.courseId];
                                        const isCompleted = enrollment?.status === 'COMPLETED';
                                        const progress = enrollment?.progress || 0;
                                        const isEnrolled = !!enrollment;

                                        return (
                                            <React.Fragment key={pc.id}>
                                                <ListItem sx={{ py: 3, px: 3 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, width: '100%' }}>
                                                        <Avatar sx={{
                                                            bgcolor: isCompleted ? 'success.main' : 'hsl(var(--muted) / 0.2)',
                                                            color: isCompleted ? 'white' : TEXT_COLOR,
                                                            width: 40, height: 40,
                                                            fontSize: 16, fontWeight: 700,
                                                            border: `2px solid ${isCompleted ? 'transparent' : DIVIDER}`
                                                        }}>
                                                            {isCompleted ? <CheckCircleIcon /> : idx + 1}
                                                        </Avatar>
                                                        <Box sx={{ flexGrow: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight={700} color={TEXT_COLOR}>
                                                                {pc.course?.title}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                                                                <Typography variant="caption" color={SECONDARY_TEXT}>
                                                                    Code: {pc.course?.code}
                                                                </Typography>
                                                                {isEnrolled && (
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Box sx={{ width: 60, height: 4, bgcolor: 'hsl(var(--muted) / 0.2)', borderRadius: 2 }}>
                                                                            <Box sx={{ width: `${progress}%`, height: '100%', bgcolor: isCompleted ? 'success.main' : 'primary.main', borderRadius: 2 }} />
                                                                        </Box>
                                                                        <Typography variant="caption" fontWeight={700} color={isCompleted ? 'success.main' : 'primary.main'}>
                                                                            {progress}%
                                                                        </Typography>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        <Button
                                                            variant={isCompleted ? "outlined" : "contained"}
                                                            startIcon={isCompleted ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                                            onClick={() => router.push(`/learner/courses/${pc.courseId}`)}
                                                            color={isCompleted ? "success" : "primary"}
                                                            sx={{
                                                                textTransform: 'none',
                                                                fontWeight: 700,
                                                                borderRadius: 2,
                                                                minWidth: 120
                                                            }}
                                                        >
                                                            {isCompleted ? 'Review' : isEnrolled ? 'Continue' : 'Start'}
                                                        </Button>
                                                    </Box>
                                                </ListItem>
                                                {idx < section.courses.length - 1 && <Divider sx={{ borderColor: DIVIDER }} />}
                                            </React.Fragment>
                                        );
                                    })}
                                </List>
                            </Paper>
                        </Box>
                    ))}
                </Grid>

                {/* Right Side: Path Stats & Info */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper sx={{
                        p: 4,
                        borderRadius: 6,
                        border: `1px solid ${DIVIDER}`,
                        bgcolor: 'hsl(var(--card) / 0.4)',
                        position: 'sticky',
                        top: 100,
                        ...glassStyle
                    }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 3, color: TEXT_COLOR }}>Path Summary</Typography>

                        <Box sx={{ mb: 4 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" color={SECONDARY_TEXT}>Overall Progress</Typography>
                                <Typography variant="body2" fontWeight={800} color={TEXT_COLOR}>
                                    {Math.round((Object.values(courseEnrollments).filter((e: any) => e.status === 'COMPLETED').length / (path.courses?.length || 1)) * 100)}%
                                </Typography>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={(Object.values(courseEnrollments).filter((e: any) => e.status === 'COMPLETED').length / (path.courses?.length || 1)) * 100}
                                sx={{ height: 10, borderRadius: 5, bgcolor: 'hsl(var(--muted) / 0.2)' }}
                            />
                        </Box>

                        <Divider sx={{ my: 3, borderColor: DIVIDER }} />

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                                    <MenuBookOutlinedIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" color={SECONDARY_TEXT} display="block">Total Content</Typography>
                                    <Typography variant="subtitle2" fontWeight={700} color={TEXT_COLOR}>{path.courses?.length || 0} Courses</Typography>
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>
                                    <CheckCircleIcon fontSize="small" />
                                </Avatar>
                                <Box>
                                    <Typography variant="caption" color={SECONDARY_TEXT} display="block">Completed</Typography>
                                    <Typography variant="subtitle2" fontWeight={700} color={TEXT_COLOR}>
                                        {Object.values(courseEnrollments).filter((e: any) => e.status === 'COMPLETED').length} Courses
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<ExploreOutlinedIcon />}
                            sx={{ mt: 4, textTransform: 'none', fontWeight: 600, borderRadius: 3, color: TEXT_COLOR, borderColor: DIVIDER }}
                            onClick={() => router.push('/learner/learning-paths')}
                        >
                            All Learning Paths
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
