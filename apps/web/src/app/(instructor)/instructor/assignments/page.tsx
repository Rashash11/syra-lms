'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, CircularProgress, Alert
} from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/Add';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import AccessDenied from '@shared/ui/components/AccessDenied';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';

interface Assignment {
    id: string;
    title: string;
    description: string | null;
    courseId: string | null;
    dueAt: string | null;
    createdAt: string;
    course?: {
        title: string;
        code: string;
    };
}

export default function InstructorAssignmentsPage() {
    const { mode } = useThemeMode();
    const { can, loading: permissionsLoading } = usePermissions();

    const TEXT_COLOR = mode === 'liquid-glass' ? '#fff' : 'inherit';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const { handleResponse } = useApiError();
    const [accessDenied, setAccessDenied] = useState(false);

    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        dueAt: '',
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [assignmentsRes, coursesRes] = await Promise.all([
                fetch('/api/assignments'),
                fetch('/api/courses')
            ]);

            if (handleResponse(assignmentsRes)) {
                if (assignmentsRes.status === 403) setAccessDenied(true);
                return;
            }

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json();
                setAssignments(Array.isArray(data) ? data : (data.data || data.assignments || []));
            }

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                setCourses(data.data || []);
            }
        } catch (err) {
            setAccessDenied(true);
        } finally {
            setLoading(false);
        }
    }, [handleResponse]);

    useEffect(() => {
        void fetchData();
    }, [fetchData]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, assignment: Assignment) => {
        setAnchorEl(event.currentTarget);
        setCurrentAssignment(assignment);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleAdd = () => {
        setCurrentAssignment(null);
        setFormData({ title: '', description: '', courseId: '', dueAt: '' });
        setError(null);
        setDialogOpen(true);
    };

    const handleEdit = () => {
        if (currentAssignment) {
            setFormData({
                title: currentAssignment.title,
                description: currentAssignment.description || '',
                courseId: currentAssignment.courseId || '',
                dueAt: currentAssignment.dueAt ? new Date(currentAssignment.dueAt).toISOString().slice(0, 16) : '',
            });
            setError(null);
            setDialogOpen(true);
        }
        handleCloseMenu();
    };

    const handleSubmit = async () => {
        const method = currentAssignment ? 'PUT' : 'POST';
        const url = currentAssignment ? `/api/assignments/${currentAssignment.id}` : '/api/assignments';

        // Basic client-side validation
        if (!formData.title) {
            setError('Title is required');
            return;
        }
        if (!formData.courseId) {
            setError('Course is required');
            return;
        }

        try {
            await apiFetch(url, {
                method,
                body: {
                    ...formData,
                    dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null,
                },
            });
            fetchData();
            setDialogOpen(false);
        } catch (err) {
            if (err instanceof ApiFetchError) {
                let message = err.message || 'Failed to save assignment';
                const details = err.details;
                if (details && typeof details === 'object' && !Array.isArray(details)) {
                    const d = details as Record<string, unknown>;
                    if (typeof d.error === 'string') message = d.error;
                    else if (typeof d.message === 'string') message = d.message;
                }
                setError(message);
                return;
            }
            setError('An error occurred');
        }
    };

    const filtered = assignments.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (accessDenied) {
        return <AccessDenied />;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: TEXT_COLOR }}>
                    <AssignmentOutlinedIcon fontSize="large" color={mode === 'liquid-glass' ? 'inherit' : 'primary'} />
                    My Assignments
                </Typography>
                {can('assignment:create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={handleAdd}
                        disabled={permissionsLoading}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary))',
                            color: mode === 'liquid-glass' ? '#fff' : 'inherit',
                            backdropFilter: mode === 'liquid-glass' ? 'blur(10px)' : 'none',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.4)' : 'none',
                            '&:hover': {
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--primary) / 0.9)',
                            }
                        }}
                    >
                        Create Assignment
                    </Button>
                )}
            </Box>

            <Paper sx={{ 
                width: '100%', 
                mb: 2,
                boxShadow: 'none',
                ...(mode === 'liquid-glass' ? glassStyle : {
                    border: '1px solid hsl(var(--border))',
                })
            }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Search assignments..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: TEXT_COLOR,
                                '& fieldset': {
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)',
                                },
                            },
                            '& .MuiInputBase-input::placeholder': {
                                color: SECONDARY_TEXT,
                                opacity: 1,
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: SECONDARY_TEXT }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Title</TableCell>
                                <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Course</TableCell>
                                <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Due Date</TableCell>
                                <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Created</TableCell>
                                <TableCell align="right" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center"><CircularProgress sx={{ color: TEXT_COLOR }} /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ color: SECONDARY_TEXT }}>No assignments found for your courses</TableCell></TableRow>
                            ) : (
                                filtered.map((a) => (
                                    <TableRow key={a.id} hover sx={{ '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'inherit' } }}>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={500} sx={{ color: TEXT_COLOR }}>{a.title}</Typography>
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 300, display: 'block', color: SECONDARY_TEXT }}>
                                                {a.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {a.course ? (
                                                <Chip 
                                                    label={a.course.title} 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        color: TEXT_COLOR, 
                                                        borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'inherit' 
                                                    }} 
                                                />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: SECONDARY_TEXT }}>N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: TEXT_COLOR }}>
                                            {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}
                                        </TableCell>
                                        <TableCell sx={{ color: TEXT_COLOR }}>
                                            {new Date(a.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton onClick={(e) => handleOpenMenu(e, a)} sx={{ color: TEXT_COLOR }}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            mt: 1,
                            '& .MuiMenuItem-root': {
                                color: TEXT_COLOR,
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                                },
                            },
                        } : {})
                    }
                }}
            >
                {can('assignment:update') && (
                    <MenuItem onClick={handleEdit}>Edit</MenuItem>
                )}
            </Menu>

            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
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
                <DialogTitle sx={{ fontWeight: 700 }}>{currentAssignment ? 'Edit Assignment' : 'Create Assignment'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {error && <Alert severity="error">{error}</Alert>}
                        <TextField
                            label="Title"
                            required
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                            rows={4}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                },
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                            }}
                        />
                        <FormControl fullWidth required>
                            <InputLabel sx={{ color: SECONDARY_TEXT }}>Course</InputLabel>
                            <Select
                                value={formData.courseId}
                                label="Course"
                                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                sx={{
                                    color: TEXT_COLOR,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.23)' },
                                    '& .MuiSvgIcon-root': { color: TEXT_COLOR },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: {
                                            ...(mode === 'liquid-glass' ? {
                                                ...glassStyle,
                                                '& .MuiMenuItem-root': {
                                                    color: TEXT_COLOR,
                                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                                                    '&.Mui-selected': { bgcolor: 'rgba(255, 255, 255, 0.2)' },
                                                },
                                            } : {})
                                        }
                                    }
                                }}
                            >
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Due Date"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            value={formData.dueAt}
                            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
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
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: TEXT_COLOR }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary))',
                            color: mode === 'liquid-glass' ? '#fff' : 'inherit',
                            '&:hover': {
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--primary) / 0.9)',
                            }
                        }}
                    >
                        {currentAssignment ? 'Save Changes' : 'Create Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
