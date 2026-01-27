'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Skeleton, Snackbar, Alert
} from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import { apiFetch } from '@shared/http/apiFetch';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

interface Conference {
    id: string;
    title: string;
    description: string | null;
    startTime: string;
    endTime: string;
    duration: number;
    meetingUrl: string | null;
}

export default function ConferencesPage() {
    const { mode } = useThemeMode();
    const [search, setSearch] = useState('');

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'inherit';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : '#6B778C';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [conferences, setConferences] = useState<Conference[]>([]);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [newConference, setNewConference] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        duration: 60,
        meetingUrl: ''
    });
    const { can, loading: permissionsLoading } = usePermissions();
    const { handleResponse } = useApiError();
    const [forbidden, setForbidden] = useState(false);

    const fetchConferences = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const res = await fetch(`/api/instructor/conferences?${params.toString()}`);
            if (res.status === 403) {
                setForbidden(true);
                return;
            }
            if (handleResponse(res)) return;
            const data = await res.json();
            if (data.conferences) {
                setConferences(data.conferences);
            } else if (data.data) {
                // Handle paginated response format
                setConferences(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch conferences:', error);
        } finally {
            setLoading(false);
        }
    }, [search, fromDate, toDate, handleResponse]);

    useEffect(() => {
        if (!permissionsLoading && can('conference:read')) {
            fetchConferences();
        }
    }, [permissionsLoading, can, fetchConferences]);

    if (permissionsLoading) return null;
    if (!can('conference:read') || forbidden) {
        return <AccessDenied requiredPermission="conference:read" />;
    }

    const handleAddConference = async () => {
        try {
            const data = await apiFetch<{ success: boolean }>('/api/instructor/conferences', {
                method: 'POST',
                body: newConference,
            });
            if (data.success) {
                setSnackbar({ open: true, message: 'Conference created successfully', severity: 'success' });
                setOpenDialog(false);
                setNewConference({
                    title: '',
                    description: '',
                    startTime: '',
                    endTime: '',
                    duration: 60,
                    meetingUrl: ''
                });
                fetchConferences();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Failed to create conference', severity: 'error' });
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600} sx={{ color: TEXT_COLOR }}>
                    Conferences
                </Typography>
                {can('conference:create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : '#0052CC',
                            color: '#fff',
                            textTransform: 'none',
                            fontWeight: 600,
                            border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                            backdropFilter: mode === 'liquid-glass' ? 'blur(10px)' : 'none',
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : '#0747A6' }
                        }}
                    >
                        Add conference
                    </Button>
                )}
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: SECONDARY_TEXT, fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 240,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.hover',
                            color: TEXT_COLOR,
                            '& fieldset': { 
                                borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                            },
                            '&:hover fieldset': {
                                borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                            }
                        }
                    }}
                />

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT }}>From</Typography>
                    <TextField
                        size="small"
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        sx={{ 
                            width: 140,
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider' },
                            },
                            '& .MuiInputBase-input::-webkit-calendar-picker-indicator': {
                                filter: mode === 'liquid-glass' ? 'invert(1)' : 'none',
                            }
                        }}
                    />
                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT }}>To</Typography>
                    <TextField
                        size="small"
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        sx={{ 
                            width: 140,
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider' },
                            },
                            '& .MuiInputBase-input::-webkit-calendar-picker-indicator': {
                                filter: mode === 'liquid-glass' ? 'invert(1)' : 'none',
                            }
                        }}
                    />
                </Box>
            </Box>

            {/* Content */}
            {loading ? (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1, bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.hover' }} />
                    ))}
                </Box>
            ) : conferences.length > 0 ? (
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        boxShadow: 'none', 
                        borderRadius: 2,
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid', 
                            borderColor: 'divider' 
                        })
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.hover', borderBottom: `1px solid ${DIVIDER}` }}>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR }}>Title</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR }}>Start Time</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR }}>Duration</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR }}>Meeting URL</TableCell>
                                <TableCell sx={{ width: 50 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {conferences.map((conf, index) => (
                                <TableRow
                                    key={conf.id}
                                    sx={{
                                        bgcolor: index % 2 === 1 
                                            ? (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.02)' : 'action.hover') 
                                            : 'transparent',
                                        '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.hover' },
                                        borderBottom: `1px solid ${DIVIDER}`
                                    }}
                                >
                                    <TableCell sx={{ color: TEXT_COLOR, fontWeight: 500 }}>
                                        {conf.title}
                                    </TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT }}>
                                        {formatDateTime(conf.startTime)}
                                    </TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT }}>
                                        {conf.duration} min
                                    </TableCell>
                                    <TableCell>
                                        {conf.meetingUrl ? (
                                            <a 
                                                href={conf.meetingUrl} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                style={{ color: mode === 'liquid-glass' ? '#64b5f6' : '#0052CC', textDecoration: 'none' }}
                                            >
                                                Join
                                            </a>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" sx={{ color: TEXT_COLOR }}>
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        py: 8,
                        textAlign: 'center',
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            bgcolor: 'transparent',
                            borderRadius: 2
                        })
                    }}
                >
                    <Box
                        sx={{
                            width: 250,
                            height: 200,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.hover',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            position: 'relative'
                        }}
                    >
                        {/* Video Call Illustration */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Box
                                sx={{
                                    width: 100,
                                    height: 120,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'background.paper',
                                    borderRadius: 1,
                                    border: '2px solid',
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 50,
                                        height: 50,
                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : '#0052CC',
                                        borderRadius: '50%'
                                    }}
                                />
                            </Box>
                            <Box
                                sx={{
                                    width: 80,
                                    height: 100,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'background.paper',
                                    borderRadius: 1,
                                    border: '2px solid',
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : '#0052CC',
                                        borderRadius: '50%'
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                    <Typography variant="h6" fontWeight={600} sx={{ color: TEXT_COLOR, mb: 1 }}>
                        No conferences have been created yet!
                    </Typography>
                    <Typography variant="body2" sx={{ color: SECONDARY_TEXT, mb: 3 }}>
                        Create a new conference below.
                    </Typography>
                    {can('conference:create') && (
                        <Button
                            variant="contained"
                            onClick={() => setOpenDialog(true)}
                            sx={{
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                                color: '#fff',
                                textTransform: 'none',
                                fontWeight: 600,
                                border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                                '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.dark' }
                            }}
                        >
                            Add conference
                        </Button>
                    )}
                </Box>
            )}

            {/* Add Conference Dialog */}
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
                <DialogTitle sx={{ fontWeight: 700 }}>Add Conference</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            value={newConference.title}
                            onChange={(e) => setNewConference({ ...newConference, title: e.target.value })}
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
                            value={newConference.description}
                            onChange={(e) => setNewConference({ ...newConference, description: e.target.value })}
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
                            value={newConference.startTime}
                            onChange={(e) => setNewConference({ ...newConference, startTime: e.target.value })}
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
                            value={newConference.endTime}
                            onChange={(e) => setNewConference({ ...newConference, endTime: e.target.value })}
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
                            label="Duration (minutes)"
                            type="number"
                            fullWidth
                            value={newConference.duration}
                            onChange={(e) => setNewConference({ ...newConference, duration: parseInt(e.target.value) })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                            }}
                        />
                        <TextField
                            label="Meeting URL"
                            fullWidth
                            value={newConference.meetingUrl}
                            onChange={(e) => setNewConference({ ...newConference, meetingUrl: e.target.value })}
                            placeholder="https://meet.google.com/..."
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ color: TEXT_COLOR }}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={handleAddConference}
                        disabled={!newConference.title || !newConference.startTime || !newConference.endTime}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'primary.main',
                            color: '#fff',
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.dark' }
                        }}
                    >
                        Create Conference
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
