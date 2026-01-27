'use client';

import React, { useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Card, CardContent, Button,
    LinearProgress, Chip, CircularProgress, CardActions,
    useTheme
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LayoutIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField,
    Snackbar, Alert
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { apiFetch } from '@shared/http/apiFetch';

export default function LearnerDashboard() {
    const { mode } = useThemeMode();
    const [loading, setLoading] = useState(true);
    const [enrollments, setEnrollments] = useState<any[]>([]);
    const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [lpEnrollments, setLpEnrollments] = useState<any[]>([]);

    // Join Group State
    const [joinDialogOpen, setJoinDialogOpen] = useState(false);
    const [groupKey, setGroupKey] = useState('');
    const [joinLoading, setJoinLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const router = useRouter();

    const TEXT_COLOR = 'hsl(var(--foreground))';
    const ICON_COLOR = 'hsl(var(--primary))';
    const DIVIDER = 'hsl(var(--border) / 0.2)';
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'hsl(var(--glass-bg))',
        border: '1px solid hsl(var(--glass-border))',
        boxShadow: '0 0 20px -5px hsl(var(--glass-glow)), 0 8px 32px -8px hsl(var(--glass-shadow)), inset 0 0 0 1px hsl(var(--glass-border))',
    } : {};

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Use apiFetch instead of direct fetch for automatic credentials and base URL handling
                const [enrollData, assignData, userData, lpData] = await Promise.all([
                    apiFetch<any>('/api/learner/enrollments').catch(() => ({ enrollments: [] })),
                    apiFetch<any>('/api/learner/assignments').catch(() => ({ data: [] })),
                    apiFetch<any>('/api/me').catch(() => ({ user: null })),
                    apiFetch<any>('/api/learner/learning-paths').catch(() => ({ data: [] }))
                ]);

                const enrollList = Array.isArray(enrollData) ? enrollData : (enrollData.data || enrollData.enrollments || []);
                setEnrollments(enrollList);

                const completed = enrollList.filter((e: any) => e.status === 'COMPLETED').length;
                const inProgress = enrollList.filter((e: any) => e.status === 'IN_PROGRESS' || e.status === 'NOT_STARTED').length;
                setStats({ total: enrollList.length, completed, inProgress });

                const assignList = Array.isArray(assignData) ? assignData : Array.isArray(assignData?.data) ? assignData.data : [];
                setUpcomingAssignments(assignList.slice(0, 5));

                if (userData?.user) {
                    setUser(userData.user);
                }

                setLpEnrollments(lpData?.data || []);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                bgcolor: 'background.default',
                ...(mode === 'liquid-glass' && {
                    backdropFilter: 'blur(10px)'
                })
            }}>
                <CircularProgress color="primary" />
            </Box>
        );
    }

    const statCards = [
        { label: 'Enrolled Courses', value: stats?.total || 0, icon: <SchoolIcon />, color: 'primary' },
        { label: 'Learning Paths', value: lpEnrollments.length, icon: <ExploreOutlinedIcon />, color: 'secondary' },
        { label: 'Completed', value: stats?.completed || 0, icon: <CheckCircleIcon />, color: 'success' },
        { label: 'Upcoming Assignments', value: upcomingAssignments.length, icon: <LayoutIcon />, color: 'info' },
    ];

    const handleJoinGroup = async () => {
        setJoinLoading(true);
        try {
            const res = await apiFetch<any>('/api/groups/join', {
                method: 'POST',
                body: JSON.stringify({ key: groupKey })
            });
            setJoinDialogOpen(false);
            setGroupKey('');
            setSnackbar({ open: true, message: `Successfully joined group: ${res.groupName}`, severity: 'success' });
            // Refresh logic - simplified to reload to catch all side effects (course enrollments etc)
            setTimeout(() => window.location.reload(), 1000);
        } catch (err: any) {
            setSnackbar({ open: true, message: err.message || 'Failed to join group', severity: 'error' });
        } finally {
            setJoinLoading(false);
        }
    };

    return (
        <Box sx={{ color: TEXT_COLOR }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box>
                    <Typography variant="h4" fontWeight={700}>Welcome back, {user?.firstName || 'Learner'}!</Typography>
                    <Typography variant="body2" color="text.secondary">Continue your learning journey. You're making great progress!</Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<GroupAddIcon />}
                    onClick={() => setJoinDialogOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                    Join Group
                </Button>
            </Box>

            {/* Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {statCards.map((stat) => (
                    <Grid size={{ xs: 6, md: 3 }} key={stat.label}>
                        <Paper sx={{
                            p: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 2,
                            ...glassStyle,
                            borderRadius: mode === 'liquid-glass' ? '24px' : '12px',
                        }}>
                            <Box sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: 'hsl(var(--primary) / 0.1)',
                                color: ICON_COLOR,
                            }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h5" fontWeight={700}>{stat.value}</Typography>
                                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            {/* Join Group Dialog */}
            <Dialog
                open={joinDialogOpen}
                onClose={() => setJoinDialogOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        ...glassStyle
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Join a Group</DialogTitle>
                <DialogContent sx={{ width: 400, maxWidth: '100%' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Enter the group key provided by your instructor or organization administrator.
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Group Key"
                        variant="outlined"
                        value={groupKey}
                        onChange={(e) => setGroupKey(e.target.value.toUpperCase())}
                        placeholder="e.g. ABCD-1234"
                        disabled={joinLoading}
                    />
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setJoinDialogOpen(false)} disabled={joinLoading}>Cancel</Button>
                    <Button
                        onClick={handleJoinGroup}
                        variant="contained"
                        disabled={!groupKey.trim() || joinLoading}
                    >
                        {joinLoading ? <CircularProgress size={24} /> : 'Join Group'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert
                    severity={snackbar.severity}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            {/* Learning Paths */}
            {lpEnrollments.length > 0 && (
                <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>Enrolled Learning Paths</Typography>
                        <Button size="small" onClick={() => router.push('/learner/learning-paths')}>View All</Button>
                    </Box>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {lpEnrollments.slice(0, 3).map((enr) => (
                            <Grid size={{ xs: 12, md: 4 }} key={enr.id}>
                                <Paper
                                    onClick={() => router.push(`/learner/learning-paths/${enr.pathId}`)}
                                    sx={{
                                        p: 2.5,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: mode === 'liquid-glass'
                                                ? '0 12px 24px rgba(0,0,0,0.3)'
                                                : '0 8px 16px rgba(0,0,0,0.1)'
                                        },
                                        ...glassStyle,
                                        borderRadius: 3,
                                        border: '1px solid',
                                        borderColor: DIVIDER,
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    <Box sx={{
                                        position: 'absolute', top: 0, left: 0, width: 4, height: '100%',
                                        bgcolor: enr.status === 'COMPLETED' ? 'success.main' : 'primary.main'
                                    }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                            <Box sx={{
                                                p: 1,
                                                borderRadius: 2,
                                                bgcolor: 'hsl(var(--primary) / 0.1)',
                                                color: ICON_COLOR
                                            }}>
                                                <ExploreOutlinedIcon />
                                            </Box>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ color: TEXT_COLOR, maxWidth: 180 }}>
                                                    {enr.learningPath.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <MenuBookOutlinedIcon sx={{ fontSize: 12 }} />
                                                    {enr.learningPath.courseCount} Courses
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {enr.status === 'COMPLETED' && (
                                            <CheckCircleIcon color="success" fontSize="small" />
                                        )}
                                    </Box>

                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, alignItems: 'center' }}>
                                            <Typography variant="caption" fontWeight={600} color="text.secondary">Progress</Typography>
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
                                                bgcolor: 'hsl(var(--muted) / 0.2)',
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 3,
                                                    bgcolor: enr.status === 'COMPLETED' ? 'success.main' : ICON_COLOR
                                                }
                                            }}
                                        />
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </>
            )}

            {/* Continue Learning */}
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Continue Learning</Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {enrollments.filter(e => e.status !== 'COMPLETED').map((enrollment) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={enrollment.id}>
                        <Card sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            ...glassStyle,
                            borderRadius: mode === 'liquid-glass' ? '24px' : '12px',
                        }}>
                            <Box sx={{ height: 120, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {enrollment.course.thumbnailUrl ? (
                                    <Box component="img" src={enrollment.course.thumbnailUrl} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Typography variant="h5" color="hsl(var(--primary-foreground))">{enrollment.course.title.split(' ')[0]}</Typography>
                                )}
                            </Box>
                            <CardContent sx={{ flex: 1 }}>
                                <Typography variant="h6" gutterBottom color={TEXT_COLOR}>
                                    {enrollment.course?.title || 'Untitled Course'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    {enrollment.course?.description?.slice(0, 100)}{enrollment.course?.description?.length > 100 ? '...' : ''}
                                </Typography>

                                <Box sx={{ mt: 2, mb: 1 }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Progress: {enrollment.stats?.completedUnits || 0} / {enrollment.stats?.totalUnits || 0} units ({enrollment.stats?.percent || 0}%)
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={enrollment.stats?.percent || 0}
                                        sx={{
                                            mt: 0.5,
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: 'hsl(var(--muted) / 0.3)',
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: 'primary.main'
                                            }
                                        }}
                                    />
                                </Box>

                                <Box sx={{ mt: 1 }}>
                                    <Chip
                                        label={enrollment.status || 'NOT_STARTED'}
                                        size="small"
                                        color={
                                            enrollment.status === 'COMPLETED' ? 'success' :
                                                enrollment.status === 'IN_PROGRESS' ? 'primary' :
                                                    'default'
                                        }
                                    />
                                    {enrollment.resumeState?.lastAccessedAt && (
                                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                            Last active: {new Date(enrollment.resumeState.lastAccessedAt).toLocaleDateString()}
                                        </Typography>
                                    )}
                                </Box>
                            </CardContent>
                            <CardActions sx={{ p: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    startIcon={<PlayArrowIcon />}
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                    }}
                                    onClick={() => {
                                        if (enrollment.resumeState?.lastUnitId) {
                                            router.push(`/learner/courses/${enrollment.courseId}/units/${enrollment.resumeState.lastUnitId}`);
                                        } else {
                                            // Navigate to first unit (will need to fetch units or use a default route)
                                            router.push(`/learner/courses/${enrollment.courseId}`);
                                        }
                                    }}
                                >
                                    {enrollment.resumeState?.lastUnitId ? 'Continue' : 'Start'}
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}

                {enrollments.filter(e => e.status !== 'COMPLETED').length === 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{
                            py: 8,
                            textAlign: 'center',
                            bgcolor: 'hsl(var(--card) / 0.3)',
                            borderRadius: 4,
                            border: '1px dashed',
                            borderColor: DIVIDER
                        }}>
                            <SchoolIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" color={TEXT_COLOR}>No active courses</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Explore our course catalog to start your learning journey.
                            </Typography>
                            <Button
                                variant="contained"
                                onClick={() => router.push('/learner/catalog')}
                            >
                                Browse Catalog
                            </Button>
                        </Box>
                    </Grid>
                )}
            </Grid>

            <Grid container spacing={3}>
                {/* Upcoming Assignments */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card sx={{
                        ...glassStyle,
                        borderRadius: mode === 'liquid-glass' ? '24px' : '12px',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color={TEXT_COLOR}>Upcoming Assignments</Typography>
                                <Button size="small" sx={{ color: ICON_COLOR }} onClick={() => router.push('/learner/assignments')}>View All</Button>
                            </Box>
                            {upcomingAssignments.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {upcomingAssignments.map((assignment) => (
                                        <Paper key={assignment.id} sx={{
                                            p: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            bgcolor: 'hsl(var(--card) / 0.2)',
                                            borderRadius: 2
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <AssignmentIcon sx={{ color: ICON_COLOR }} />
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={600} color={TEXT_COLOR}>{assignment.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {assignment.course?.title || 'General Assignment'} • Due: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString() : 'No date'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    color: ICON_COLOR,
                                                    borderColor: ICON_COLOR
                                                }}
                                                onClick={() => router.push(`/learner/assignments/${assignment.id}`)}
                                            >
                                                Submit
                                            </Button>
                                        </Paper>
                                    ))}
                                </Box>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'hsl(var(--card) / 0.2)', borderRadius: 2 }}>
                                    <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.5 }} />
                                    <Typography color="text.secondary" sx={{ mt: 1 }}>No upcoming assignments</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Achievements */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card sx={{
                        height: '100%',
                        ...glassStyle,
                        borderRadius: mode === 'liquid-glass' ? '24px' : '12px',
                    }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" color={TEXT_COLOR}>Achievements</Typography>
                                <Chip label="Coming Soon" size="small" sx={{ color: TEXT_COLOR, borderColor: DIVIDER }} variant="outlined" />
                            </Box>
                            <Box sx={{ textAlign: 'center', py: 4, bgcolor: 'hsl(var(--card) / 0.2)', borderRadius: 2 }}>
                                <EmojiEventsIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                                <Typography color="text.secondary" sx={{ mt: 1 }}>Disabled</Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}
