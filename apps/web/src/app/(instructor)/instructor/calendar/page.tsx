'use client';

// Force rebuild
import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Button, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Snackbar, Alert
} from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import AddIcon from '@mui/icons-material/Add';
import { apiFetch } from '@shared/http/apiFetch';

interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    type: string;
}

export default function CalendarPage() {
    const { mode } = useThemeMode();
    const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)); // December 2025

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'inherit';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        type: 'custom'
    });
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);

    const fetchEvents = useCallback(async () => {
        try {
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const res = await fetch(`/api/calendar-events?start=${start.toISOString()}&end=${end.toISOString()}`);
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            if (data.events) {
                setEvents(data.events);
            }
        } catch (error) {
            console.error('Failed to fetch events:', error);
        }
    }, [currentDate, handleResponse]);

    useEffect(() => {
        if (!permissionsLoading && can('calendar:read')) {
            void fetchEvents();
        }
    }, [can, fetchEvents, permissionsLoading]);

    if (permissionsLoading) return null;
    if (!can('calendar:read') || forbidden) {
        return <AccessDenied requiredPermission="calendar:read" />;
    }

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const handleAddEvent = async () => {
        try {
            const data = await apiFetch<{ success: boolean }>('/api/instructor/calendar/events', {
                method: 'POST',
                body: newEvent,
            });
            if (data.success) {
                setSnackbar({ open: true, message: 'Event created successfully', severity: 'success' });
                setOpenDialog(false);
                setNewEvent({
                    title: '',
                    description: '',
                    startTime: '',
                    endTime: '',
                    type: 'custom'
                });
                fetchEvents();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create event', severity: 'error' });
        }
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getEventsForDay = (day: number): CalendarEvent[] => {
        return events.filter((event: CalendarEvent) => {
            const eventDate = new Date(event.startTime);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const renderCalendarDays = () => {
        const days: React.ReactNode[] = [];
        const prevMonthDays = startingDayOfWeek;

        // Previous month's trailing days
        const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
        const prevMonthLastDay = prevMonth.getDate();
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push(
                <Box
                    key={`prev-${i}`}
                    sx={{
                        border: `1px solid ${DIVIDER}`,
                        minHeight: 100,
                        p: 1,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.02)' : 'hsl(var(--card) / 0.6)'
                    }}
                >
                    <Typography variant="caption" sx={{ color: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.4)' : '#97A0AF' }}>
                        {prevMonthLastDay - i}
                    </Typography>
                </Box>
            );
        }

        // Current month's days
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday =
                day === today.getDate() &&
                currentDate.getMonth() === today.getMonth() &&
                currentDate.getFullYear() === today.getFullYear();

            const dayEvents = getEventsForDay(day);

            days.push(
                <Box
                    key={`current-${day}`}
                    sx={{
                        border: `1px solid ${DIVIDER}`,
                        minHeight: 100,
                        p: 1,
                        bgcolor: isToday 
                            ? (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--primary) / 0.15)') 
                            : (mode === 'liquid-glass' ? 'transparent' : 'background.paper'),
                        position: 'relative',
                        cursor: 'pointer',
                        '&:hover': { 
                            bgcolor: isToday 
                                ? (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.25)' : 'hsl(var(--primary) / 0.2)') 
                                : (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.6)') 
                        }
                    }}
                >
                    <Typography
                        variant="caption"
                        sx={{ 
                            color: isToday ? (mode === 'liquid-glass' ? '#fff' : 'primary.main') : TEXT_COLOR,
                            fontWeight: isToday ? 700 : 400
                        }}
                    >
                        {day}
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                        {dayEvents.slice(0, 2).map(event => (
                            <Chip
                                key={event.id}
                                label={event.title}
                                size="small"
                                sx={{
                                    fontSize: 10,
                                    height: 18,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                                    color: '#fff',
                                    border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                                    mb: 0.5,
                                    width: '100%',
                                    '& .MuiChip-label': {
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }
                                }}
                            />
                        ))}
                        {dayEvents.length > 2 && (
                            <Typography variant="caption" sx={{ fontSize: 10, color: SECONDARY_TEXT }}>
                                +{dayEvents.length - 2} more
                            </Typography>
                        )}
                    </Box>
                </Box>
            );
        }

        return days;
    };

    return (
        <Box>
            {/* Header */}
            <Typography variant="h5" fontWeight={600} sx={{ mb: 3, color: TEXT_COLOR }}>
                Calendar
            </Typography>

            {/* Navigation Bar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleToday}
                        sx={{
                            textTransform: 'none',
                            borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.4)' : 'divider',
                            color: TEXT_COLOR,
                            fontWeight: 600,
                            '&:hover': {
                                borderColor: mode === 'liquid-glass' ? '#fff' : 'primary.main',
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                            }
                        }}
                    >
                        Today
                    </Button>
                    <IconButton size="small" onClick={handlePrevMonth} sx={{ color: TEXT_COLOR }}>
                        <NavigateBeforeIcon />
                    </IconButton>
                    <IconButton size="small" onClick={handleNextMonth} sx={{ color: TEXT_COLOR }}>
                        <NavigateNextIcon />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    {can('calendar:create') && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 600,
                                border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                                backdropFilter: mode === 'liquid-glass' ? 'blur(10px)' : 'none',
                                '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.dark' }
                            }}
                        >
                            Add event
                        </Button>
                    )}
                    {(can('reports:export') || can('calendar:read')) && (
                        <Button
                            variant="outlined"
                            sx={{
                                textTransform: 'none',
                                borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.4)' : 'divider',
                                color: TEXT_COLOR,
                                fontWeight: 600,
                                '&:hover': {
                                    borderColor: mode === 'liquid-glass' ? '#fff' : 'primary.main',
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                                }
                            }}
                        >
                            Export
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Calendar Grid */}
            <Box
                sx={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    ...(mode === 'liquid-glass' ? glassStyle : {
                        border: '1px solid hsl(var(--border))',
                    })
                }}
            >
                {/* Day Headers */}
                {dayNames.map(day => (
                    <Box
                        key={day}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.6)',
                            border: `1px solid ${DIVIDER}`,
                            p: 1.5,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                            {day}
                        </Typography>
                    </Box>
                ))}

                {/* Calendar Days */}
                {renderCalendarDays()}
            </Box>

            {/* Add Event Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                            '& .MuiDialogTitle-root': { color: TEXT_COLOR },
                            '& .MuiDialogContent-root': { color: TEXT_COLOR },
                            '& .MuiDialogActions-root': { borderTop: `1px solid ${DIVIDER}` },
                        } : {})
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Add Event</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Event Title"
                            fullWidth
                            value={newEvent.title}
                            onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                            }}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                            }}
                        />
                        <TextField
                            label="Start Time"
                            type="datetime-local"
                            fullWidth
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& .MuiInputBase-input::-webkit-calendar-picker-indicator': {
                                    filter: mode === 'liquid-glass' ? 'invert(1)' : 'none',
                                }
                            }}
                        />
                        <TextField
                            label="End Time"
                            type="datetime-local"
                            fullWidth
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                            InputLabelProps={{ shrink: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& .MuiInputBase-input::-webkit-calendar-picker-indicator': {
                                    filter: mode === 'liquid-glass' ? 'invert(1)' : 'none',
                                }
                            }}
                        />
                        <TextField
                            label="Event Type"
                            fullWidth
                            select
                            value={newEvent.type}
                            onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                            SelectProps={{ native: true }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& select': {
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                    '& option': {
                                        bgcolor: mode === 'liquid-glass' ? '#222' : 'inherit',
                                        color: mode === 'liquid-glass' ? '#fff' : 'inherit',
                                    }
                                }
                            }}
                        >
                            <option value="custom">Custom</option>
                            <option value="conference">Conference</option>
                            <option value="ilt">ILT Session</option>
                            <option value="deadline">Deadline</option>
                        </TextField>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: TEXT_COLOR }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddEvent}
                        disabled={!newEvent.title || !newEvent.startTime || !newEvent.endTime}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                            color: '#fff',
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.dark' }
                        }}
                    >
                        Add Event
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}
