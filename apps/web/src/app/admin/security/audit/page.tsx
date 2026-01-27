'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Chip, Alert, CircularProgress,
    FormControl, InputLabel, Select, MenuItem, TextField
} from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@shared/ui/components/AccessDenied';
import { useThemeMode } from '@/shared/theme/ThemeContext';

interface AuditEvent {
    id: string;
    userId: string | null;
    eventType: string;
    ip: string | null;
    userAgent: string | null;
    meta: any;
    createdAt: string;
    users?: {
        email: string;
        firstName: string;
        lastName: string;
    } | null;
}

const EVENT_TYPES = [
    'ALL', 'LOGIN_SUCCESS', 'LOGIN_FAIL', 'LOGOUT', 'REFRESH_ROTATED',
    'REFRESH_FAILED', 'PASSWORD_CHANGED', 'SWITCH_NODE_FAIL', 'SESSION_REVOKED'
];

export default function AuditLogPage() {
    const { mode } = useThemeMode();
    const { can, loading: permsLoading } = usePermissions();
    
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [events, setEvents] = useState<AuditEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [eventType, setEventType] = useState('ALL');
    const [userIdFilter, setUserIdFilter] = useState('');

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (eventType !== 'ALL') params.set('eventType', eventType);
            if (userIdFilter) params.set('userId', userIdFilter);
            params.set('limit', '50');

            const res = await fetch(`/api/admin/security/audit?${params.toString()}`, { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch audit logs');
            const data = await res.json();
            setEvents(data.events || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (can('security:audit:read')) {
            const debounce = setTimeout(fetchEvents, 500);
            return () => clearTimeout(debounce);
        }
    }, [eventType, userIdFilter, permsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    if (permsLoading) return <CircularProgress />;
    if (!can('security:audit:read')) return <AccessDenied requiredPermission="security:audit:read" />;

    const getStatusChip = (type: string) => {
        if (type.includes('SUCCESS') || type.includes('ROTATED')) return <Chip label={type} size="small" color="success" variant="outlined" />;
        if (type.includes('FAIL')) return <Chip label={type} size="small" color="error" variant="outlined" />;
        return <Chip label={type} size="small" color="default" variant="outlined" />;
    };

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'hsl(var(--foreground))', mb: 1 }}>
                    Audit Log
                </Typography>

                <GlassCard
                    sx={{
                        p: 2,
                        display: 'flex',
                        gap: 2,
                        alignItems: 'center',
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                        } : {})
                    }}
                >
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: MUTED_TEXT }}>Event Type</InputLabel>
                        <Select
                            value={eventType}
                            label="Event Type"
                            onChange={(e) => setEventType(e.target.value)}
                            sx={{
                                color: TEXT_COLOR,
                                borderRadius: '12px',
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease',
                                '& .MuiOutlinedInput-notchedOutline': { 
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(141, 166, 166, 0.2)',
                                    border: mode === 'liquid-glass' ? 'none' : undefined
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& fieldset': { border: 'none' }
                                } : {})
                            }}
                            MenuProps={{
                                PaperProps: {
                                    sx: {
                                        ...(mode === 'liquid-glass' ? {
                                            ...glassStyle,
                                            borderRadius: '24px',
                                            backgroundImage: 'none',
                                            mt: 1,
                                            '& .MuiMenuItem-root': {
                                                borderRadius: '8px',
                                                mx: 1,
                                                my: 0.5,
                                                color: TEXT_COLOR,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                                },
                                                '&.Mui-selected': {
                                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                                    '&:hover': {
                                                        bgcolor: 'rgba(255, 255, 255, 0.25)',
                                                    }
                                                }
                                            }
                                        } : {
                                            bgcolor: 'hsl(var(--card))',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(141, 166, 166, 0.1)',
                                            borderRadius: 2,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                            '& .MuiMenuItem-root': {
                                                color: TEXT_COLOR,
                                                fontSize: '0.875rem',
                                                fontWeight: 500,
                                                px: 2,
                                                py: 1,
                                                '&:hover': {
                                                    bgcolor: 'hsl(var(--primary) / 0.1)',
                                                    color: ICON_COLOR
                                                },
                                                '&.Mui-selected': {
                                                    bgcolor: 'hsl(var(--primary) / 0.2)',
                                                    color: ICON_COLOR,
                                                    '&:hover': {
                                                        bgcolor: 'hsl(var(--primary) / 0.25)',
                                                    }
                                                }
                                            }
                                        })
                                    }
                                }
                            }}
                        >
                            {EVENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <TextField
                        size="small"
                        label="Filter by User ID"
                        value={userIdFilter}
                        onChange={(e) => setUserIdFilter(e.target.value)}
                        sx={{
                            minWidth: 250,
                            '& .MuiInputLabel-root': { color: MUTED_TEXT },
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                borderRadius: '12px',
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                transition: 'all 0.2s ease',
                                '& fieldset': { 
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(141, 166, 166, 0.2)',
                                    border: mode === 'liquid-glass' ? 'none' : undefined
                                },
                                '&:hover fieldset': { borderColor: ICON_COLOR },
                                '&.Mui-focused fieldset': { borderColor: ICON_COLOR },
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                } : {})
                            }
                        }}
                    />
                </GlassCard>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: mode === 'liquid-glass' ? TEXT_COLOR : '#ef4444',
                        border: mode === 'liquid-glass' ? 'none' : '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '12px',
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        } : {})
                    }}
                >
                    {error}
                </Alert>
            )}

            <GlassCard sx={{ 
                borderRadius: '24px', 
                overflow: 'hidden',
                ...(mode === 'liquid-glass' ? glassStyle : {})
            }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ 
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(141, 166, 166, 0.05)',
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& .MuiTableCell-root': {
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    }
                                } : {})
                            }}>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Timestamp</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Event</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>User</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Source</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Details</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                                        <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                                    </TableCell>
                                </TableRow>
                            ) : events.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8, color: MUTED_TEXT }}>
                                        No events found matching filters.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                events.map((event) => (
                                    <TableRow key={event.id} hover sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' } }}>
                                        <TableCell sx={{ whiteSpace: 'nowrap', color: TEXT_COLOR, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {new Date(event.createdAt).toLocaleString()}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {getStatusChip(event.eventType)}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {event.users ? (
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>{event.users.email}</Typography>
                                                    <Typography variant="caption" sx={{ color: MUTED_TEXT }}>{event.users.firstName} {event.users.lastName}</Typography>
                                                </Box>
                                            ) : event.userId ? (
                                                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: MUTED_TEXT }}>{event.userId}</Typography>
                                            ) : (
                                                <Typography variant="caption" sx={{ color: MUTED_TEXT }}>anonymous</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Typography variant="body2" sx={{ color: TEXT_COLOR, opacity: 0.8 }}>{event.ip}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Typography variant="caption" sx={{
                                                color: MUTED_TEXT,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                maxWidth: 300
                                            }}>
                                                {JSON.stringify(event.meta)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>
        </Box>
    );
}
