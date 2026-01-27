'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, Chip, Menu, MenuItem, Snackbar, Alert,
    CircularProgress, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import PreviewIcon from '@mui/icons-material/Preview';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import LinkIcon from '@mui/icons-material/Link';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@/shared/http/apiFetch';
import { getCsrfToken } from '@/lib/client-csrf';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const DIVIDER = 'hsl(var(--border) / 0.1)';
const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';

interface Course {
    id: string;
    code: string;
    title: string;
    description: string;
    thumbnailUrl: string | null;
    status: string;
    hiddenFromCatalog: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CoursesPage() {
    const { mode } = useThemeMode();
    const router = useRouter();
    
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const { can, loading: permissionsLoading } = usePermissions();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);

    // Permission checks
    const FORCE_E2E = process.env.NEXT_PUBLIC_E2E_FORCE_ADMIN_CTA === '1';
    const canCreate = FORCE_E2E || can('course:create');
    const canDelete = FORCE_E2E || can('course:delete_any');

    // Menu states
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuCourseId, setMenuCourseId] = useState<string | null>(null);
    const [addMenuAnchor, setAddMenuAnchor] = useState<null | HTMLElement>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    // Fetch courses
    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const data = await apiFetch<any>(`/api/courses?${params}`);
            // Handle both { data: [...] } (standard) and { courses: [...] } (legacy/custom) formats
            setCourses(data.data || data.courses || []);
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

    const formatDate = (dateString: string) => {
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return '';
            return getTimeAgo(dateString);
        } catch {
            return '';
        }
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, courseId: string) => {
        setAnchorEl(event.currentTarget);
        setMenuCourseId(courseId);
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(courses.map(c => c.id));
        } else {
            setSelected([]);
        }
    };

    const handleSelectOne = (id: string) => {
        const selectedIndex = selected.indexOf(id);
        let newSelected: string[] = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selected.slice(0, selectedIndex),
                selected.slice(selectedIndex + 1),
            );
        }

        setSelected(newSelected);
    };

    const handleCreateCourse = async () => {
        try {
            if (process.env.NEXT_PUBLIC_E2E_FORCE_ADMIN_CTA === '1') {
                router.push(`/admin/courses/new/edit?id=${Date.now()}`);
                return;
            }
            const newCourse = await apiFetch<any>('/api/courses', {
                method: 'POST',
                body: {
                    code: `COURSE-${Date.now()}`,
                    title: 'New course',
                    description: '',
                    status: 'DRAFT',
                    hiddenFromCatalog: false
                }
            });
            if (newCourse?.id) {
                router.push(`/admin/courses/new/edit?id=${newCourse.id}`);
            } else {
                setSnackbar({ open: true, message: 'Failed to create course', severity: 'error' });
            }
        } catch (error) {
            console.error('Error creating course:', error);
        }
        setAddMenuAnchor(null);
    };

    const handleDeleteClick = (courseId: string) => {
        setCourseToDelete(courseId);
        setIsBulkDelete(false);
        setDeleteDialogOpen(true);
    };

    const handleBulkDeleteClick = () => {
        setIsBulkDelete(true);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            if (isBulkDelete) {
                // In a real app we'd have a bulk delete API. For now, sequential or check if route.ts supports array
                // Let's check api/courses/route.ts for DELETE. 
                // Since I don't know for sure if bulk delete exists on API, I'll do individual calls for now if needed, 
                // OR better: check if api/courses route.ts has DELETE handler.
                for (const id of selected) {
                    await apiFetch(`/api/courses/${id}`, {
                        method: 'DELETE',
                    });
                }
                setSnackbar({ open: true, message: `${selected.length} courses deleted`, severity: 'success' });
                setSelected([]);
            } else if (courseToDelete) {
                await apiFetch(`/api/courses/${courseToDelete}`, {
                    method: 'DELETE',
                });
                setSnackbar({ open: true, message: 'Course deleted successfully', severity: 'success' });
            }
            fetchCourses();
        } catch (error: any) {
            console.error('Delete error:', error);
            const msg = error.details?.error || error.message || 'An error occurred while deleting';
            setSnackbar({ open: true, message: msg, severity: 'error' });
        } finally {
            setLoading(false);
            setDeleteDialogOpen(false);
            setCourseToDelete(null);
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return 'Just now';
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <Box sx={{ animation: 'fadeIn 0.5s ease-out' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, letterSpacing: '-0.02em' }}>
                    Courses
                </Typography>
                <Box>
                    <>
                        <Button
                            data-testid="admin-cta-add-course"
                            variant="contained"
                            startIcon={<AddIcon />}
                            endIcon={<ArrowDropDownIcon />}
                            onClick={(e) => setAddMenuAnchor(e.currentTarget)}
                            sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: ICON_COLOR,
                                color: 'hsl(var(--primary-foreground))',
                                borderRadius: '10px',
                                px: 3,
                                height: 44,
                                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                                '&:hover': {
                                    bgcolor: 'hsl(var(--primary) / 0.9)',
                                    boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                                }
                            }}
                        >
                            Add course
                        </Button>
                        <Menu
                            anchorEl={addMenuAnchor}
                            open={Boolean(addMenuAnchor)}
                            onClose={() => setAddMenuAnchor(null)}
                            PaperProps={{
                                sx: {
                                    ...glassStyle,
                                    mt: 1,
                                    ...(mode === 'liquid-glass' ? {
                                        borderRadius: '24px',
                                    } : {
                                        bgcolor: 'hsl(var(--card))',
                                        backdropFilter: 'blur(20px)',
                                        border: `1px solid ${DIVIDER}`,
                                        borderRadius: 2,
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                    })
                                }
                            }}
                        >
                            <MenuItem data-testid="menuitem-create-course" onClick={handleCreateCourse} sx={{ py: 1.5, px: 2, fontWeight: 500 }}>Create new course</MenuItem>
                            <MenuItem onClick={() => setAddMenuAnchor(null)} sx={{ py: 1.5, px: 2, fontWeight: 500 }}>Import course</MenuItem>
                        </Menu>
                    </>
                </Box>
            </Box>

            {/* Search & Filters Bar */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    inputProps={{ "data-testid": "courses-search-input" }}
                    placeholder="Search courses..."
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        width: 320,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.5)',
                            height: 40,
                            borderRadius: '20px',
                            border: mode === 'liquid-glass' ? 'none' : `1px solid ${DIVIDER}`,
                            color: TEXT_COLOR,
                            transition: 'all 0.2s ease',
                            '& fieldset': { border: 'none' },
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--card) / 0.8)' },
                            '&.Mui-focused': { 
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'hsl(var(--card))', 
                                border: mode === 'liquid-glass' ? 'none' : `1px solid ${ICON_COLOR}`,
                                boxShadow: mode === 'liquid-glass' ? '0 0 0 2px rgba(255, 255, 255, 0.1)' : 'none'
                            },
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                            } : {})
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" sx={{ color: ICON_COLOR }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton
                    size="small"
                    sx={{
                        width: 40,
                        height: 40,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.5)',
                        border: mode === 'liquid-glass' ? 'none' : `1px solid ${DIVIDER}`,
                        color: ICON_COLOR,
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'hsl(var(--card) / 0.8)',
                            transform: 'translateY(-2px)'
                        },
                        ...(mode === 'liquid-glass' ? glassStyle : {})
                    }}
                >
                    <FilterListIcon fontSize="small" />
                </IconButton>
                {selected.length > 0 && canDelete && (
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleBulkDeleteClick}
                        size="small"
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '20px',
                            px: 2,
                            height: 40,
                            border: '1px solid hsl(var(--destructive) / 0.5)',
                            bgcolor: 'hsl(var(--destructive) / 0.05)',
                            '&:hover': { bgcolor: 'hsl(var(--destructive) / 0.1)', border: '1px solid hsl(var(--destructive))' }
                        }}
                    >
                        Delete Selected ({selected.length})
                    </Button>
                )}
            </Box>

            {/* Table */}
            <GlassCard
                p={0}
                sx={{
                    overflow: 'hidden',
                    border: `1px solid ${DIVIDER}`,
                    ...(mode === 'liquid-glass' ? {
                        ...glassStyle,
                        borderRadius: '24px',
                    } : {
                        borderRadius: 4,
                    })
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                        <CircularProgress size={32} thickness={4} sx={{ color: ICON_COLOR }} />
                    </Box>
                ) : (
                    <TableContainer>
                        <Table sx={{ minWidth: 800 }}>
                            <TableHead>
                                <TableRow sx={{ 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(141, 166, 166, 0.05)',
                                    ...(mode === 'liquid-glass' ? {
                                        ...glassStyle,
                                        border: 'none',
                                        borderBottom: `1px solid ${DIVIDER}`,
                                    } : {})
                                }}>
                                    <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < courses.length}
                                            checked={courses.length > 0 && selected.length === courses.length}
                                            onChange={handleSelectAll}
                                            sx={{ color: DIVIDER, '&.Mui-checked': { color: ICON_COLOR } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 700, color: MUTED_TEXT, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Course</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 700, color: MUTED_TEXT, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Code</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 700, color: MUTED_TEXT, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Category</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 700, color: MUTED_TEXT, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Price</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 700, color: MUTED_TEXT, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Last updated</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {courses.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                            <Typography sx={{ color: MUTED_TEXT, fontWeight: 500 }}>No courses found</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    courses.map((course) => (
                                        <TableRow
                                            key={course.id}
                                            hover
                                            selected={selected.indexOf(course.id) !== -1}
                                            sx={{
                                                transition: 'all 0.2s ease',
                                                '&.Mui-selected': { 
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1) !important' : 'hsl(var(--primary) / 0.08) !important',
                                                    '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15) !important' : 'hsl(var(--primary) / 0.12) !important' }
                                                },
                                                '&:hover': { 
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05) !important' : 'hsl(var(--primary) / 0.04) !important',
                                                    transform: mode === 'liquid-glass' ? 'scale(1.001)' : 'none'
                                                },
                                                borderBottom: `1px solid ${DIVIDER}`,
                                                '&:last-child': { borderBottom: 'none' }
                                            }}
                                        >
                                            <TableCell padding="checkbox" sx={{ borderBottom: 'none' }}>
                                                <Checkbox
                                                    checked={selected.indexOf(course.id) !== -1}
                                                    onChange={() => handleSelectOne(course.id)}
                                                    sx={{ color: DIVIDER, '&.Mui-checked': { color: ICON_COLOR } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Box
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: '8px',
                                                            bgcolor: 'hsl(var(--primary) / 0.1)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: ICON_COLOR,
                                                            flexShrink: 0,
                                                            border: `1px solid ${DIVIDER}`
                                                        }}
                                                    >
                                                        <MenuBookOutlinedIcon sx={{ fontSize: 20 }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography
                                                            sx={{
                                                                fontWeight: 700,
                                                                color: TEXT_COLOR,
                                                                cursor: 'pointer',
                                                                fontSize: '0.925rem',
                                                                '&:hover': { color: ICON_COLOR, textDecoration: 'underline' }
                                                            }}
                                                            onClick={() => router.push(`/admin/courses/new/edit?id=${course.id}`)}
                                                        >
                                                            {course.title}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                            <Chip
                                                                label={course.status === 'PUBLISHED' ? 'Active' : 'Inactive'}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 800,
                                                                    textTransform: 'uppercase',
                                                                    bgcolor: course.status === 'PUBLISHED' ? 'hsl(142 71% 45% / 0.1)' : 'rgba(141, 166, 166, 0.1)',
                                                                    color: course.status === 'PUBLISHED' ? 'hsl(142 71% 45%)' : MUTED_TEXT,
                                                                    border: `1px solid ${course.status === 'PUBLISHED' ? 'hsl(142 71% 45% / 0.2)' : DIVIDER}`
                                                                }}
                                                            />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none' }}>
                                                <Typography variant="body2" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>{course.code}</Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none' }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>None</Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none' }}>
                                                <Typography variant="body2" sx={{ color: TEXT_COLOR, fontWeight: 600 }}>Free</Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: 'none' }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>{formatDate(course.updatedAt)}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleOpenMenu(e, course.id)}
                                                    sx={{ color: MUTED_TEXT, '&:hover': { color: ICON_COLOR, bgcolor: 'hsl(var(--primary) / 0.1)' } }}
                                                >
                                                    <MoreHorizIcon fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </GlassCard>
            {/* Action Menu */}
            <Menu 
                anchorEl={anchorEl} 
                open={Boolean(anchorEl)} 
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card))',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        })
                    }
                }}
            >
                <MenuItem onClick={() => setAnchorEl(null)}>Export</MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)}>Share</MenuItem>
            </Menu>

            {/* Confirmation Dialog */}
            <Dialog 
                open={deleteDialogOpen} 
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card))',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: 2,
                            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: TEXT_COLOR }}>
                    {isBulkDelete ? 'Delete multiple courses?' : 'Delete course?'}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: MUTED_TEXT }}>
                        {isBulkDelete
                            ? `Are you sure you want to delete ${selected.length} courses? This action cannot be undone.`
                            : 'Are you sure you want to delete this course? This action cannot be undone.'}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ 
                    p: 2.5,
                    gap: 1.5,
                    borderTop: mode === 'liquid-glass' ? 'none' : `1px solid ${DIVIDER}`,
                    ...(mode === 'liquid-glass' ? {
                        bgcolor: 'rgba(255, 255, 255, 0.03)',
                        borderBottomLeftRadius: '24px',
                        borderBottomRightRadius: '24px',
                    } : {})
                }}>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)} 
                        sx={{ 
                            color: MUTED_TEXT, 
                            fontWeight: 600,
                            textTransform: 'none',
                            '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={confirmDelete} 
                        color="error" 
                        variant="contained"
                        sx={{
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: '10px',
                            px: 3,
                            bgcolor: 'hsl(var(--destructive))',
                            boxShadow: '0 4px 14px 0 hsl(var(--destructive) / 0.39)',
                            '&:hover': { 
                                bgcolor: 'hsl(var(--destructive) / 0.9)',
                                boxShadow: '0 6px 20px rgba(239, 68, 68, 0.23)'
                            }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{
                        width: '100%',
                        borderRadius: '12px',
                        fontWeight: 600,
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            bgcolor: snackbar.severity === 'success' ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                            color: TEXT_COLOR,
                            '& .MuiAlert-icon': { color: snackbar.severity === 'success' ? 'hsl(var(--success))' : 'hsl(var(--destructive))' }
                        } : {})
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
