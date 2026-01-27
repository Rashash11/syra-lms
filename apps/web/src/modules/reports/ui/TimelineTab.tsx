'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
    CircularProgress,
    InputAdornment
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { GlassCard } from '@shared/ui/components/GlassCard';

// Consistent styling constants
const TEXT_COLOR = '#ffffff';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.7)';
const ACCENT_COLOR = '#1dd3c5';
const PRIMARY_GRADIENT = 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
const SUCCESS_GRADIENT = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)';
const WARNING_GRADIENT = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
const INFO_GRADIENT = 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)';

interface TimelineEvent {
    id: string;
    timestamp: Date;
    relativeTime: string;
    eventType: string;
    description: string;
}

export default function TimelineTab() {
    const { mode } = useThemeMode();
    const [events, setEvents] = useState<TimelineEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        from: '',
        to: '',
        event: '',
        user: '',
        course: '',
    });

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);
            if (filters.event) params.append('event', filters.event);
            if (filters.user) params.append('user', filters.user);
            if (filters.course) params.append('course', filters.course);

            const res = await fetch(`/api/reports/timeline?${params}`);
            const json = await res.json();
            setEvents(json.events || []);
        } catch (error) {
            console.error('Error fetching timeline:', error);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleReset = () => {
        setFilters({
            from: '',
            to: '',
            event: '',
            user: '',
            course: '',
        });
    };

    const getEventIcon = (eventType: string) => {
        let icon;
        let bg;

        if (eventType.includes('signin') || eventType.includes('login')) {
            icon = <LoginIcon sx={{ color: '#fff', fontSize: 20 }} />;
            bg = PRIMARY_GRADIENT;
        } else if (eventType.includes('completed')) {
            icon = <CheckCircleIcon sx={{ color: '#fff', fontSize: 20 }} />;
            bg = SUCCESS_GRADIENT;
        } else if (eventType.includes('course')) {
            icon = <SchoolIcon sx={{ color: '#fff', fontSize: 20 }} />;
            bg = INFO_GRADIENT;
        } else {
            icon = <AddCircleIcon sx={{ color: '#fff', fontSize: 20 }} />;
            bg = WARNING_GRADIENT;
        }

        return (
            <Box sx={{ 
                p: 1, 
                borderRadius: '50%', 
                background: bg, 
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {icon}
            </Box>
        );
    };

    // Set default dates (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setFilters({
            from: thirtyDaysAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
            event: '',
            user: '',
            course: '',
        });
    }, []);

    const inputStyles = {
        '& .MuiInputLabel-root': { color: MUTED_TEXT },
        '& .MuiInputLabel-root.Mui-focused': { color: ACCENT_COLOR },
        '& .MuiOutlinedInput-root': {
            color: TEXT_COLOR,
            bgcolor: 'rgba(0,0,0,0.2)',
            borderRadius: '10px',
            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
            '&.Mui-focused fieldset': { borderColor: ACCENT_COLOR }
        },
        '& .MuiSvgIcon-root': { color: MUTED_TEXT }
    };

    const menuProps = {
        PaperProps: {
            sx: {
                bgcolor: '#1a1f2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                marginTop: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                '& .MuiMenuItem-root': {
                    color: TEXT_COLOR,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    '&.Mui-selected': { bgcolor: 'rgba(29, 211, 197, 0.1)', '&:hover': { bgcolor: 'rgba(29, 211, 197, 0.2)' } }
                }
            },
        },
    };

    return (
        <Box>
            {/* Filter Bar */}
            <GlassCard sx={{ 
                p: 3, 
                mb: 4, 
                background: 'linear-gradient(145deg, rgba(20, 30, 48, 0.6) 0%, rgba(36, 59, 85, 0.4) 100%)' 
            }}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <TextField
                            label="From"
                            type="date"
                            fullWidth
                            size="small"
                            value={filters.from}
                            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={inputStyles}
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <TextField
                            label="To"
                            type="date"
                            fullWidth
                            size="small"
                            value={filters.to}
                            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={inputStyles}
                        />
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small" sx={inputStyles}>
                            <InputLabel>Event</InputLabel>
                            <Select
                                value={filters.event}
                                onChange={(e) => setFilters({ ...filters, event: e.target.value })}
                                label="Event"
                                MenuProps={menuProps}
                            >
                                <MenuItem value="">All Events</MenuItem>
                                <MenuItem value="user_signin">User sign in</MenuItem>
                                <MenuItem value="learning_path_created">Learning path created</MenuItem>
                                <MenuItem value="course_created">Course created</MenuItem>
                                <MenuItem value="course_completed">Course completed</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small" sx={inputStyles}>
                            <InputLabel>User</InputLabel>
                            <Select
                                value={filters.user}
                                onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                                label="User"
                                MenuProps={menuProps}
                            >
                                <MenuItem value="">All Users</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '1 1 150px' }}>
                        <FormControl fullWidth size="small" sx={inputStyles}>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={filters.course}
                                onChange={(e) => setFilters({ ...filters, course: e.target.value })}
                                label="Course"
                                MenuProps={menuProps}
                            >
                                <MenuItem value="">All Courses</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>
                    <Box sx={{ flex: '0 0 auto' }}>
                        <Button
                            onClick={handleReset}
                            startIcon={<RefreshIcon />}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                color: MUTED_TEXT,
                                borderRadius: '10px',
                                px: 3,
                                py: 1,
                                border: '1px solid rgba(255,255,255,0.1)',
                                '&:hover': { 
                                    color: TEXT_COLOR, 
                                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                                    borderColor: 'rgba(255,255,255,0.2)'
                                }
                            }}
                        >
                            Reset
                        </Button>
                    </Box>
                </Box>
            </GlassCard>

            {/* Events List */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1.5 }}>
                <Box sx={{ 
                    p: 1, 
                    borderRadius: '12px', 
                    background: 'rgba(29, 211, 197, 0.1)', 
                    color: ACCENT_COLOR 
                }}>
                    <AccessTimeIcon />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR }}>
                    Activity Timeline
                </Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress sx={{ color: ACCENT_COLOR }} />
                </Box>
            ) : (
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {events.map((event) => (
                        <GlassCard
                            key={event.id}
                            sx={{
                                p: 0,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': { 
                                    transform: 'translateY(-4px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.2)' 
                                }
                            }}
                        >
                            <ListItem sx={{ p: 2 }}>
                                <ListItemIcon sx={{ minWidth: 56 }}>
                                    {getEventIcon(event.eventType)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: TEXT_COLOR, mb: 0.5 }}>
                                            {event.description}
                                        </Typography>
                                    }
                                    secondary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarTodayIcon sx={{ fontSize: 14, color: MUTED_TEXT }} />
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                                {event.relativeTime} • {new Date(event.timestamp).toLocaleString()}
                                            </Typography>
                                        </Box>
                                    }
                                />
                            </ListItem>
                        </GlassCard>
                    ))}
                    {events.length === 0 && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" sx={{ color: MUTED_TEXT, mb: 1 }}>
                                No events found
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                No activity recorded for the selected period
                            </Typography>
                        </Box>
                    )}
                </List>
            )}
        </Box>
    );
}
