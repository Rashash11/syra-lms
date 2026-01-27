'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    Drawer,
    Box,
    Typography,
    TextField,
    Select,
    MenuItem,
    FormControl,
    Divider,
    Slider,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import DescriptionIcon from '@mui/icons-material/Description';
import PaletteIcon from '@mui/icons-material/Palette';

import SessionDrawerHeader from './SessionDrawerHeader';
import DateTimeRow from './DateTimeRow';
import MeetingBlock from './MeetingBlock';
import NotificationsSection from './NotificationsSection';
import SessionDrawerFooter from './SessionDrawerFooter';
import { Session, SessionFormData, SessionNotification } from './types';

interface SessionDrawerProps {
    open: boolean;
    onClose: () => void;
    sessionType: string | null;
    session: Session | null;
    onSave: (session: Session) => void;
    onDelete?: (sessionId: string) => void;
}

// Helper to compute end time from start + duration
function addMinutesToTime(time: string, minutes: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m + minutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
}

// Helper to compute duration from start and end times
function computeDurationMinutes(startTime: string, endTime: string): number {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60; // next day
    return diff;
}

// Generate meeting URL - Uses Jitsi infrastructure, branded as Zedny
function generateMeetingUrl(provider: string, sessionName?: string): string {
    // Create a URL-safe room name
    const timestamp = Date.now().toString(36);
    const randomId = Math.random().toString(36).substring(2, 6);
    const safeName = (sessionName || 'session')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .substring(0, 20);

    const roomName = `zedny-${safeName}-${timestamp}-${randomId}`;

    switch (provider) {
        case 'zedny':
        case 'jitsi':
        case 'lms':
            // Zedny Meet - uses Jitsi infrastructure (works immediately)
            return `https://meet.jit.si/${roomName}`;
        case 'zoom':
            // Placeholder - would need Zoom API integration
            return `[Zoom requires API integration]`;
        case 'meet':
            // Placeholder - would need Google Calendar API
            return `[Google Meet requires API integration]`;
        default:
            return '';
    }
}

const INSTRUCTORS = [
    { value: 'm. mostafa', label: 'm. mostafa' },
    { value: 'instructor.1', label: 'instructor.1' },
];

const COLORS = ['#0046AB', '#1976D2', '#388E3C', '#7B1FA2', '#C2185B', '#F57C00', '#455A64'];

export default function SessionDrawer({
    open,
    onClose,
    sessionType,
    session,
    onSave,
    onDelete,
}: SessionDrawerProps) {
    const isEditing = !!session;

    // Initialize form state
    const getInitialFormData = (): SessionFormData => {
        const now = new Date();
        const defaultDate = now.toISOString().split('T')[0];
        const defaultTime = '18:30';
        const defaultEndTime = addMinutesToTime(defaultTime, 30);

        if (session) {
            return {
                name: session.name || '',
                startDate: session.date || defaultDate,
                startTime: session.startTime || defaultTime,
                endDate: session.date || defaultDate,
                endTime: session.endTime || addMinutesToTime(session.startTime || defaultTime, session.duration || 30),
                allDay: session.allDay || false,
                timezone: session.timezone || 'Africa/Cairo',
                repeatRule: (session.repeatRule as any) || 'none',
                instructor: session.instructor || 'm. mostafa',
                location: session.location || '',
                description: session.description || '',
                color: session.color || '#0046AB',
                capacity: session.maxAttendees,
                hasMeeting: session.hasMeeting ?? (sessionType !== 'in-person'),
                meetingProvider: (session.meetingProvider as any) || 'jitsi',
                meetingUrl: session.meetingUrl || '',
                notifications: session.notifications || [{ id: '1', type: 'notification', minutesBefore: 30 }],
                availability: session.availability || 'busy',
                visibility: session.visibility || 'default',
            };
        }

        return {
            name: '',
            startDate: defaultDate,
            startTime: defaultTime,
            endDate: defaultDate,
            endTime: defaultEndTime,
            allDay: false,
            timezone: 'Africa/Cairo',
            repeatRule: 'none',
            instructor: 'm. mostafa',
            location: '',
            description: '',
            color: '#0046AB',
            capacity: undefined,
            hasMeeting: sessionType !== 'in-person',
            meetingProvider: 'zedny',
            meetingUrl: '',
            notifications: [{ id: '1', type: 'notification', minutesBefore: 30 }],
            availability: 'busy',
            visibility: 'default',
        };
    };

    const [formData, setFormData] = useState<SessionFormData>(getInitialFormData);

    // Reset form when drawer opens/closes or session changes
    useEffect(() => {
        if (open) {
            const initial = getInitialFormData();
            setFormData(initial);
            // Generate meeting URL only for integrated tools (not external)
            // External tools require the user to paste their own URL
            if (initial.hasMeeting && !initial.meetingUrl && sessionType !== 'online-external') {
                setFormData(prev => ({
                    ...prev,
                    meetingUrl: generateMeetingUrl(prev.meetingProvider)
                }));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, session, sessionType]);

    // Compute duration from times
    const duration = useMemo(() => {
        return computeDurationMinutes(formData.startTime, formData.endTime);
    }, [formData.startTime, formData.endTime]);

    // Update end time when duration slider changes
    const handleDurationChange = (newDuration: number) => {
        const newEndTime = addMinutesToTime(formData.startTime, newDuration);
        setFormData(prev => ({ ...prev, endTime: newEndTime }));
    };

    // Validation
    const isSaveDisabled = !formData.name.trim();

    // Save handler
    const handleSave = () => {
        const sessionData: Session = {
            id: session?.id || Date.now().toString(),
            type: (sessionType as any) || session?.type || 'online-integrated',
            name: formData.name,
            date: formData.startDate,
            startTime: formData.startTime,
            endTime: formData.endTime,
            instructor: formData.instructor,
            duration,
            durationUnit: 'minutes',
            description: formData.description,
            color: formData.color,
            location: formData.location,
            maxAttendees: formData.capacity,
            allDay: formData.allDay,
            timezone: formData.timezone,
            repeatRule: formData.repeatRule,
            hasMeeting: formData.hasMeeting,
            meetingProvider: formData.meetingProvider,
            meetingUrl: formData.meetingUrl,
            notifications: formData.notifications,
            availability: formData.availability,
            visibility: formData.visibility,
        };
        onSave(sessionData);
    };

    // Notification handlers
    const handleAddNotification = () => {
        const newNotification: SessionNotification = {
            id: Date.now().toString(),
            type: 'notification',
            minutesBefore: 30,
        };
        setFormData(prev => ({
            ...prev,
            notifications: [...prev.notifications, newNotification]
        }));
    };

    const handleRemoveNotification = (id: string) => {
        setFormData(prev => ({
            ...prev,
            notifications: prev.notifications.filter(n => n.id !== id)
        }));
    };

    const handleUpdateNotification = (id: string, updates: Partial<SessionNotification>) => {
        setFormData(prev => ({
            ...prev,
            notifications: prev.notifications.map(n =>
                n.id === id ? { ...n, ...updates } : n
            )
        }));
    };

    // Meeting handlers
    const handleToggleMeeting = (hasMeeting: boolean) => {
        setFormData(prev => ({
            ...prev,
            hasMeeting,
            meetingUrl: hasMeeting && !prev.meetingUrl
                ? generateMeetingUrl(prev.meetingProvider)
                : prev.meetingUrl
        }));
    };

    const handleProviderChange = (provider: string) => {
        setFormData(prev => ({
            ...prev,
            meetingProvider: provider as any,
            meetingUrl: generateMeetingUrl(provider)
        }));
    };

    const handleRemoveMeeting = () => {
        setFormData(prev => ({
            ...prev,
            hasMeeting: false,
            meetingUrl: ''
        }));
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: {
                    width: { xs: '100%', sm: 580 },
                    maxWidth: '100vw',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                }
            }}
        >
            {/* Sticky Header */}
            <SessionDrawerHeader
                title={formData.name}
                onTitleChange={(name) => setFormData(prev => ({ ...prev, name }))}
                onClose={onClose}
                onSave={handleSave}
                isSaveDisabled={isSaveDisabled}
            />

            {/* Scrollable Body */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Date & Time Row */}
                <DateTimeRow
                    startDate={formData.startDate}
                    startTime={formData.startTime}
                    endDate={formData.endDate}
                    endTime={formData.endTime}
                    allDay={formData.allDay}
                    timezone={formData.timezone}
                    repeatRule={formData.repeatRule}
                    onStartDateChange={(d) => setFormData(prev => ({ ...prev, startDate: d, endDate: d }))}
                    onStartTimeChange={(t) => {
                        const newEnd = addMinutesToTime(t, duration);
                        setFormData(prev => ({ ...prev, startTime: t, endTime: newEnd }));
                    }}
                    onEndDateChange={(d) => setFormData(prev => ({ ...prev, endDate: d }))}
                    onEndTimeChange={(t) => setFormData(prev => ({ ...prev, endTime: t }))}
                    onAllDayChange={(a) => setFormData(prev => ({ ...prev, allDay: a }))}
                    onTimezoneChange={(tz) => setFormData(prev => ({ ...prev, timezone: tz }))}
                    onRepeatRuleChange={(r) => setFormData(prev => ({ ...prev, repeatRule: r as any }))}
                />

                <Divider />

                {/* Meeting Block */}
                {sessionType !== 'in-person' && (
                    <>
                        <MeetingBlock
                            hasMeeting={formData.hasMeeting}
                            meetingProvider={formData.meetingProvider}
                            meetingUrl={formData.meetingUrl}
                            isExternalTool={sessionType === 'online-external'}
                            onToggleMeeting={handleToggleMeeting}
                            onProviderChange={handleProviderChange}
                            onUrlChange={(url) => setFormData(prev => ({ ...prev, meetingUrl: url }))}
                            onRemoveMeeting={handleRemoveMeeting}
                        />
                        <Divider />
                    </>
                )}

                {/* Location (for in-person) */}
                {sessionType === 'in-person' && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <LocationOnIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        <TextField
                            fullWidth
                            placeholder="Add location"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                            variant="standard"
                            InputProps={{ disableUnderline: true }}
                            sx={{ '& input': { py: 1 } }}
                        />
                    </Box>
                )}

                {/* Notifications */}
                <NotificationsSection
                    notifications={formData.notifications}
                    onAddNotification={handleAddNotification}
                    onRemoveNotification={handleRemoveNotification}
                    onUpdateNotification={handleUpdateNotification}
                />

                <Divider />

                {/* Instructor */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 500, minWidth: 80 }}>
                        Instructor
                    </Typography>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <Select
                            value={formData.instructor}
                            onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            {INSTRUCTORS.map((i) => (
                                <MenuItem key={i.value} value={i.value}>{i.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Duration with Slider */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <ScheduleIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>Duration</Typography>
                            <Typography sx={{ color: 'primary.main', fontWeight: 600 }}>
                                {duration} min → Ends at {formData.endTime}
                            </Typography>
                        </Box>
                        <Slider
                            value={duration}
                            onChange={(_, v) => handleDurationChange(v as number)}
                            min={5}
                            max={240}
                            step={5}
                            sx={{ color: 'primary.main' }}
                        />
                    </Box>
                </Box>

                {/* Availability */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <EventBusyIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 500, minWidth: 80 }}>
                        Status
                    </Typography>
                    <RadioGroup
                        row
                        value={formData.availability}
                        onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value as any }))}
                    >
                        <FormControlLabel value="busy" control={<Radio size="small" />} label="Busy" />
                        <FormControlLabel value="free" control={<Radio size="small" />} label="Free" />
                    </RadioGroup>
                </Box>

                {/* Visibility */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <VisibilityIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 500, minWidth: 80 }}>
                        Visibility
                    </Typography>
                    <FormControl size="small" sx={{ flex: 1 }}>
                        <Select
                            value={formData.visibility}
                            onChange={(e) => setFormData(prev => ({ ...prev, visibility: e.target.value as any }))}
                            sx={{ bgcolor: 'background.paper' }}
                        >
                            <MenuItem value="default">Default visibility</MenuItem>
                            <MenuItem value="public">Public</MenuItem>
                            <MenuItem value="private">Private</MenuItem>
                        </Select>
                    </FormControl>
                </Box>

                <Divider />

                {/* Description */}
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <DescriptionIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 1 }} />
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: 'background.paper',
                            }
                        }}
                    />
                </Box>

                {/* Color Picker */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PaletteIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography sx={{ color: 'text.primary', fontWeight: 500, minWidth: 80 }}>
                        Color
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {COLORS.map((c) => (
                            <Box
                                key={c}
                                onClick={() => setFormData(prev => ({ ...prev, color: c }))}
                                sx={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    bgcolor: c,
                                    cursor: 'pointer',
                                    border: formData.color === c ? '3px solid' : '2px solid transparent',
                                    borderColor: formData.color === c ? 'common.white' : 'transparent',
                                    boxShadow: formData.color === c ? `0 0 0 2px ${c}` : 'none',
                                    transition: 'all 0.2s',
                                    '&:hover': { transform: 'scale(1.1)' }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Sticky Footer */}
            <SessionDrawerFooter
                onCancel={onClose}
                onDelete={isEditing && onDelete ? () => onDelete(session!.id) : undefined}
                isEditing={isEditing}
            />
        </Drawer>
    );
}
