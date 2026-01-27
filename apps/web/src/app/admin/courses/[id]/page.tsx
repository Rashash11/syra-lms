'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, Tabs, Tab, Menu, MenuItem, Select, FormControl,
    Snackbar, Alert, CircularProgress,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import { apiFetch } from '@shared/http/apiFetch';
import UserEnrollmentDialog from './UserEnrollmentDialog';
import { getCsrfToken } from '@/lib/client-csrf';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = '#1a5455';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface CourseUser {
    id: string;
    userId: string;
    user: {
        firstName: string;
        lastName: string;
        email: string;
    };
    role: string;
    progress: number;
    enrolledAt: string;
    completedAt: string | null;
    expiresAt: string | null;
}

export default function CourseDetailsPage() {
    const { mode } = useThemeMode();
    
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;

    const [course, setCourse] = useState<any>(null);
    const [users, setUsers] = useState<CourseUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentTab, setCurrentTab] = useState(0);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

    const fetchUsers = useCallback(async () => {
        try {
            // Only set loading on initial fetch or full refresh if desired, 
            // but for smooth UX maybe we don't need to unset/set loading every time if we just want to update data.
            // However, existing logic used loading state for the whole page.
            // Let's keep it simply reusing the logic but maybe guard loading state if needed.
            // For now, simple refactoring.
            const data = await apiFetch<any>(`/api/courses/${courseId}/enrollments`);
            
            // API returns { enrollments, total, page, limit }
            const formattedUsers = (data.enrollments || []).map((e: any) => ({
                id: e.id,
                userId: e.userId,
                user: {
                    firstName: e.user?.name?.split(' ')[0] || 'Unknown',
                    lastName: e.user?.name?.split(' ').slice(1).join(' ') || '',
                    email: e.user?.email || 'unknown@example.com'
                },
                role: 'LEARNER',
                progress: e.progress || 0,
                enrolledAt: e.enrolledAt,
                completedAt: e.completedAt,
                expiresAt: e.expiresAt
            }));
            setUsers(formattedUsers);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const data = await apiFetch<any>(`/api/courses/${courseId}`);
                setCourse(data);
            } catch (error) {
                console.error('Error fetching course:', error);
            }
        };

        if (courseId) {
            fetchCourse();
            void fetchUsers();
        }
    }, [courseId, fetchUsers]);

    const handleEnrollUsers = async (userIds: string[]) => {
        try {
            const data = await apiFetch<any>(`/api/courses/${courseId}/enrollments`, {
                method: 'POST',
                body: { userIds },
            });

            setSnackbar({
                open: true,
                message: `Successfully enrolled ${data.enrolled} users` + (data.skipped ? ` (${data.skipped} skipped)` : ''),
                severity: 'success'
            });
            fetchUsers();
        } catch (err: any) {
            console.error(err);
            const msg = err.details?.error || err.message || 'Failed to enroll users';
            setSnackbar({ open: true, message: msg, severity: 'error' });
            throw err;
        }
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelected(users.map(u => u.id));
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

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress sx={{ color: ICON_COLOR }} />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Course Details
                        </Typography>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, mt: 0.5 }}>
                            {course?.title || 'Course Overview'}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => router.push(`/admin/courses/new/edit?id=${courseId}`)}
                        sx={{ 
                            bgcolor: ICON_COLOR,
                            color: 'white',
                            textTransform: 'none', 
                            fontWeight: 700,
                            borderRadius: '12px',
                            px: 3,
                            height: 44,
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                            '&:hover': { 
                                bgcolor: 'hsl(var(--primary) / 0.9)',
                                boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                            }
                        }}
                    >
                        Edit course
                    </Button>
                </Box>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: `1px solid ${DIVIDER}`, mb: 4 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={(e, v) => setCurrentTab(v)}
                    sx={{
                        '& .MuiTabs-indicator': { bgcolor: ICON_COLOR, height: 3, borderRadius: '3px 3px 0 0' },
                        '& .MuiTab-root': { 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            fontSize: '0.95rem',
                            color: MUTED_TEXT,
                            '&.Mui-selected': { color: ICON_COLOR }
                        }
                    }}
                >
                    <Tab label="Users" />
                    <Tab label="Groups" />
                    <Tab label="Branches" />
                    <Tab label="Files" />
                </Tabs>
            </Box>

            {/* Search and Actions */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                        placeholder="Search users..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ 
                            width: 320,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                border: `1px solid ${DIVIDER}`,
                                '&:hover': { bgcolor: 'hsl(var(--card) / 0.3)' },
                                '&.Mui-focused': { borderColor: ICON_COLOR }
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: MUTED_TEXT }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <IconButton 
                        size="small" 
                        sx={{ 
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: '12px',
                            width: 40,
                            height: 40,
                            bgcolor: 'hsl(var(--card) / 0.2)',
                            color: MUTED_TEXT,
                            '&:hover': { bgcolor: 'hsl(var(--card) / 0.3)' }
                        }}
                    >
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setEnrollDialogOpen(true)}
                    sx={{ 
                        textTransform: 'none', 
                        fontWeight: 700,
                        borderRadius: '12px',
                        px: 3,
                        height: 44,
                        borderColor: ICON_COLOR,
                        color: ICON_COLOR,
                        '&:hover': { 
                            borderColor: ICON_COLOR,
                            bgcolor: 'hsl(var(--primary) / 0.05)'
                        }
                    }}
                >
                    Enroll to course
                </Button>
            </Box>

            {/* Users Table */}
            {currentTab === 0 && (
                <GlassCard
                    p={0}
                    sx={{
                        width: '100%',
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
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ 
                                bgcolor: mode === 'liquid-glass' ? 'transparent' : 'hsl(var(--card) / 0.2)',
                                ...(mode === 'liquid-glass' ? {
                                    '& .MuiTableCell-head': {
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        backdropFilter: 'blur(10px)',
                                    }
                                } : {})
                            }}>
                                <TableRow>
                                    <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                        <Checkbox
                                            indeterminate={selected.length > 0 && selected.length < users.length}
                                            checked={users.length > 0 && selected.length === users.length}
                                            onChange={handleSelectAll}
                                            sx={{ color: MUTED_TEXT, '&.Mui-checked': { color: ICON_COLOR } }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>User</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Role</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Progress status</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Enrollment date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Completion date</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Expiration date</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                                            <Typography color="text.secondary">No users enrolled yet</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((enrollment) => (
                                        <TableRow
                                            key={enrollment.id}
                                            hover
                                            selected={selected.indexOf(enrollment.id) !== -1}
                                            sx={{ '&.Mui-selected': { bgcolor: 'hsl(var(--primary) / 0.05)' } }}
                                        >
                                            <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Checkbox
                                                    checked={selected.indexOf(enrollment.id) !== -1}
                                                    onChange={() => handleSelectOne(enrollment.id)}
                                                    sx={{ color: MUTED_TEXT, '&.Mui-checked': { color: ICON_COLOR } }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600, color: TEXT_COLOR }}>
                                                    {enrollment.user.firstName} {enrollment.user.lastName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: MUTED_TEXT }}>
                                                    {enrollment.user.email}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                                    <Select 
                                                        value={enrollment.role} 
                                                        displayEmpty
                                                        sx={{ 
                                                            borderRadius: '8px',
                                                            '& .MuiOutlinedInput-notchedOutline': { borderColor: DIVIDER }
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
                                                                        border: `1px solid ${DIVIDER}`,
                                                                        borderRadius: 2,
                                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                                                    })
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value="LEARNER">Learner</MenuItem>
                                                        <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>-</Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                                    {formatDate(enrollment.enrolledAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                                    {formatDate(enrollment.completedAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                                    {formatDate(enrollment.expiresAt)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <IconButton size="small" sx={{ color: MUTED_TEXT }}>
                                                    <MoreHorizIcon sx={{ fontSize: 18 }} />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GlassCard>
            )}

            {/* Other tabs placeholders */}
            {currentTab !== 0 && (
                <GlassCard sx={{ p: 8, textAlign: 'center' }}>
                    <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR, mb: 1 }}>
                            {currentTab === 1 ? 'Groups' : currentTab === 2 ? 'Branches' : 'Files'} Coming Soon
                        </Typography>
                        <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                            We are working hard to bring this feature to you. Stay tuned!
                        </Typography>
                    </Box>
                </GlassCard>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <UserEnrollmentDialog
                open={enrollDialogOpen}
                onClose={() => setEnrollDialogOpen(false)}
                onEnroll={handleEnrollUsers}
                enrolledUserIds={users.map(u => u.userId)}
            />
        </Box>
    );
}
