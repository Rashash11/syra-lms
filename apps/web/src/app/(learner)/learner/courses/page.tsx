'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions, Button, LinearProgress,
    Chip, TextField, InputAdornment, Tabs, Tab, Paper, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@shared/theme/ThemeContext';

const TEXT_COLOR = 'hsl(var(--foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

const MyCoursesPage = () => {
    const { mode } = useThemeMode();
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<any>(null);
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

    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/learner/enrollments`);
            if (res.ok) {
                const json = await res.json();
                const list = Array.isArray(json) ? json : (json?.data || json?.enrollments || []);

                const searched = searchQuery
                    ? list.filter((e: any) => {
                        const title = (e.course?.title || '').toString().toLowerCase();
                        return title.includes(searchQuery.toLowerCase());
                    })
                    : list;

                const categorized = searched.filter((e: any) => {
                    if (filter === 'all') return true;
                    const completed = Boolean(e.completedAt);
                    const progress = Number(e.progress || 0);
                    if (filter === 'completed') return completed;
                    if (filter === 'in_progress') return !completed && progress > 0;
                    if (filter === 'not_started') return !completed && progress === 0;
                    return true;
                });

                const total = list.length;
                const completed = list.filter((e: any) => Boolean(e.completedAt)).length;
                const inProgress = list.filter((e: any) => !e.completedAt && Number(e.progress || 0) > 0).length;
                setEnrollments(categorized);
                setStats({ total, completed, inProgress });
            }
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    }, [filter, searchQuery]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchEnrollments();
        }, 300); // Debounce search
        return () => clearTimeout(timer);
    }, [fetchEnrollments]);

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 3, color: TEXT_COLOR }}>My Courses</Typography>

            {/* Stats */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Total Enrolled', value: stats?.total || 0, color: 'primary', icon: <SchoolIcon /> },
                    { label: 'In Progress', value: stats?.inProgress || 0, color: 'warning', icon: <AccessTimeIcon /> },
                    { label: 'Completed', value: stats?.completed || 0, color: 'success', icon: <CheckCircleIcon /> },
                ].map((stat) => (
                    <Grid size={{ xs: 4 }} key={stat.label}>
                        <Paper
                            sx={{
                                p: 2,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                ...(mode === 'liquid-glass' ? glassStyle : {})
                            }}
                        >
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : `${stat.color}.lighter`,
                                    color: mode === 'liquid-glass' ? '#FFFFFF' : `${stat.color}.main`
                                }}
                            >
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700} color={TEXT_COLOR}>{stat.value}</Typography>
                                <Typography variant="caption" color={SECONDARY_TEXT}>{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Filters */}
            <Paper
                sx={{
                    p: 2,
                    mb: 3,
                    ...(mode === 'liquid-glass' ? glassStyle : {})
                }}
            >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small" placeholder="Search courses..."
                        value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: SECONDARY_TEXT }} />
                                </InputAdornment>
                            )
                        }}
                        sx={{
                            width: 300,
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                '& fieldset': { borderColor: DIVIDER },
                                '&:hover fieldset': { borderColor: SECONDARY_TEXT },
                            }
                        }}
                    />
                    <Tabs
                        value={filter}
                        onChange={(_, v) => setFilter(v)}
                        sx={{
                            '& .MuiTab-root': { color: SECONDARY_TEXT },
                            '& .Mui-selected': { color: TEXT_COLOR },
                            '& .MuiTabs-indicator': { bgcolor: mode === 'liquid-glass' ? '#FFFFFF' : 'primary.main' }
                        }}
                    >
                        <Tab label="All" value="all" />
                        <Tab label="In Progress" value="in_progress" />
                        <Tab label="Completed" value="completed" />
                        <Tab label="Not Started" value="not_started" />
                    </Tabs>
                </Box>
            </Paper>

            {/* Courses Grid */}
            {loading && enrollments.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress sx={{ color: TEXT_COLOR }} />
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {enrollments.map((enrollment) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={enrollment.id}>
                            <Card sx={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                position: 'relative',
                                overflow: 'hidden',
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    borderRadius: '24px',
                                } : {}),
                                '&:hover .description-overlay': {
                                    opacity: 1,
                                    transform: 'translateY(0)',
                                }
                            }}>
                                <Box sx={{
                                    height: 100,
                                    bgcolor: mode === 'liquid-glass'
                                        ? 'rgba(255, 255, 255, 0.1)'
                                        : (enrollment.status === 'COMPLETED' ? 'success.main' : enrollment.status === 'IN_PROGRESS' ? 'primary.main' : 'grey.400'),
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    position: 'relative',
                                    borderBottom: `1px solid ${DIVIDER}`
                                }}>
                                    {enrollment.status === 'COMPLETED' && <CheckCircleIcon sx={{ fontSize: 48, color: mode === 'liquid-glass' ? 'success.main' : 'white' }} />}
                                    {enrollment.status === 'IN_PROGRESS' && <Typography variant="h4" color={mode === 'liquid-glass' ? 'primary.main' : 'white'}>?</Typography>}
                                    {enrollment.status === 'NOT_STARTED' && <SchoolIcon sx={{ fontSize: 48, color: mode === 'liquid-glass' ? 'grey.400' : 'white' }} />}
                                </Box>

                                {/* Hover Overlay */}
                                <Box
                                    className="description-overlay"
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: mode === 'liquid-glass' ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.85)',
                                        color: 'white',
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        opacity: 0,
                                        transform: 'translateY(100%)',
                                        transition: 'all 0.3s ease-in-out',
                                        zIndex: 2,
                                    }}
                                >
                                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                                        Description
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 5,
                                        WebkitBoxOrient: 'vertical',
                                        color: 'rgba(255,255,255,0.9)',
                                        lineHeight: 1.6,
                                        mb: 1
                                    }}>
                                        {enrollment.course.description || 'No description available for this course.'}
                                    </Typography>
                                    {enrollment.course.description && enrollment.course.description.length > 200 && (
                                        <Button
                                            size="small"
                                            variant="text"
                                            sx={{ color: '#64b5f6', alignSelf: 'flex-start', p: 0, textTransform: 'none' }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedCourse(enrollment.course);
                                            }}
                                        >
                                            Show more...
                                        </Button>
                                    )}
                                </Box>

                                <CardContent sx={{ flex: 1 }}>
                                    <Typography variant="h6" gutterBottom color={TEXT_COLOR}>{enrollment.course.title}</Typography>
                                    <Chip
                                        label={enrollment.status.replace('_', ' ')}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            mb: 2,
                                            color: TEXT_COLOR,
                                            borderColor: DIVIDER
                                        }}
                                    />

                                    <Box sx={{ mb: 2 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={enrollment.status === 'COMPLETED' ? 100 : (enrollment.status === 'IN_PROGRESS' ? 50 : 0)}
                                            sx={{
                                                height: 8,
                                                borderRadius: 4,
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'grey.200'
                                            }}
                                            color={enrollment.status === 'COMPLETED' ? 'success' : 'primary'}
                                        />
                                    </Box>

                                    <Typography variant="caption" color={SECONDARY_TEXT}>Course Code: {enrollment.course.code}</Typography>
                                </CardContent>
                                <CardActions sx={{ p: 2, pt: 0, zIndex: 3 }}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={enrollment.status === 'COMPLETED' ? <CheckCircleIcon /> : <PlayArrowIcon />}
                                        onClick={() => router.push(`/learner/courses/${enrollment.courseId}`)}
                                        sx={{
                                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : (enrollment.status === 'COMPLETED' ? 'success.main' : 'primary.main'),
                                            color: '#FFFFFF',
                                            textTransform: 'none',
                                            fontWeight: 600,
                                            '&:hover': {
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : (enrollment.status === 'COMPLETED' ? 'success.dark' : 'primary.dark'),
                                            },
                                            ...(mode === 'liquid-glass' ? {
                                                backdropFilter: 'blur(4px)',
                                                border: '1px solid rgba(255, 255, 255, 0.4)',
                                            } : {})
                                        }}
                                    >
                                        {enrollment.status === 'COMPLETED' ? 'Review' : enrollment.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}

                    {enrollments.length === 0 && !loading && (
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <Typography variant="h6" color={SECONDARY_TEXT}>No courses found matching your criteria</Typography>
                            </Box>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Description Dialog */}
            <Dialog
                open={Boolean(selectedCourse)}
                onClose={() => setSelectedCourse(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                            '& .MuiDialogTitle-root': { color: TEXT_COLOR },
                            '& .MuiDialogContent-root': { color: TEXT_COLOR, borderColor: DIVIDER },
                            '& .MuiDialogActions-root': { borderTop: `1px solid ${DIVIDER}` },
                        } : {
                            borderRadius: '12px',
                        })
                    }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: TEXT_COLOR }}>
                    <Typography variant="h6" fontWeight="bold">{selectedCourse?.title}</Typography>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: DIVIDER }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>Course Description</Typography>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: TEXT_COLOR }}>
                        {selectedCourse?.description}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setSelectedCourse(null)}
                        sx={{
                            color: TEXT_COLOR,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary) / 0.1)' }
                        }}
                    >
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyCoursesPage;
