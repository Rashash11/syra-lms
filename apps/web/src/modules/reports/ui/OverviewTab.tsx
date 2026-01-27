'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Box, Typography, MenuItem, Select, FormControl, Grid, CircularProgress, Avatar } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import CategoryIcon from '@mui/icons-material/Category';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import GroupIcon from '@mui/icons-material/Group';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import { GlassCard } from '@shared/ui/components/GlassCard';

import { useThemeMode } from '@shared/theme/ThemeContext';

const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
// Modern vibrant colors
const SUCCESS_COLOR = '#00E676'; 
const WARNING_COLOR = '#FFEA00';
const INFO_COLOR = '#00B0FF';
const DESTRUCTIVE_COLOR = '#FF1744';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, Area, ComposedChart
} from 'recharts';

interface OverviewData {
    overview: {
        activeUsers: number;
        neverLoggedIn: number;
        assignedCourses: number;
        completedCourses: number;
    };
    learningStructure: {
        courses: number;
        categories: number;
        branches: number;
        groups: number;
        learningPaths: number;
    };
    activity: {
        labels: string[];
        logins: number[];
        completions: number[];
    };
    enrollmentDistribution?: {
        completed: number;
        inProgress: number;
        notStarted: number;
    };
    topCourses?: Array<{ name: string; enrollments: number }>;
    userEngagement?: {
        dailyActiveUsers: number;
        weeklyActiveUsers: number;
        avgCompletionDays: number;
        certificatesIssued: number;
    };
    branchStats?: Array<{ name: string; users: number; completions: number }>;
    learningPathProgress?: {
        total: number;
        completed: number;
        inProgress: number;
    };
}

export default function OverviewTab() {
    const { mode } = useThemeMode();
    const isLiquid = mode === 'liquid-glass';
    const [data, setData] = useState<OverviewData | null>(null);
    const [period, setPeriod] = useState('month');
    const [loading, setLoading] = useState(true);

    const selectMenuProps = {
        PaperProps: {
            sx: isLiquid
                ? {
                      backdropFilter:
                          'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.4)',
                      boxShadow:
                          'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                      borderRadius: '12px',
                      marginTop: '8px',
                      '& .MuiMenuItem-root': {
                          padding: '10px 16px',
                          '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 0.1)'
                          },
                          '&.Mui-selected': {
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.3)'
                              }
                          }
                      }
                  }
                : {
                      bgcolor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      marginTop: '8px'
                  }
        }
    } as const;

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/reports/overview?period=${period}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching overview:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading || !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
            </Box>
        );
    }

    const chartData = (data.activity?.labels || []).map((label, index) => ({
        name: label,
        Logins: (data.activity?.logins || [])[index] || 0,
        'Course completions': (data.activity?.completions || [])[index] || 0,
    }));

    const enrollmentPieData = data.enrollmentDistribution ? [
        { name: 'Completed', value: data.enrollmentDistribution.completed, color: SUCCESS_COLOR },
        { name: 'In Progress', value: data.enrollmentDistribution.inProgress, color: INFO_COLOR },
        { name: 'Not Started', value: data.enrollmentDistribution.notStarted, color: 'rgba(255, 255, 255, 0.1)' },
    ] : [];

    const totalEnrollments = enrollmentPieData.reduce((sum, item) => sum + item.value, 0);
    const completionRate = totalEnrollments > 0
        ? Math.round((data.enrollmentDistribution?.completed || 0) / totalEnrollments * 100)
        : 0;

    return (
        <Box>
            {/* Header Stats */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <GlassCard sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Active Users
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: TEXT_COLOR, mt: 1 }}>
                                    {data.overview.activeUsers}
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(29, 211, 197, 0.1)',
                                color: '#1dd3c5',
                                display: 'flex'
                            }}>
                                <PeopleIcon sx={{ fontSize: 24 }} />
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <GlassCard sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Never Logged In
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: TEXT_COLOR, mt: 1 }}>
                                    {data.overview.neverLoggedIn}
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(255, 152, 0, 0.1)',
                                color: '#ff9800',
                                display: 'flex'
                            }}>
                                <PersonOffIcon sx={{ fontSize: 24 }} />
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <GlassCard sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Assigned Courses
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: TEXT_COLOR, mt: 1 }}>
                                    {data.overview.assignedCourses}
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(33, 150, 243, 0.1)',
                                color: '#2196f3',
                                display: 'flex'
                            }}>
                                <AssignmentIcon sx={{ fontSize: 24 }} />
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>

                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                    <GlassCard sx={{ p: 3, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Completed
                                </Typography>
                                <Typography variant="h3" sx={{ fontWeight: 800, color: TEXT_COLOR, mt: 1 }}>
                                    {data.overview.completedCourses}
                                </Typography>
                            </Box>
                            <Box sx={{ 
                                p: 1.5, 
                                borderRadius: '12px', 
                                bgcolor: 'rgba(0, 230, 118, 0.1)',
                                color: SUCCESS_COLOR,
                                display: 'flex'
                            }}>
                                <CheckCircleIcon sx={{ fontSize: 24 }} />
                            </Box>
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Activity Chart */}
                <Grid size={{ xs: 12, lg: 8 }}>
                    <GlassCard sx={{ p: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                                    Activity
                                </Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                    Login and completion trends
                                </Typography>
                            </Box>
                            <FormControl size="small">
                                <Select
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    sx={{ 
                                        minWidth: 120,
                                        color: TEXT_COLOR,
                                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: INFO_COLOR },
                                        '.MuiSvgIcon-root': { color: TEXT_COLOR }
                                    }}
                                    MenuProps={selectMenuProps}
                                >
                                    <MenuItem value="week">Last Week</MenuItem>
                                    <MenuItem value="month">Last Month</MenuItem>
                                    <MenuItem value="year">Last Year</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ height: 350, width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={8}>
                                    <defs>
                                        <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={INFO_COLOR} stopOpacity={1}/>
                                            <stop offset="100%" stopColor={INFO_COLOR} stopOpacity={0.5}/>
                                        </linearGradient>
                                        <linearGradient id="colorCompletions" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={SUCCESS_COLOR} stopOpacity={1}/>
                                            <stop offset="100%" stopColor={SUCCESS_COLOR} stopOpacity={0.5}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke={MUTED_TEXT} 
                                        tick={{ fill: MUTED_TEXT, fontSize: 12 }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis 
                                        stroke={MUTED_TEXT} 
                                        tick={{ fill: MUTED_TEXT, fontSize: 12 }} 
                                        axisLine={false}
                                        tickLine={false}
                                        dx={-10}
                                    />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 12,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                                            padding: '12px 16px'
                                        }}
                                        labelStyle={{ color: TEXT_COLOR, fontWeight: 600, marginBottom: 8 }}
                                        itemStyle={{ fontSize: 13 }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: 20 }} />
                                    <Bar 
                                        dataKey="Logins" 
                                        fill="url(#colorLogins)" 
                                        radius={[6, 6, 0, 0]} 
                                        barSize={12}
                                    />
                                    <Bar 
                                        dataKey="Course completions" 
                                        fill="url(#colorCompletions)" 
                                        radius={[6, 6, 0, 0]} 
                                        barSize={12}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </Box>
                    </GlassCard>
                </Grid>

                {/* Enrollment Distribution */}
                <Grid size={{ xs: 12, lg: 4 }}>
                    <GlassCard sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR, mb: 1 }}>
                            Enrollment Distribution
                        </Typography>
                        <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 4 }}>
                            Status breakdown
                        </Typography>
                        <Box sx={{ height: 250, width: '100%', position: 'relative' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={enrollmentPieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {enrollmentPieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(20, 20, 20, 0.8)', 
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: 12,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <Box 
                                sx={{ 
                                    position: 'absolute', 
                                    top: '50%', 
                                    left: '50%', 
                                    transform: 'translate(-50%, -50%)',
                                    textAlign: 'center' 
                                }}
                            >
                                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                    {completionRate}%
                                </Typography>
                                <Typography variant="caption" sx={{ color: MUTED_TEXT, textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Completed
                                </Typography>
                            </Box>
                        </Box>
                        <Box sx={{ mt: 4 }}>
                            {enrollmentPieData.map((item) => (
                                <Box key={item.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, mr: 2, boxShadow: `0 0 10px ${item.color}` }} />
                                        <Typography variant="body2" sx={{ color: MUTED_TEXT }}>{item.name}</Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: TEXT_COLOR }}>{item.value}</Typography>
                                </Box>
                            ))}
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>

            {/* Learning Structure */}
            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR, mb: 3 }}>
                Learning Structure
            </Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <GlassCard sx={{ p: 2, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: TEXT_COLOR, 
                            mr: 2,
                            display: 'flex'
                        }}>
                            <SchoolIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                {data.learningStructure.courses}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                Courses
                            </Typography>
                        </Box>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <GlassCard sx={{ p: 2, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: TEXT_COLOR, 
                            mr: 2,
                            display: 'flex'
                        }}>
                            <CategoryIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                {data.learningStructure.categories}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                Categories
                            </Typography>
                        </Box>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <GlassCard sx={{ p: 2, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: TEXT_COLOR, 
                            mr: 2,
                            display: 'flex'
                        }}>
                            <AccountTreeIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                {data.learningStructure.branches}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                Branches
                            </Typography>
                        </Box>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <GlassCard sx={{ p: 2, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: TEXT_COLOR, 
                            mr: 2,
                            display: 'flex'
                        }}>
                            <GroupIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                {data.learningStructure.groups}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                Groups
                            </Typography>
                        </Box>
                    </GlassCard>
                </Grid>
                <Grid size={{ xs: 6, sm: 4, md: 2.4 }}>
                    <GlassCard sx={{ p: 2, display: 'flex', alignItems: 'center', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                        <Box sx={{ 
                            p: 1.2, 
                            borderRadius: '12px', 
                            bgcolor: 'rgba(255,255,255,0.05)', 
                            color: TEXT_COLOR, 
                            mr: 2,
                            display: 'flex'
                        }}>
                            <TimelineIcon />
                        </Box>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                                {data.learningStructure.learningPaths}
                            </Typography>
                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                Learning Paths
                            </Typography>
                        </Box>
                    </GlassCard>
                </Grid>
            </Grid>
        </Box>
    );
}
