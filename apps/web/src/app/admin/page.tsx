'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, CircularProgress, Link, Button, IconButton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CircleIcon from '@mui/icons-material/Circle';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';
import { GlassCard } from '@shared/ui/components/GlassCard';
import { LightRays } from '@shared/ui/components/LightRays';
import { useThemeMode } from '@shared/theme/ThemeContext';

interface DashboardStats {
    activeUsers: number;
    totalUsers: number;
    totalCourses: number;
    publishedCourses: number;
    totalBranches: number;
}

interface TimelineEvent {
    id: string;
    eventType: string;
    details: any;
    timestamp: string;
}

// Donut Chart Component updated with NCOSH theme
function DonutChart({ data, size = 180 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const strokeWidth = 20;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    let currentOffset = 0;

    if (total === 0) {
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth={strokeWidth}
                    className="animate-fade-in"
                />
            </svg>
        );
    }

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {data.map((item, index) => {
                const percentage = item.value / total;
                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += percentage * circumference;

                return (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{ 
                            transition: 'stroke-dasharray 0.5s ease', 
                            strokeLinecap: 'round',
                            animation: 'progressFill 1s ease-out forwards',
                            animationDelay: `${index * 200}ms`
                        }}
                    />
                );
            })}
        </svg>
    );
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        activeUsers: 0,
        totalUsers: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalBranches: 0,
    });
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [recentCourses, setRecentCourses] = useState<any[]>([]);
    const [trainingTime, setTrainingTime] = useState('0h 0m');
    const [currentUser, setCurrentUser] = useState<{ firstName: string; lastName?: string; username: string } | null>(null);

    // User breakdown data - NCOSH theme colors
    const userBreakdown = [
        { label: 'Admins', value: 1, color: 'hsl(var(--primary))' },
        { label: 'Instructors', value: 0, color: 'hsl(var(--secondary))' },
        { label: 'Learners', value: Math.max(0, stats.totalUsers - 1), color: 'hsl(var(--tertiary, 200 80% 50%))' },
    ];

    useEffect(() => {
        fetchDashboardData();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const data = await apiFetch<any>('/api/me');
            if (data.user) {
                setCurrentUser({
                    firstName: data.user.firstName,
                    lastName: data.user.lastName,
                    username: data.user.username,
                });
            }
        } catch (error) {
            if (error instanceof ApiFetchError && error.status === 499) return;
            console.error('Error fetching user info:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const data = await apiFetch<any>('/api/dashboard');
            if (data && data.stats) {
                setStats(data.stats);
            }
            let tl = (data && data.timeline) || [];
            let rc = (data && data.recentCourses) || [];
            if ((!tl || tl.length === 0) && (!rc || rc.length === 0)) {
                try {
                    const cs = await apiFetch<any>('/api/courses?limit=4');
                    const courses = (cs && (cs.courses || cs.data)) || [];
                    rc = courses.slice(0, 4).map((c: any) => ({
                        id: c.id,
                        title: c.title,
                        status: c.status,
                        createdAt: c.createdAt
                    }));
                    tl = rc.map((c: any) => ({
                        id: c.id,
                        eventType: 'COURSE_CREATED',
                        details: { title: c.title },
                        timestamp: c.createdAt
                    }));
                } catch {
                    // ignore fallback errors
                }
            }
            setTimeline(tl);
            setRecentCourses(rc);
            setTrainingTime((data && data.trainingTime) || '0h 0m');
        } catch (error) {
            if (error instanceof ApiFetchError && error.status === 499) return;
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { icon: <PersonAddOutlinedIcon />, label: 'Add user', path: '/admin/users/new' },
        { icon: <AddBoxOutlinedIcon />, label: 'Add course', path: '/admin/courses/new/edit' },
        { icon: <SettingsOutlinedIcon />, label: 'Portal settings', path: '/admin/settings' },
        { icon: <GroupAddOutlinedIcon />, label: 'Add group', path: '/admin/groups/new' },
        { icon: <AssessmentOutlinedIcon />, label: 'Custom reports', path: '/admin/reports' },
    ];


    const overviewStats = [
        { icon: <PeopleOutlineIcon />, label: 'Active users', value: stats.activeUsers.toString() },
        { icon: <MenuBookOutlinedIcon />, label: 'Assigned courses', value: stats.totalCourses.toString() },
        { icon: <GroupsOutlinedIcon />, label: 'Branches', value: stats.totalBranches.toString() },
        { icon: <AccessTimeOutlinedIcon />, label: 'Training time', value: trainingTime },
    ];

    const getEventText = (event: TimelineEvent) => {
        switch (event.eventType) {
            case 'signin': return 'You signed in';
            case 'course_created':
                return (
                    <>You created the course <Link sx={{ color: 'hsl(var(--primary))' }}>{event.details?.title || ''}</Link></>
                );
            case 'course_enrolled':
                return (
                    <>You added yourself to the course <Link sx={{ color: 'hsl(var(--primary))' }}>{event.details?.title || ''}</Link></>
                );
            default: return event.eventType;
        }
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour ago`;
        return `${Math.floor(diffMins / 1440)} days ago`;
    };

    const { mode } = useThemeMode();
    const isLiquid = mode === 'liquid-glass';
    const glassStyle = isLiquid ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
            </Box>
        );
    }

    return (
        <Box className="animate-fly-in" sx={{ p: { xs: 2, md: 4 }, position: 'relative', overflow: 'hidden' }}>
            {/* Hero Section */}
            <Box className="animate-fly-in" sx={{ animationDelay: '0s', position: 'relative', zIndex: 1, mb: 4 }}>
                <Box className="animate-float">
                    <GlassCard
                        activeEffect={false}
                        cornerRadius={24}
                        sx={{
                            textAlign: 'center'
                        }}
                    >
                        <Box sx={{ p: 4 }}>
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 800, 
                                    mb: 1, 
                                    color: 'hsl(var(--foreground))',
                                    textShadow: '0 0 20px hsl(var(--background) / 0.9), 0 0 8px hsl(var(--background) / 1)'
                                }}
                            >
                                Welcome Back, {currentUser ? (currentUser.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : currentUser.username) : 'Admin'}
                            </Typography>
                            <Typography 
                                variant="body1" 
                                sx={{ 
                                    color: 'hsl(var(--foreground))', 
                                    fontWeight: 600,
                                    fontSize: '1.1rem',
                                    textShadow: '0 0 15px hsl(var(--background) / 0.9), 0 0 5px hsl(var(--background) / 1)'
                                }}
                            >
                                Here's what's happening in your portal today.
                            </Typography>
                        </Box>
                    </GlassCard>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 4, mb: 4 }}>
                {/* Row 1, Col 1: Portal Activity */}
                <Box className="animate-fly-in" sx={{ animationDelay: '100ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Portal activity</Typography>
                                    <Button
                                        className="btn btn-outline"
                                        endIcon={<KeyboardArrowDownIcon />}
                                        sx={{ textTransform: 'none', height: 32 }}
                                    >
                                        This Week
                                    </Button>
                                </Box>

                                {/* Simple Chart Visualization */}
                                <Box sx={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 2, px: 2, pb: 2, borderBottom: '1px solid hsl(var(--border))' }}>
                                    {[40, 70, 45, 90, 65, 85, 30].map((height, i) => (
                                        <Box key={i} className="animate-grow-up" sx={{
                                            flex: 1,
                                            height: `${height}%`,
                                            background: i === 3 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'all 0.3s ease',
                                            animationDelay: `${i * 100}ms`,
                                            '&:hover': { background: 'hsl(var(--primary))', transform: 'scaleY(1.05)' }
                                        }} />
                                    ))}
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 2 }}>
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                                        <Typography key={day} variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{day}</Typography>
                                    ))}
                                </Box>

                                <Box sx={{ display: 'flex', gap: 3, mt: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--primary))' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 500, textShadow: '0 0 2px hsl(var(--background) / 0.5)' }}>Logins</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircleIcon sx={{ fontSize: 10, color: 'hsl(var(--secondary))' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 500, textShadow: '0 0 2px hsl(var(--background) / 0.5)' }}>Course completions</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>

                {/* Row 1, Col 2: Quick Actions */}
                <Box className="animate-fly-in" sx={{ animationDelay: '200ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Quick actions</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {quickActions.map((action, i) => (
                                        <Box
                                            key={i}
                                            onClick={() => router.push(action.path)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                p: 1.5,
                                                borderRadius: 1,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': { 
                                                    bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--accent))', 
                                                    transform: 'translateX(4px)' 
                                                }
                                            }}
                                        >
                                            <Box sx={{ 
                                                color: 'hsl(var(--primary))', 
                                                display: 'flex',
                                                width: 32,
                                                height: 32,
                                                borderRadius: '8px',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                                ...(isLiquid ? glassStyle : {})
                                            }}>
                                                {action.icon}
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', textShadow: '0 0 2px hsl(var(--background) / 0.3)' }}>{action.label}</Typography>
                                            <ChevronRightIcon sx={{ ml: 'auto', fontSize: 18, color: 'hsl(var(--muted-foreground))' }} />
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 4, mb: 4 }}>
                {/* Row 2, Col 1: Users Distribution */}
                <Box className="animate-fly-in" sx={{ animationDelay: '300ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Users distribution</Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 700, height: 32, display: 'flex', alignItems: 'center' }}>{stats.totalUsers}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 4, py: 2 }}>
                                    <Box sx={{ position: 'relative' }}>
                                        <DonutChart data={userBreakdown} size={160} />
                                        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' }}>{stats.totalUsers}</Typography>
                                            <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>Total</Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                                        {userBreakdown.map((item, i) => (
                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <CircleIcon sx={{ fontSize: 10, color: item.color }} />
                                                <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>{item.value}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>

                {/* Row 2, Col 2: Overview Stats */}
                <Box className="animate-fly-in" sx={{ animationDelay: '400ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Portal overview</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {overviewStats.map((stat, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1, borderBottom: i < overviewStats.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ color: 'hsl(var(--primary) / 0.7)', display: 'flex' }}>{stat.icon}</Box>
                                                <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{stat.label}</Typography>
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--primary))', fontFamily: 'monospace' }}>{stat.value}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '8fr 4fr' }, gap: 4, mb: 4 }}>
                {/* Row 3, Col 1: Recent Courses */}
                <Box className="animate-fly-in" sx={{ animationDelay: '500ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Recent courses</Typography>
                                    <IconButton size="small" onClick={() => router.push('/admin/courses')} sx={{ color: 'hsl(var(--primary))', width: 32, height: 32 }}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Box>
                                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                                    {recentCourses.length === 0 ? (
                                        <Box sx={{ 
                                            gridColumn: '1 / -1', 
                                            display: 'flex', 
                                            flexDirection: 'column', 
                                            alignItems: 'center', 
                                            justifyContent: 'center', 
                                            py: 4, 
                                            textAlign: 'center' 
                                        }}>
                                            <Box sx={{
                                                width: 48, height: 48, borderRadius: '50%',
                                                bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--primary) / 0.1)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                mb: 1, color: 'hsl(var(--primary))',
                                                ...(isLiquid ? glassStyle : {})
                                            }}>
                                                <DescriptionOutlinedIcon fontSize="medium" />
                                            </Box>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>No courses yet</Typography>
                                            <Button
                                                size="small"
                                                sx={{ 
                                                    mt: 1, 
                                                    color: 'hsl(var(--primary))',
                                                    '&:hover': { bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.05)' : undefined }
                                                }}
                                                onClick={() => router.push('/admin/courses/new/edit')}
                                            >
                                                Create course
                                            </Button>
                                        </Box>
                                    ) : (
                                        recentCourses.map((course) => (
                                            <Box
                                                key={course.id}
                                                onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                                    borderRadius: 2, cursor: 'pointer',
                                                    bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.03)' : 'hsl(var(--primary) / 0.03)',
                                                    border: isLiquid ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid hsl(var(--border) / 0.1)',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { 
                                                        bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--accent))', 
                                                        transform: 'translateY(-2px)' 
                                                    },
                                                    ...(isLiquid ? glassStyle : {})
                                                }}
                                            >
                                                <Box sx={{
                                                    width: 40, height: 40, borderRadius: 1.5,
                                                    bgcolor: isLiquid ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--primary) / 0.1)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'hsl(var(--primary))',
                                                    ...(isLiquid ? glassStyle : {})
                                                }}>
                                                    <MenuBookOutlinedIcon fontSize="small" />
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>{course.title}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', textTransform: 'capitalize' }}>{course.status}</Typography>
                                                </Box>
                                                <ChevronRightIcon sx={{ fontSize: 18, color: 'hsl(var(--muted-foreground))' }} />
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>

                {/* Row 3, Col 2: Timeline */}
                <Box className="animate-fly-in" sx={{ animationDelay: '600ms' }}>
                    <Box className="animate-float" sx={{ height: '100%' }}>
                        <GlassCard
                            activeEffect={false}
                            interactive={true}
                            cornerRadius={24}
                            sx={{ 
                                p: 0, 
                                height: '100%'
                            }}
                        >
                            <Box sx={{ p: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, minHeight: 40 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, textShadow: '0 0 4px hsl(var(--background) / 0.3)' }}>Portal timeline</Typography>
                                    <IconButton size="small" sx={{ color: 'hsl(var(--primary))', width: 32, height: 32 }}>
                                        <ChevronRightIcon />
                                    </IconButton>
                                </Box>
                                <Box sx={{ 
                                    maxHeight: 300, 
                                    overflowY: 'auto', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    gap: 2.5,
                                    pr: 1,
                                    scrollbarWidth: 'none', 
                                    '&::-webkit-scrollbar': { display: 'none' }
                                }}>
                                    {timeline.length === 0 ? (
                                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 4 }}>No recent activity</Typography>
                                    ) : (
                                        timeline.map((event, index) => (
                                            <Box key={event.id} sx={{ display: 'flex', gap: 2 }}>
                                                <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                                                    <CircleIcon sx={{ 
                                                        fontSize: 12, 
                                                        color: event.eventType === 'course_created' ? 'hsl(var(--secondary))' : 'hsl(var(--primary))',
                                                        zIndex: 2,
                                                        filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.5))'
                                                    }} />
                                                    {index < timeline.length - 1 && (
                                                        <Box sx={{ 
                                                            width: '2px', 
                                                            flex: 1, 
                                                            bgcolor: 'hsl(var(--primary) / 0.2)', 
                                                            mt: 0.5, 
                                                            mb: -1.5,
                                                            borderRadius: '1px'
                                                        }} />
                                                    )}
                                                </Box>
                                                <Box sx={{ flex: 1, pb: 2 }}>
                                                    <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 500 }}>{getEventText(event)}</Typography>
                                                    <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))' }}>{formatTime(event.timestamp)}</Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </GlassCard>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
