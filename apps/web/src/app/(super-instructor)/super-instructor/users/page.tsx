'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Menu, MenuItem,
    Chip, Avatar, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import Link from '@shared/ui/AppLink';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    status: string;
    activeRole: string;
    createdAt: string;
}

export default function SuperInstructorUsersPage() {
    const { mode } = useThemeMode();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page + 1),
                limit: String(rowsPerPage),
                search,
            });
            const res = await fetch(`/api/super-instructor/users?${params}`, {
                credentials: 'include',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                console.error('Failed to fetch users:', res.status, errorData);
                if (res.status === 401) {
                    // Redirect to login if not authenticated
                    window.location.href = '/login?redirect=/super-instructor/users';
                    return;
                }
                return;
            }

            const data = await res.json();
            setUsers(data.data || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [page, rowsPerPage, search]);

    useEffect(() => {
        void fetchUsers();
    }, [fetchUsers]);

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
        setAnchorEl(event.currentTarget);
        setSelectedUser(user);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedUser(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'success';
            case 'INACTIVE': return 'default';
            case 'DEACTIVATED': return 'error';
            default: return 'default';
        }
    };

    const getRoleColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'hsl(var(--destructive))';
            case 'SUPER_INSTRUCTOR': return 'hsl(var(--secondary))';
            case 'INSTRUCTOR': return 'hsl(var(--primary))';
            case 'LEARNER': return 'hsl(var(--success))';
            default: return 'hsl(var(--muted-foreground))';
        }
    };

    // Filter out ADMIN users - Super Instructors cannot manage them
    const filteredUsers = users.filter(u => u.activeRole !== 'ADMIN');

    return (
        <Box className="animate-fade-in" sx={{ p: { xs: 2, md: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: 'hsl(var(--primary) / 0.1)',
                        color: 'hsl(var(--primary))',
                        display: 'flex',
                        boxShadow: '0 0 20px hsl(var(--primary) / 0.15)'
                    }}>
                        <PeopleOutlineIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Users</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Manage your educational ecosystem directory</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/users/new"
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{
                        bgcolor: 'hsl(var(--primary))',
                        color: 'white',
                        px: 3,
                        py: 1.2,
                        borderRadius: 2.5,
                        fontWeight: 700,
                        boxShadow: '0 8px 16px hsl(var(--primary) / 0.25)',
                        '&:hover': {
                            bgcolor: 'hsl(var(--primary))',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 12px 20px hsl(var(--primary) / 0.35)',
                        },
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                >
                    Add User
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search users by name, email or username..."
                    size="small"
                    fullWidth
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: 'hsl(var(--primary))', mr: 1 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        maxWidth: 500,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(var(--card) / 0.4)',
                            borderRadius: 2.5,
                            '& fieldset': { borderColor: 'hsl(var(--border))' },
                            '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                            '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                        }
                    }}
                />
            </Box>

            <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'background.paper' }}>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Role</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</TableCell>
                            <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Joined</TableCell>
                            <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : filteredUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                    No users found
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id} sx={{ '&:hover': { bgcolor: 'hsl(var(--primary) / 0.03)' } }}>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                                            <Avatar sx={{
                                                bgcolor: 'hsl(var(--primary) / 0.1)',
                                                color: 'hsl(var(--primary))',
                                                width: 42, height: 42,
                                                fontWeight: 700,
                                                fontSize: 16,
                                                border: '1px solid hsl(var(--primary) / 0.2)'
                                            }}>
                                                {user.firstName?.[0]?.toUpperCase()}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                                    {user.firstName} {user.lastName}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>
                                                    @{user.username}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.activeRole.replace(/_/g, ' ')}
                                            size="small"
                                            sx={{
                                                bgcolor: user.activeRole === 'SUPER_INSTRUCTOR' ? 'hsl(var(--secondary) / 0.15)' : 'hsl(var(--card) / 0.6)',
                                                color: user.activeRole === 'SUPER_INSTRUCTOR' ? 'hsl(var(--secondary))' : 'hsl(var(--foreground))',
                                                fontWeight: 700,
                                                fontSize: 10,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.02em',
                                                border: '1px solid hsl(var(--border) / 0.15)'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.status}
                                            size="small"
                                            sx={{
                                                bgcolor: user.status === 'ACTIVE' ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--card) / 0.6)',
                                                color: user.status === 'ACTIVE' ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                                                fontWeight: 800,
                                                fontSize: 10,
                                                borderRadius: 1.5,
                                                border: '1px solid hsl(var(--success) / 0.15)'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => handleMenuOpen(e, user)} sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--primary))' } }}>
                                            <MoreVertIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
                />
            </TableContainer>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'background.paper',
                            backdropFilter: 'blur(16px)',
                            border: '1px solid hsl(var(--border) / 0.2)',
                            boxShadow: '0 10px 40px hsl(var(--glass-shadow))',
                            borderRadius: 3,
                        }),
                        mt: 1
                    }
                }}
            >
                <MenuItem onClick={handleMenuClose} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}>View Details</MenuItem>
                <MenuItem
                    onClick={() => {
                        if (selectedUser) {
                            window.location.href = `/super-instructor/users/${selectedUser.id}/edit`;
                        }
                        handleMenuClose();
                    }}
                    sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}
                >
                    Edit User
                </MenuItem>
                <MenuItem onClick={handleMenuClose} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 600, color: 'hsl(var(--destructive))' }}>Delete User</MenuItem>
            </Menu>
        </Box>
    );
}
