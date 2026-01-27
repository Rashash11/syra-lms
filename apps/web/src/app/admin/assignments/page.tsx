'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Stack, Chip, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
    InputLabel, Select, CircularProgress
} from '@mui/material';
import { GlassCard } from '@shared/ui/components/GlassCard';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import { usePermissions } from '@/hooks/usePermissions';
import { useApiError } from '@/hooks/useApiError';
import { apiFetch } from '@shared/http/apiFetch';
import Link from '@shared/ui/AppLink';
import AccessDenied from '@shared/ui/components/AccessDenied';
import { getCsrfToken } from '@/lib/client-csrf';

import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';

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

export default function AssignmentsPage() {
    const { mode } = useThemeMode();
    const { can, loading: permissionsLoading } = usePermissions();
    
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
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        courseId: '',
        dueAt: '',
    });

    const fetchAssignments = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/assignments');

            if (handleResponse(res)) {
                if (res.status === 403) setAccessDenied(true);
                return;
            }

            const data = await res.json();
            setAssignments(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [handleResponse]);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await fetch('/api/courses', { credentials: 'include' });
            const data = await res.json();
            setCourses(data.data || []);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        void fetchAssignments();
        void fetchCourses();
    }, [fetchAssignments, fetchCourses]);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, assignment: Assignment) => {
        setAnchorEl(event.currentTarget);
        setCurrentAssignment(assignment);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        if (currentAssignment) {
            setFormData({
                title: currentAssignment.title,
                description: currentAssignment.description || '',
                courseId: currentAssignment.courseId || '',
                dueAt: currentAssignment.dueAt ? new Date(currentAssignment.dueAt).toISOString().slice(0, 16) : '',
            });
            setDialogOpen(true);
        }
        handleCloseMenu();
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleCloseMenu();
    };

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const method = currentAssignment ? 'PUT' : 'POST';
        const url = currentAssignment ? `/api/assignments/${currentAssignment.id}` : '/api/assignments';
        setError(null);

        try {
            await apiFetch(url, {
                method,
                body: {
                    ...formData,
                    dueAt: formData.dueAt ? new Date(formData.dueAt).toISOString() : null
                },
            });

            fetchAssignments();
            setDialogOpen(false);
        } catch (err: any) {
            console.error(err);
            const msg = err.details?.error || err.message || 'Failed to save assignment';
            setError(msg);
        }
    };

    const confirmDelete = async () => {
        if (!currentAssignment) return;
        try {
            await apiFetch(`/api/assignments/${currentAssignment.id}`, { 
                method: 'DELETE',
            });
            fetchAssignments();
            setDeleteDialogOpen(false);
        } catch (err) {
            console.error(err);
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
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: TEXT_COLOR }}>
                    <HistoryIcon fontSize="large" sx={{ color: ICON_COLOR }} />
                    Assignments
                </Typography>
                {can('assignment:create') && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        component={Link}
                        href="/admin/assignments/new"
                        disabled={permissionsLoading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            borderRadius: '6px',
                            px: 3,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                        }}
                    >
                        Add assignment
                    </Button>
                )}
            </Box>

            <GlassCard p={0} sx={{ width: '100%', mb: 2, border: '1px solid rgba(141, 166, 166, 0.1)', overflow: 'hidden' }}>
                <Box sx={{ p: 2 }}>
                    <TextField
                        placeholder="Search assignments..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        inputProps={{ 'data-testid': 'assignments-search' }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: MUTED_TEXT }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                color: TEXT_COLOR,
                                '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                '&:hover fieldset': { borderColor: ICON_COLOR },
                            }
                        }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'rgba(141, 166, 166, 0.05)' }}>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Title</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Course</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Due Date</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Created</TableCell>
                                <TableCell align="right" sx={{ color: MUTED_TEXT, fontWeight: 600, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}><CircularProgress size={24} sx={{ color: ICON_COLOR }} /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} align="center" sx={{ color: MUTED_TEXT, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>No assignments found</TableCell></TableRow>
                            ) : (
                                filtered.map((a) => (
                                    <TableRow key={a.id} hover sx={{ '&:hover': { bgcolor: 'rgba(141, 166, 166, 0.05)' } }}>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <Typography variant="body2" fontWeight={600} sx={{ color: TEXT_COLOR }}>{a.title}</Typography>
                                            <Typography variant="caption" noWrap sx={{ color: MUTED_TEXT, maxWidth: 300, display: 'block' }}>
                                                {a.description}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {a.course ? (
                                                <Chip label={a.course.title} size="small" variant="outlined" sx={{ borderColor: 'rgba(141, 166, 166, 0.2)', color: ICON_COLOR }} />
                                            ) : (
                                                <Typography variant="caption" sx={{ color: MUTED_TEXT }}>N/A</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ color: TEXT_COLOR, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {a.dueAt ? new Date(a.dueAt).toLocaleDateString() : 'No limit'}
                                        </TableCell>
                                        <TableCell sx={{ color: TEXT_COLOR, borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            {new Date(a.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(141, 166, 166, 0.05)' }}>
                                            <IconButton onClick={(e) => handleOpenMenu(e, a)} sx={{ color: MUTED_TEXT }}>
                                                <MoreVertIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>

            <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={handleCloseMenu}
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(141, 166, 166, 0.1)',
                            borderRadius: '12px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                        }),
                        '& .MuiMenuItem-root': {
                            color: TEXT_COLOR,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            px: 2,
                            py: 1,
                            '&:hover': {
                                bgcolor: 'hsl(var(--primary) / 0.1)',
                                color: ICON_COLOR
                            }
                        }
                    }
                }}
            >
                {can('assignment:update') && (
                    <MenuItem onClick={handleEdit}>Edit</MenuItem>
                )}
                {can('assignment:delete') && (
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>Delete</MenuItem>
                )}
            </Menu>

            <Dialog 
                open={dialogOpen} 
                onClose={() => setDialogOpen(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(141, 166, 166, 0.1)',
                            borderRadius: '24px',
                            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ color: TEXT_COLOR, fontWeight: 700 }}>{currentAssignment ? 'Edit Assignment' : 'Add Assignment'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        {error && (
                            <Typography color="error" variant="body2" sx={{ mb: 1 }}>
                                {error}
                            </Typography>
                        )}
                        <TextField
                            label="Title"
                            fullWidth
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover fieldset': { borderColor: ICON_COLOR },
                                }
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
                                    '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover fieldset': { borderColor: ICON_COLOR },
                                }
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: MUTED_TEXT }}>Course (Optional)</InputLabel>
                            <Select
                                value={formData.courseId}
                                label="Course (Optional)"
                                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                sx={{
                                    color: TEXT_COLOR,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                }}
                                MenuProps={{
                                PaperProps: {
                                    sx: {
                                        ...glassStyle,
                                        ...(mode === 'liquid-glass' ? {
                                            borderRadius: '24px',
                                        } : {
                                            bgcolor: 'hsl(var(--card))',
                                            backdropFilter: 'blur(20px)',
                                            border: '1px solid rgba(141, 166, 166, 0.1)',
                                            borderRadius: 2,
                                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                        })
                                    }
                                }
                            }}
                            >
                                <MenuItem value=""><em>None</em></MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.title}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            label="Due Date"
                            type="datetime-local"
                            fullWidth
                            InputLabelProps={{ shrink: true, sx: { color: MUTED_TEXT } }}
                            value={formData.dueAt}
                            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: 'rgba(141, 166, 166, 0.2)' },
                                    '&:hover fieldset': { borderColor: ICON_COLOR },
                                }
                            }}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setDialogOpen(false)} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit}
                        sx={{ 
                            borderRadius: '12px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: ICON_COLOR,
                            color: 'white',
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                        }}
                    >
                        {currentAssignment ? 'Save Changes' : 'Create Assignment'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(141, 166, 166, 0.1)',
                            borderRadius: '24px',
                            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ color: TEXT_COLOR, fontWeight: 700 }}>Delete Assignment</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: MUTED_TEXT }}>Are you sure you want to delete this assignment?</Typography>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Cancel</Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={confirmDelete}
                        sx={{ 
                            borderRadius: '12px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: 'error.main',
                            '&:hover': { bgcolor: 'error.dark' }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
