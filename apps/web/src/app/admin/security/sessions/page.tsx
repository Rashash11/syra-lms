'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Chip, Alert, CircularProgress, Tooltip
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ComputerIcon from '@mui/icons-material/Computer';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import { usePermissions } from '@/hooks/usePermissions';
import AccessDenied from '@shared/ui/components/AccessDenied';
import { getCsrfToken } from '@/lib/client-csrf';
import { useThemeMode } from '@/shared/theme/ThemeContext';

import { GlassCard } from '@shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';

interface Session {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    ip: string;
    deviceType: string;
    userAgent: string;
    lastActiveAt: string;
    createdAt: string;
    isCurrent: boolean;
}

export default function ActiveSessionsPage() {
    const { can, loading: permsLoading } = usePermissions();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { mode } = useThemeMode();
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/security/sessions', { credentials: 'include' });
            if (!res.ok) throw new Error('Failed to fetch sessions');
            const data = await res.json();
            setSessions(data.sessions || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (sessionId: string) => {
        if (!confirm('Are you sure you want to revoke this session? The user will be logged out.')) return;

        try {
            const res = await fetch(`/api/admin/security/sessions?id=${sessionId}`, {
                method: 'DELETE',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            if (!res.ok) throw new Error('Failed to revoke session');
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            alert('Failed to revoke session');
        }
    };

    useEffect(() => {
        if (can('security:sessions:read')) {
            fetchSessions();
        }
    }, [permsLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    if (permsLoading) return <CircularProgress />;
    if (!can('security:sessions:read')) return <AccessDenied requiredPermission="security:sessions:read" />;

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: 'hsl(var(--foreground))' }}>
                    Active Sessions
                </Typography>
                <IconButton
                    onClick={fetchSessions}
                    disabled={loading}
                    sx={{
                        width: 40,
                        height: 40,
                        color: 'hsl(var(--primary))',
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--primary) / 0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'hsl(var(--primary) / 0.2)',
                            transform: 'rotate(180deg)'
                        },
                        ...(mode === 'liquid-glass' ? glassStyle : {})
                    }}
                >
                    <RefreshIcon />
                </IconButton>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 3,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(239, 68, 68, 0.1)' : 'hsl(var(--destructive) / 0.1)',
                        color: mode === 'liquid-glass' ? TEXT_COLOR : 'hsl(var(--destructive))',
                        border: mode === 'liquid-glass' ? 'none' : '1px solid hsl(var(--destructive) / 0.2)',
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

            <GlassCard
                p={0}
                sx={{
                    borderRadius: '24px',
                    overflow: 'hidden',
                    border: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                    ...(mode === 'liquid-glass' ? glassStyle : {})
                }}
            >
                <TableContainer>
                    <Table>
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
                                <TableCell sx={{ 
                                    color: MUTED_TEXT, 
                                    fontWeight: 600, 
                                    borderBottom: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                                    bgcolor: 'transparent'
                                }}>User</TableCell>
                                <TableCell sx={{ 
                                    color: MUTED_TEXT, 
                                    fontWeight: 600, 
                                    borderBottom: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                                    bgcolor: 'transparent'
                                }}>Device / IP</TableCell>
                                <TableCell sx={{ 
                                    color: MUTED_TEXT, 
                                    fontWeight: 600, 
                                    borderBottom: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                                    bgcolor: 'transparent'
                                }}>Last Active</TableCell>
                                <TableCell sx={{ 
                                    color: MUTED_TEXT, 
                                    fontWeight: 600, 
                                    borderBottom: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                                    bgcolor: 'transparent'
                                }}>Status</TableCell>
                                <TableCell align="right" sx={{ 
                                    color: MUTED_TEXT, 
                                    fontWeight: 600, 
                                    borderBottom: mode === 'liquid-glass' ? 'none' : '1px solid rgba(141, 166, 166, 0.1)',
                                    bgcolor: 'transparent'
                                }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                        <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                                    </TableCell>
                                </TableRow>
                            ) : sessions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 8, color: MUTED_TEXT, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                        No active sessions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sessions.map((session) => (
                                    <TableRow key={session.id} hover sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' } }}>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>{session.userName}</Typography>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT }}>{session.userEmail}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                {session.deviceType === 'mobile' ?
                                                    <SmartphoneIcon fontSize="small" sx={{ color: MUTED_TEXT }} /> :
                                                    <ComputerIcon fontSize="small" sx={{ color: MUTED_TEXT }} />
                                                }
                                                <Box>
                                                    <Typography variant="body2" sx={{ color: TEXT_COLOR }}>{session.ip}</Typography>
                                                    <Tooltip title={session.userAgent}>
                                                        <Typography variant="caption" sx={{ color: MUTED_TEXT, maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {session.userAgent}
                                                        </Typography>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Typography variant="body2" sx={{ color: TEXT_COLOR }}>{new Date(session.lastActiveAt).toLocaleString()}</Typography>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT }}>Created: {new Date(session.createdAt).toLocaleDateString()}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {session.isCurrent ? (
                                                <Chip
                                                    label="Current"
                                                    size="small"
                                                    sx={{
                                                        color: ICON_COLOR,
                                                        borderColor: 'rgba(141, 166, 166, 0.2)',
                                                        bgcolor: 'rgba(141, 166, 166, 0.1)'
                                                    }}
                                                    variant="outlined"
                                                />
                                            ) : (
                                                <Chip
                                                    label="Active"
                                                    size="small"
                                                    sx={{
                                                        color: 'hsl(var(--success))',
                                                        borderColor: 'rgba(76, 175, 80, 0.2)',
                                                        bgcolor: 'rgba(76, 175, 80, 0.1)'
                                                    }}
                                                    variant="outlined"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRevoke(session.id)}
                                                disabled={session.isCurrent || !can('security:sessions:revoke')}
                                                sx={{
                                                    color: 'hsl(var(--destructive))',
                                                    '&:hover': { bgcolor: 'hsl(var(--destructive) / 0.1)' },
                                                    '&.Mui-disabled': { opacity: 0.3 }
                                                }}
                                            >
                                                <DeleteOutlineIcon />
                                            </IconButton>
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
