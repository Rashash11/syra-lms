'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Button,
    IconButton,
    InputBase,
    MenuItem,
    Select,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

interface CourseUsersTabProps {
    courseId: string;
    onEnrollClick?: () => void;
    onClose?: () => void;
}

export default function CourseUsersTab({ courseId, onEnrollClick, onClose }: CourseUsersTabProps) {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<any[]>([]);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/courses/${courseId}/enrollments`, {
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.enrollments || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        if (courseId) void fetchUsers();
    }, [courseId, fetchUsers]);

    const handleRoleUpdate = async (userId: string, newRole: string) => {
        if (process.env.NEXT_PUBLIC_CLIENT_DEBUG === '1') {
            console.log('Update role for', userId, 'to', newRole);
        }
        // Optimistic update
        setUsers(prev => prev.map(u => u.userId === userId ? { ...u, role: newRole === 'Instructor' ? 'INSTRUCTOR' : 'LEARNER' } : u));
    };

    const displayUsers = users;

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
            {/* Header */}
            <Box sx={{
                px: 4, py: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid hsl(var(--border))'
            }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                    Users
                </Typography>
                <IconButton onClick={onClose}>
                    <CloseIcon />
                </IconButton>
            </Box>

            {/* Content Actions */}
            <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        {/* Search Bar */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: '2px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                width: 300,
                                bgcolor: 'hsl(var(--card) / 0.6)',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '4px'
                            }}
                        >
                            <InputBase
                                sx={{ ml: 1, flex: 1, fontSize: '0.9rem' }}
                                placeholder="Search"
                            />
                            <IconButton sx={{ p: '10px' }} aria-label="search">
                                <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </IconButton>
                        </Paper>

                        {/* Filter */}
                        <IconButton>
                            <FilterListIcon sx={{ color: 'text.secondary' }} />
                        </IconButton>
                    </Box>

                    {/* Enroll Button */}
                    <Button
                        startIcon={<PersonAddIcon />}
                        onClick={onEnrollClick}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            color: 'primary.main',
                            '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                        }}
                    >
                        Enroll to course
                    </Button>
                </Box>

                {/* Users Table */}
                <TableContainer
                    component={Paper}
                    elevation={0}
                    variant="outlined"
                    sx={{ borderRadius: 0, border: 'none', borderBottom: '1px solid hsl(var(--border))' }}
                >
                    <Table sx={{ minWidth: 800 }}>
                        <TableHead sx={{ bgcolor: 'hsl(var(--card) / 0.6)' }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox size="small" />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}>
                                        User <KeyboardArrowUpIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    </Box>
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>Progress status</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>Enrollment date</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>Completion date</TableCell>
                                <TableCell sx={{ fontWeight: 700, fontSize: '0.8rem', color: 'text.primary' }}>Expiration date</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {displayUsers.map((user: any, index: number) => (
                                <TableRow key={index} hover>
                                    <TableCell padding="checkbox">
                                        <Checkbox size="small" />
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary' }}>
                                        {user.user?.name || 'Unknown User'}
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={user.role === 'INSTRUCTOR' ? 'Instructor' : 'Learner'}
                                            onChange={(e) => handleRoleUpdate(user.userId, e.target.value)}
                                            size="small"
                                            variant="standard"
                                            disableUnderline
                                            sx={{ fontSize: '0.875rem', '& .MuiSelect-select': { py: 0.5 } }}
                                        >
                                            <MenuItem value="Learner">Learner</MenuItem>
                                            <MenuItem value="Instructor">Instructor</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                        {/* Placeholder for progress status logic */}
                                        {user.status === 'NOT_STARTED' ? 'Not Started' : user.status}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                        {user.enrolledAt ? new Date(user.enrolledAt).toLocaleDateString('en-GB') : '-'}
                                    </TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>-</TableCell>
                                    <TableCell sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>-</TableCell>
                                </TableRow>
                            ))}
                            {displayUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                        <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                            No users enrolled in this course yet.
                                        </Typography>
                                        <Button
                                            variant="text"
                                            onClick={onEnrollClick}
                                            sx={{ mt: 1, textTransform: 'none' }}
                                        >
                                            Enroll users now
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Bottom Actions */}
                <Box sx={{ mt: 2 }}>
                    <IconButton size="small">
                        <DownloadIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </IconButton>
                </Box>
            </Box>
        </Box>
    );
}
