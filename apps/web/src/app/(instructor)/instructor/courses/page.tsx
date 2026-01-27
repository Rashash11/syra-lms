'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment,
    IconButton, Menu, MenuItem, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, ButtonGroup, Skeleton, Tooltip, Snackbar, Alert,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    Switch, FormControlLabel, FormControl, InputLabel, Select
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { apiFetch } from '@shared/http/apiFetch';

interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    image: string | null;
    status: string;
    category?: { name: string };
    price?: number;
    updatedAt: string;
}

export default function InstructorCoursesPage() {
    const { mode } = useThemeMode();
    const router = useRouter();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: keyof Course, direction: 'asc' | 'desc' }>({ key: 'title', direction: 'asc' });

    const TEXT_COLOR = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.9)' : 'text.primary';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.6)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuCourse, setMenuCourse] = useState<Course | null>(null);

    // Split button state
    const [splitAnchorEl, setSplitAnchorEl] = useState<null | HTMLElement>(null);

    // Dialog & Feedback
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/instructor/courses?${params}`);
            const data = await res.json();
            setCourses(data.data || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setSnackbar({ open: true, message: 'Failed to fetch courses', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(courses.map(n => n.id));
            return;
        }
        setSelected([]);
    };

    const handleSelect = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = [...selected, id];
        } else {
            newSelected = selected.filter(item => item !== id);
        }
        setSelected(newSelected);
    };

    const handleSort = (key: keyof Course) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedCourses = [...courses].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (!valA || !valB) return 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const formatLastUpdated = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 24) {
            return diffHours === 0 ? 'Just now' : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        }
        if (diffHours < 48) return 'Yesterday';
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    const handleDelete = async () => {
        if (!menuCourse) return;
        try {
            await apiFetch(`/api/courses/${menuCourse.id}`, { method: 'DELETE' });
            setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
            fetchCourses();
        } catch {
            setSnackbar({ open: true, message: 'Failed to delete course', severity: 'error' });
        } finally {
            setDeleteDialogOpen(false);
            setAnchorEl(null);
        }
    };

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700} sx={{ color: TEXT_COLOR }}>Courses</Typography>
                <ButtonGroup variant="contained" sx={{
                    boxShadow: 'none',
                    ...(mode === 'liquid-glass' && {
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.4)',
                        borderRadius: '12px',
                        overflow: 'hidden'
                    })
                }}>
                    <Button
                        onClick={() => router.push('/instructor/courses/new/edit')}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'transparent' : 'hsl(var(--primary))',
                            color: mode === 'liquid-glass' ? '#fff' : 'inherit',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--primary) / 0.9)' }
                        }}
                    >
                        Add course
                    </Button>
                    <Button
                        size="small"
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'transparent' : 'hsl(var(--primary))',
                            color: mode === 'liquid-glass' ? '#fff' : 'inherit',
                            p: 0,
                            minWidth: 32,
                            borderLeft: mode === 'liquid-glass' ? '1px solid rgba(255,255,255,0.4)' : 'none',
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--primary) / 0.9)' }
                        }}
                        onClick={(e) => setSplitAnchorEl(e.currentTarget)}
                    >
                        <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
            </Box>

            {/* Split Button Menu */}
            <Menu
                anchorEl={splitAnchorEl}
                open={Boolean(splitAnchorEl)}
                onClose={() => setSplitAnchorEl(null)}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '16px',
                            '& .MuiMenuItem-root': {
                                color: TEXT_COLOR,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                            }
                        } : {
                            bgcolor: 'background.paper',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        })
                    }
                }}
            >
                <MenuItem onClick={() => router.push('/instructor/courses/new/edit')}>Create new</MenuItem>
                <MenuItem onClick={() => setSplitAnchorEl(null)}>Import from CSV</MenuItem>
            </Menu>

            {/* Constraints / Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        width: 250,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.4)',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                            borderRadius: 1,
                            color: TEXT_COLOR,
                            '& fieldset': { border: 'none' },
                            '&:hover': {
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--card) / 0.4)',
                            }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: SECONDARY_TEXT, fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton sx={{ color: SECONDARY_TEXT }}>
                    <FilterListIcon />
                </IconButton>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{
                boxShadow: 'none',
                borderRadius: 2,
                ...(mode === 'liquid-glass' ? glassStyle : {
                    border: '1px solid hsl(var(--border))',
                })
            }}>
                <Table>
                    <TableHead sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.05)' : 'background.paper' }}>
                        <TableRow>
                            <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                <Checkbox
                                    size="small"
                                    indeterminate={selected.length > 0 && selected.length < courses.length}
                                    checked={courses.length > 0 && selected.length === courses.length}
                                    onChange={handleSelectAll}
                                    sx={{ color: SECONDARY_TEXT }}
                                />
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontWeight: 700,
                                    color: TEXT_COLOR,
                                    cursor: 'pointer',
                                    borderBottom: `1px solid ${DIVIDER}`
                                }}
                                onClick={() => handleSort('title')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Course
                                    {sortConfig.key === 'title' && (
                                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Price</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Last updated on</TableCell>
                            <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={150} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={50} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={80} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={40} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={100} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                    <TableCell align="right"><Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : undefined }} /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedCourses.length > 0 ? (
                            sortedCourses.map((course, index) => (
                                <TableRow
                                    key={course.id}
                                    hover
                                    sx={{
                                        '&:nth-of-type(even)': { bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.02)' : 'hsl(var(--card) / 0.6)' },
                                        '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05) !important' : 'hsl(var(--accent)) !important' }
                                    }}
                                >
                                    <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                        <Checkbox
                                            size="small"
                                            checked={selected.indexOf(course.id) !== -1}
                                            onChange={() => handleSelect(course.id)}
                                            sx={{ color: SECONDARY_TEXT }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={600} sx={{
                                                color: mode === 'liquid-glass' ? 'rgba(255,255,255,0.9)' : 'hsl(var(--primary))',
                                                cursor: 'pointer',
                                                '&:hover': { textDecoration: 'underline' }
                                            }}>
                                                {course.title}
                                            </Typography>
                                            {course.status !== 'PUBLISHED' && (
                                                <Chip
                                                    label="Inactive"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255,255,255,0.1)' : 'hsl(var(--card) / 0.6)',
                                                        color: TEXT_COLOR,
                                                        borderRadius: 1
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT, fontSize: 13, borderBottom: `1px solid ${DIVIDER}` }}>{course.code || '-'}</TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT, fontSize: 13, borderBottom: `1px solid ${DIVIDER}` }}>{course.category?.name || '-'}</TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT, fontSize: 13, borderBottom: `1px solid ${DIVIDER}` }}>{course.price ? `$${course.price}` : '-'}</TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT, fontSize: 13, borderBottom: `1px solid ${DIVIDER}` }}>{formatLastUpdated(course.updatedAt)}</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setAnchorEl(e.currentTarget);
                                                setMenuCourse(course);
                                            }}
                                        >
                                            <MoreHorizIcon fontSize="small" sx={{ color: SECONDARY_TEXT }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography sx={{ color: SECONDARY_TEXT }}>No courses found matching your criteria.</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Row Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '16px',
                            '& .MuiMenuItem-root': {
                                color: TEXT_COLOR,
                                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
                            }
                        } : {
                            bgcolor: 'background.paper',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        }),
                        minWidth: 150
                    }
                }}
            >
                <MenuItem onClick={() => {
                    if (menuCourse) router.push(`/instructor/courses/new/edit?id=${menuCourse.id}`);
                    setAnchorEl(null);
                }}>
                    <EditIcon sx={{ mr: 1, fontSize: 18, color: SECONDARY_TEXT }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
                </MenuItem>
            </Menu>

            {/* Delete Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                        })
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 700, color: TEXT_COLOR }}>Delete Course</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ color: TEXT_COLOR }}>
                        Are you sure you want to delete <strong>{menuCourse?.title}</strong>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none', color: SECONDARY_TEXT }}>Cancel</Button>
                    <Button onClick={handleDelete} variant="contained" color="error" sx={{ textTransform: 'none' }}>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Feedback */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
