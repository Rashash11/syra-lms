'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Drawer, Box, Typography, IconButton, TextField, InputAdornment,
    Button, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Avatar, Chip, CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { apiFetch } from '@shared/http/apiFetch';
import EnrollmentDialog from './EnrollmentDialog';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface Enrollment {
    id: string;
    userId: string;
    role: string;
    status: string;
    progress: number;
    enrolledAt: string;
    completedAt?: string;
    expiresAt?: string;
    user: User | null;
}

interface UsersPanelProps {
    open: boolean;
    pathId: string;
    onClose: () => void;
}

export default function UsersPanel({ open, pathId, onClose }: UsersPanelProps) {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showEnrollDialog, setShowEnrollDialog] = useState(false);

    // Fetch enrollments
    const fetchEnrollments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);

            const response = await fetch(`/api/learning-paths/${pathId}/enrollments?${params}`);
            if (response.ok) {
                const data = await response.json();
                setEnrollments(data.enrollments || []);
            }
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        } finally {
            setLoading(false);
        }
    }, [pathId, searchQuery]);

    useEffect(() => {
        if (open) {
            void fetchEnrollments();
        }
    }, [fetchEnrollments, open]);

    // Handle remove enrollment
    const handleRemoveEnrollment = async (userId: string) => {
        if (!confirm('Remove this user from the learning path?')) return;

        try {
            await apiFetch(`/api/learning-paths/${pathId}/enrollments?userId=${userId}`, {
                method: 'DELETE',
            });
            await fetchEnrollments();
        } catch (error) {
            console.error('Failed to remove enrollment:', error);
        }
    };

    // Format date
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    // Get role color
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'error';
            case 'INSTRUCTOR': return 'warning';
            case 'LEARNER': return 'default';
            default: return 'default';
        }
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                sx={{
                    zIndex: 1400,
                }}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: '90%', md: '80%', lg: '70%' },
                        zIndex: 1400,
                    }
                }}
                ModalProps={{
                    keepMounted: false,
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderBottom: '1px solid rgba(141, 166, 166, 0.1)',
                    }}>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>Users</Typography>
                        <IconButton onClick={onClose} sx={{ color: 'hsl(var(--muted-foreground))' }}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Search and Actions */}
                    <Box sx={{ p: 2, borderBottom: '1px solid rgba(141, 166, 166, 0.1)' }}>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <TextField
                                placeholder="Search"
                                size="small"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ color: 'hsl(var(--muted-foreground))' }} />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ flex: 1 }}
                            />
                            <IconButton size="small" sx={{ border: '1px solid rgba(141, 166, 166, 0.2)', color: 'hsl(var(--foreground))' }}>
                                <FilterListIcon />
                            </IconButton>
                        </Box>
                        <Button
                            variant="text"
                            startIcon={<PersonAddIcon />}
                            onClick={() => setShowEnrollDialog(true)}
                            sx={{
                                color: 'hsl(var(--primary))',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': { bgcolor: 'rgba(26, 84, 85, 0.08)' },
                            }}
                        >
                            Enroll to learning path
                        </Button>
                    </Box>

                    {/* Table */}
                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : enrollments.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography color="text.secondary">
                                    No users enrolled yet
                                </Typography>
                            </Box>
                        ) : (
                            <TableContainer component={Paper} elevation={0}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>User</TableCell>
                                            <TableCell>Role</TableCell>
                                            <TableCell>Progress status</TableCell>
                                            <TableCell>Enrollment date</TableCell>
                                            <TableCell>Completion date</TableCell>
                                            <TableCell>Expiration date</TableCell>
                                            <TableCell width={50}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {enrollments.map((enrollment) => (
                                            <TableRow key={enrollment.id} hover>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Avatar
                                                            src={enrollment.user?.avatar}
                                                            sx={{ width: 32, height: 32 }}
                                                        >
                                                            {enrollment.user?.name.charAt(0)}
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="body2">
                                                                {enrollment.user?.name || 'Unknown User'}
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {enrollment.user?.email}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={enrollment.role}
                                                        size="small"
                                                        color={getRoleColor(enrollment.role) as any}
                                                    />
                                                </TableCell>
                                                <TableCell>{enrollment.status}</TableCell>
                                                <TableCell>{formatDate(enrollment.enrolledAt)}</TableCell>
                                                <TableCell>{formatDate(enrollment.completedAt)}</TableCell>
                                                <TableCell>{formatDate(enrollment.expiresAt)}</TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleRemoveEnrollment(enrollment.userId)}
                                                        sx={{ color: 'error.main' }}
                                                    >
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </Box>
            </Drawer>

            {/* Enroll Users Dialog */}
            <EnrollmentDialog
                open={showEnrollDialog}
                onClose={() => setShowEnrollDialog(false)}
                pathId={pathId}
                onSuccess={() => {
                    void fetchEnrollments();
                }}
                excludeUserIds={enrollments.map(e => e.userId)}
            />
        </>
    );
}
