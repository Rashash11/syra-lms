'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Card, CardContent, CardMedia, CardActionArea, Skeleton, Stack, Chip, Divider, IconButton } from '@mui/material';
import Grid from '@mui/material/Grid';
import CelebrationIcon from '@mui/icons-material/Celebration';
import AddIcon from '@mui/icons-material/Add';
import GroupsIcon from '@mui/icons-material/Groups';
import VideocamIcon from '@mui/icons-material/Videocam';
import ChatIcon from '@mui/icons-material/Chat';
import TableChartIcon from '@mui/icons-material/TableChart';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { useRouter } from 'next/navigation';

interface Course {
    id: string;
    title: string;
    code: string;
    image: string | null;
}

export default function InstructorDashboard() {
    const { mode } = useThemeMode();
    const router = useRouter();

    const TEXT_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.9)' : 'text.primary';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary';
    const ICON_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'primary.main';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider';
    const CARD_BG = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'background.paper';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [user, setUser] = useState<any>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [totalCourses, setTotalCourses] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch user data
        fetch('/api/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setUser(data.user);
                }
            })
            .catch(err => console.error('Failed to fetch user:', err));

        // Fetch instructor courses
        fetch('/api/instructor/courses?limit=3')
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setCourses(data.data);
                    setTotalCourses(data.pagination?.total || data.data.length);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch courses:', err);
                setLoading(false);
            });
    }, []);

    const handleCourseClick = (courseId: string) => {
        router.push(`/instructor/courses/${courseId}`);
    };

    const firstName = user?.firstName || 'mostafa';
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CelebrationIcon sx={{ color: '#F58220', fontSize: 24 }} />
                    <Typography variant="h5" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                        Welcome, {firstName}!
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    size="small"
                    endIcon={<KeyboardArrowDownIcon />}
                    sx={{
                        textTransform: 'none',
                        color: TEXT_COLOR,
                        borderColor: DIVIDER,
                        fontSize: 14,
                        fontWeight: 500,
                        px: 2,
                        ...(mode === 'liquid-glass' ? {
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                            '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 0.2)',
                                borderColor: 'rgba(255, 255, 255, 0.6)',
                            }
                        } : {
                            '&:hover': {
                                bgcolor: 'hsl(var(--card) / 0.6)',
                                borderColor: 'divider',
                            }
                        })
                    }}
                >
                    Customize
                </Button>
            </Box>

            {/* Recent course activity */}
            <Card sx={{
                mb: 4,
                borderRadius: 2,
                ...(mode === 'liquid-glass' ? glassStyle : {
                    border: '1px solid hsl(var(--border))',
                    boxShadow: 'none',
                })
            }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, cursor: 'pointer' }}>
                        <Typography variant="h6" fontWeight={600} fontSize={17} sx={{ color: TEXT_COLOR, mr: 1 }}>
                            Recent course activity
                        </Typography>
                        <ArrowForwardIcon sx={{ color: SECONDARY_TEXT, fontSize: 20 }} />
                    </Box>

                    {loading ? (
                        <Grid container spacing={3}>
                            {[1, 2, 3].map((i) => (
                                <Grid size={{ xs: 12, sm: 4 }} key={i}>
                                    <Skeleton variant="rectangular" height={180} sx={{
                                        borderRadius: 2,
                                        ...(mode === 'liquid-glass' && { bgcolor: 'rgba(255,255,255,0.1)' })
                                    }} />
                                </Grid>
                            ))}
                        </Grid>
                    ) : courses.length > 0 ? (
                        <Grid container spacing={3}>
                            {courses.map((course) => (
                                <Grid size={{ xs: 12, sm: 4 }} key={course.id}>
                                    <Card
                                        sx={{
                                            borderRadius: 2,
                                            height: '100%',
                                            ...(mode === 'liquid-glass' ? {
                                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            } : {
                                                border: '1px solid hsl(var(--border))',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                                }
                                            })
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleCourseClick(course.id)}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={course.image || '/placeholder-course.jpg'}
                                                alt={course.title}
                                                sx={{
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--card))',
                                                    opacity: mode === 'liquid-glass' ? 0.8 : 1
                                                }}
                                            />
                                            <Box sx={{ p: 2 }}>
                                                <Typography variant="body1" fontWeight={600} fontSize={15} sx={{ color: TEXT_COLOR }} noWrap>
                                                    {course.title}
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: SECONDARY_TEXT }} fontSize={13}>
                                                    {course.code}
                                                </Typography>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                            {courses.length < 3 && (
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <Card
                                        sx={{
                                            borderRadius: 2,
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            ...(mode === 'liquid-glass' ? {
                                                bgcolor: 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                boxShadow: 'none',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            } : {
                                                border: '1px solid hsl(var(--border))',
                                                boxShadow: 'none',
                                                bgcolor: 'hsl(var(--card))',
                                            })
                                        }}
                                        onClick={() => router.push('/instructor/courses/new/edit')}
                                    >
                                        <Box sx={{ textAlign: 'center', p: 3 }}>
                                            <Box sx={{ color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.6)' : 'secondary.main', mb: 2 }}>
                                                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                                    <path d="M24 8L34 24L24 40L14 24L24 8Z" fill="currentColor" />
                                                </svg>
                                            </Box>
                                            <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                                                New course
                                            </Typography>
                                        </Box>
                                    </Card>
                                </Grid>
                            )}
                        </Grid>
                    ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" sx={{ color: SECONDARY_TEXT }}>
                                No recent course activity. Create your first course!
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Middle Section: Overview and Quick actions */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Overview */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        borderRadius: 2,
                        height: '100%',
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid hsl(var(--border))',
                            boxShadow: 'none',
                        })
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ color: TEXT_COLOR, mb: 2 }}>
                                Overview
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <MenuBookIcon sx={{ color: SECONDARY_TEXT, fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, flex: 1 }}>Courses</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>{totalCourses}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PeopleIcon sx={{ color: SECONDARY_TEXT, fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, flex: 1 }}>Assigned learners</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>0</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ color: SECONDARY_TEXT, fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, flex: 1 }}>Completion rate</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>0.00%</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon sx={{ color: SECONDARY_TEXT, fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, flex: 1 }}>Training time</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>0h 0m</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AssessmentIcon sx={{ color: SECONDARY_TEXT, fontSize: 20, mr: 1.5 }} />
                                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, flex: 1 }}>Average progress</Typography>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>0.00%</Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Quick actions */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        borderRadius: 2,
                        height: '100%',
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid hsl(var(--border))',
                            boxShadow: 'none',
                        })
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ color: TEXT_COLOR, mb: 2 }}>
                                Quick actions
                            </Typography>
                            <Stack spacing={1}>
                                {[
                                    { label: 'Add course', icon: <AddIcon />, path: '/instructor/courses/new/edit' },
                                    { label: 'Add group', icon: <GroupsIcon />, path: '/instructor/groups' },
                                    { label: 'Add conference', icon: <VideocamIcon />, path: '/instructor/conferences' },
                                    { label: 'Add discussion', icon: <ChatIcon />, path: '/instructor/discussions' },
                                    { label: 'Training matrix', icon: <TableChartIcon />, path: '/instructor/reports' },
                                ].map((action) => (
                                    <Box
                                        key={action.label}
                                        onClick={() => router.push(action.path)}
                                        sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                            p: 1,
                                            borderRadius: 1,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--card))' }
                                        }}
                                    >
                                        <Box sx={{ color: TEXT_COLOR, display: 'flex' }}>
                                            {React.cloneElement(action.icon as React.ReactElement, { sx: { fontSize: 20 } })}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: TEXT_COLOR }} fontWeight={500}>
                                            {action.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Bottom Section: Don't miss and Today */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Don't miss */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        borderRadius: 2,
                        height: '100%',
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid #DFE1E6',
                            boxShadow: 'none',
                        })
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ color: TEXT_COLOR, mb: 2 }}>
                                Don't miss
                            </Typography>
                            <Stack spacing={2}>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.4)' : 'hsl(var(--foreground))', mt: 1 }} />
                                    <Typography variant="body2" sx={{ color: TEXT_COLOR }}>
                                        You have <strong>no items</strong> pending grading. <Button variant="text" size="small" sx={{
                                            textTransform: 'none',
                                            p: 0,
                                            minWidth: 0,
                                            fontWeight: 500,
                                            color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.8)' : '#0052CC',
                                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                                        }}>Go to Grading Hub</Button>
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.4)' : 'hsl(var(--foreground))', mt: 1 }} />
                                    <Typography variant="body2" sx={{ color: TEXT_COLOR }}>
                                        You have <strong>no courses</strong> that are expiring soon.
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.4)' : 'hsl(var(--foreground))', mt: 1 }} />
                                    <Typography variant="body2" sx={{ color: TEXT_COLOR }}>
                                        You are <strong>not registered</strong> to attend any online sessions today.
                                    </Typography>
                                </Box>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Today */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        borderRadius: 2,
                        height: '100%',
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid hsl(var(--border))',
                            boxShadow: 'none',
                        })
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ color: TEXT_COLOR }}>
                                    Today
                                </Typography>
                                <Typography variant="body2" sx={{ color: SECONDARY_TEXT }}>
                                    {formattedDate}, {formattedTime}
                                </Typography>
                            </Stack>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                                <CalendarTodayIcon sx={{ color: ICON_COLOR, fontSize: 40, mb: 1.5, opacity: 0.8 }} />
                                <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                                    Nothing happening today
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Charts Section */}
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{
                        border: '1px solid #DFE1E6',
                        borderRadius: 2,
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid hsl(var(--border))',
                            boxShadow: 'none',
                        })
                    }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} sx={{ color: TEXT_COLOR, mr: 1 }}>
                                    Courses' progress status
                                </Typography>
                                <ArrowForwardIcon sx={{ color: SECONDARY_TEXT, fontSize: 18, cursor: 'pointer' }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                                <MenuBookIcon sx={{ color: ICON_COLOR, fontSize: 48, mb: 2, opacity: 0.8 }} />
                                <Typography variant="h6" fontWeight={600} fontSize={18} sx={{ color: TEXT_COLOR, mb: 1 }}>
                                    No stats to show
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    Create your first course now
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => router.push('/instructor/courses')}
                                    sx={{ textTransform: 'none', color: '#0052CC', fontWeight: 600 }}
                                >
                                    Go to courses
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Card sx={{ border: '1px solid #DFE1E6', boxShadow: 'none', borderRadius: 2 }}>
                        <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" fontWeight={600} fontSize={16} color="#172B4D" sx={{ mr: 1 }}>
                                    Courses' completion rate
                                </Typography>
                                <ArrowForwardIcon sx={{ color: '#6B778C', fontSize: 18, cursor: 'pointer' }} />
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, mb: 2, height: 48 }}>
                                    <Box sx={{ width: 12, height: 20, bgcolor: 'hsl(var(--primary) / 0.6)', borderRadius: '2px 2px 0 0' }} />
                                    <Box sx={{ width: 12, height: 40, bgcolor: 'hsl(var(--primary) / 0.8)', borderRadius: '2px 2px 0 0' }} />
                                    <Box sx={{ width: 12, height: 30, bgcolor: 'hsl(var(--primary) / 0.6)', borderRadius: '2px 2px 0 0' }} />
                                </Box>
                                <Typography variant="h6" fontWeight={600} fontSize={18} color="#172B4D" sx={{ mb: 1 }}>
                                    No stats to show
                                </Typography>
                                <Typography variant="body2" color="#6B778C" sx={{ mb: 2 }}>
                                    Create your first course now
                                </Typography>
                                <Button
                                    variant="text"
                                    onClick={() => router.push('/instructor/courses')}
                                    sx={{ textTransform: 'none', color: '#0052CC', fontWeight: 600 }}
                                >
                                    Go to courses
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Footer */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6, pb: 4 }}>
                {/* Removed Powered by TalentLMS */}
            </Box>
        </Box>
    );
}
