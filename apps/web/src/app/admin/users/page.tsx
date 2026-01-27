'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@shared/http/apiFetch';
import {
    Box,
    Typography,
    Paper,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    IconButton,
    Menu,
    MenuItem,
    Checkbox,
    TableSortLabel,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    FormControl,
    InputLabel,
    CircularProgress,
    Stack,
    Tooltip,
    TablePagination,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getCsrfToken } from '@/lib/client-csrf';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const DIVIDER_VAR = 'hsl(var(--border) / 0.1)';
const TEXT_COLOR_VAR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const CARD_BG = 'hsl(var(--card) / 0.4)';
const TABLE_ROW_HOVER_BG = 'hsl(var(--muted) / 0.05)';
const BORDER_COLOR_02 = 'hsl(var(--border) / 0.2)';
const PRIMARY_HOVER_BG = 'hsl(var(--primary) / 0.9)';
const PRIMARY_SHADOW = '0 6px 20px hsl(var(--primary) / 0.23)';
const BACKGROUND_COLOR_05 = 'hsl(var(--background) / 0.5)';
const PRIMARY_COLOR_01 = 'hsl(var(--primary) / 0.1)';
const PRIMARY_COLOR_02 = 'hsl(var(--primary) / 0.2)';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
const SUCCESS_COLOR_03 = 'hsl(var(--success) / 0.3)';
const SUCCESS_COLOR_01 = 'hsl(var(--success) / 0.1)';
const DESTRUCTIVE_COLOR_MAIN = 'hsl(var(--destructive))';
const DESTRUCTIVE_COLOR_01 = 'hsl(var(--destructive) / 0.1)';
interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    activeRole: string;
    status: string;
    createdAt: string;
    lastLoginAt: string | null;
    avatar?: string;
}

type OrderDirection = 'asc' | 'desc';

export default function UsersPage() {
    const { mode } = useThemeMode();
    const router = useRouter();

    const TEXT_COLOR = TEXT_COLOR_VAR;
    const DIVIDER = DIVIDER_VAR;

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'hsl(var(--glass-bg))',
        border: '1px solid hsl(var(--glass-border))',
        boxShadow: '0 0 20px -5px hsl(var(--glass-glow)), 0 8px 32px -8px hsl(var(--glass-shadow)), inset 0 0 0 1px hsl(var(--glass-border))',
    } : {};
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [orderBy, setOrderBy] = useState<keyof User>('createdAt');
    const [order, setOrder] = useState<OrderDirection>('desc');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addUserMenuAnchor, setAddUserMenuAnchor] = useState<null | HTMLElement>(null);
    const [activeUserRole, setActiveUserRole] = useState<string>('');
    const [activeUserId, setActiveUserId] = useState<string>('');

    // Pagination state
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalUsers, setTotalUsers] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [roleFilter, setRoleFilter] = useState('all');
    const [allBranches, setAllBranches] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        activeRole: 'LEARNER',
    });

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                page: (page + 1).toString(),
                limit: rowsPerPage.toString(),
                search: searchQuery,
                sort_by: orderBy,
                order: order,
            });
            if (roleFilter) queryParams.set('role', roleFilter);
            if (activeUserRole === 'ADMIN') {
                queryParams.set('allNodes', allBranches ? '1' : '0');
            }
            const response = await fetch(`/api/users?${queryParams}`, {
                credentials: 'include',
                cache: 'no-store'
            });
            const data = await response.json();
            const rawUsers = data.data || data.users || [];

            // Map snake_case to camelCase if needed
            const mappedUsers = rawUsers.map((u: any) => ({
                ...u,
                createdAt: u.createdAt || u.created_at,
                lastLoginAt: u.lastLoginAt || u.last_login_at,
                firstName: u.firstName || u.first_name || '',
                lastName: u.lastName || u.last_name || '',
                activeRole: u.activeRole || u.active_role || u.role, // Fallback to role if active_role missing
            }));

            setUsers(mappedUsers);
            setTotalUsers(data.total || 0);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetch('/api/me', { credentials: 'include' }).then(res => res.json()).then(data => {
            if (data.user) {
                setActiveUserRole(data.user.activeRole);
                setActiveUserId(data.user.id);
            }
        });
    }, [page, rowsPerPage, searchQuery, orderBy, order, refreshTrigger, roleFilter, allBranches]);

    const handleRequestSort = (property: keyof User) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
        setPage(0); // Reset to first page when sorting changes
    };

    const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, user: User) => {
        setAnchorEl(event.currentTarget);
        setCurrentUser(user);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        if (currentUser) {
            router.push(`/admin/users/${currentUser.id}/edit`);
        }
        handleCloseMenu();
    };

    const handleDelete = () => {
        setDeleteDialogOpen(true);
        handleCloseMenu();
    };

    const handleAddUser = async () => {
        try {
            await apiFetch('/api/users', {
                method: 'POST',
                body: {
                    ...formData,
                    role: formData.activeRole,
                },
            });

            // Reset sort to show new user first
            setOrderBy('createdAt');
            setOrder('desc');
            setPage(0);

            // Force refresh (handles case where sort was already correct)
            setRefreshTrigger(prev => prev + 1);

            setAddUserDialogOpen(false);
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                username: '',
                password: '',
                activeRole: 'LEARNER',
            });
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleUpdateUser = async () => {
        if (!currentUser) return;

        try {
            await apiFetch(`/api/users/${currentUser.id}`, {
                method: 'PUT',
                body: formData,
            });

            setRefreshTrigger(prev => prev + 1);
            setEditUserDialogOpen(false);
            setCurrentUser(null);
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const handleDeleteUser = async () => {
        if (!currentUser) return;

        try {
            await apiFetch(`/api/users/${currentUser.id}`, {
                method: 'DELETE',
            });

            setRefreshTrigger(prev => prev + 1);
            setDeleteDialogOpen(false);
            setCurrentUser(null);
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    const getTypeColor = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'error';
            case 'SUPER_INSTRUCTOR':
                return 'secondary';
            case 'INSTRUCTOR':
                return 'warning';
            case 'LEARNER':
                return 'success';
            default:
                return 'default';
        }
    };

    // Use server-side sorting only
    const filteredUsers = users;

    return (
        <Box sx={{ p: 3, animation: 'fadeIn 0.5s ease-out' }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, letterSpacing: '-0.02em' }}>
                    Users
                </Typography>
                <Stack direction="row" spacing={2}>
                    {activeUserRole === 'ADMIN' && (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <Select
                                value={allBranches ? 'all' : 'node'}
                                onChange={(e) => setAllBranches(e.target.value === 'all')}
                                sx={{
                                    bgcolor: BACKGROUND_COLOR_05,
                                    borderRadius: '10px',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: DIVIDER },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                    color: TEXT_COLOR,
                                    ...(mode === 'liquid-glass' ? {
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid hsl(var(--glass-border))',
                                    } : {})
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
                                                boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                                            })
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="node">Current Branch</MenuItem>
                                <MenuItem value="all">All Branches</MenuItem>
                            </Select>
                        </FormControl>
                    )}
                    <Button
                        variant="contained"
                        startIcon={<PersonAddIcon />}
                        endIcon={<KeyboardArrowDownIcon />}
                        onClick={(e) => setAddUserMenuAnchor(e.currentTarget)}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 700,
                            borderRadius: '10px',
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            px: 3,
                            height: 44,
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                            '&:hover': {
                                bgcolor: PRIMARY_HOVER_BG,
                                boxShadow: PRIMARY_SHADOW
                            },
                        }}
                    >
                        Add User
                    </Button>
                </Stack>
            </Box>

            {/* Table Container */}
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
                {/* Search & Actions Bar */}
                <Box
                    sx={{
                        p: 2.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid ${DIVIDER}`,
                        bgcolor: TABLE_ROW_HOVER_BG
                    }}
                >
                    <TextField
                        placeholder="Search"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" sx={{ color: MUTED_TEXT }} />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '10px',
                                bgcolor: BACKGROUND_COLOR_05,
                                color: TEXT_COLOR,
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: DIVIDER },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                ...(mode === 'liquid-glass' ? {
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid hsl(var(--glass-border))',
                                } : {})
                            }
                        }}
                        inputProps={{ 'aria-label': 'Search' }}
                        sx={{ width: 320 }}
                    />
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Filter by:
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                            <Select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                                sx={{
                                    borderRadius: '10px',
                                    bgcolor: BACKGROUND_COLOR_05,
                                    color: TEXT_COLOR,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: DIVIDER },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                    ...(mode === 'liquid-glass' ? {
                                        backdropFilter: 'blur(4px)',
                                        border: '1px solid hsl(var(--glass-border))',
                                    } : {})
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
                                                boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                                            })
                                        }
                                    }
                                }}
                            >
                                <MenuItem value="all">All Roles</MenuItem>
                                <MenuItem value="LEARNER">Learner</MenuItem>
                                <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                <MenuItem value="SUPER_INSTRUCTOR">Super Instructor</MenuItem>
                                <MenuItem value="ADMIN">Administrator</MenuItem>
                            </Select>
                        </FormControl>
                        <Tooltip title="Refresh">
                            <IconButton
                                size="small"
                                onClick={() => setRefreshTrigger(prev => prev + 1)}
                                sx={{
                                    color: ICON_COLOR,
                                    bgcolor: PRIMARY_COLOR_01,
                                    '&:hover': { bgcolor: PRIMARY_COLOR_02 }
                                }}
                            >
                                <FilterListIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: TABLE_ROW_HOVER_BG }}>
                                <TableCell padding="checkbox" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                    <Checkbox
                                        checked={selectedUsers.length === users.length && users.length > 0}
                                        indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                                        onChange={handleSelectAll}
                                        sx={{ color: MUTED_TEXT, '&.Mui-checked': { color: ICON_COLOR } }}
                                    />
                                </TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                    <TableSortLabel
                                        active={orderBy === 'firstName'}
                                        direction={orderBy === 'firstName' ? order : 'asc'}
                                        onClick={() => handleRequestSort('firstName')}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: `${TEXT_COLOR} !important`,
                                            '& .MuiTableSortLabel-icon': { color: `${ICON_COLOR} !important` }
                                        }}
                                    >
                                        User
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                    <TableSortLabel
                                        active={orderBy === 'email'}
                                        direction={orderBy === 'email' ? order : 'asc'}
                                        onClick={() => handleRequestSort('email')}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: `${TEXT_COLOR} !important`,
                                            '& .MuiTableSortLabel-icon': { color: `${ICON_COLOR} !important` }
                                        }}
                                    >
                                        Email
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}`, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: TEXT_COLOR }}>Role</TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                    <TableSortLabel
                                        active={orderBy === 'createdAt'}
                                        direction={orderBy === 'createdAt' ? order : 'asc'}
                                        onClick={() => handleRequestSort('createdAt')}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: `${TEXT_COLOR} !important`,
                                            '& .MuiTableSortLabel-icon': { color: `${ICON_COLOR} !important` }
                                        }}
                                    >
                                        Registered
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                    <TableSortLabel
                                        active={orderBy === 'lastLoginAt'}
                                        direction={orderBy === 'lastLoginAt' ? order : 'asc'}
                                        onClick={() => handleRequestSort('lastLoginAt')}
                                        sx={{
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: `${TEXT_COLOR} !important`,
                                            '& .MuiTableSortLabel-icon': { color: `${ICON_COLOR} !important` }
                                        }}
                                    >
                                        Last Login
                                    </TableSortLabel>
                                </TableCell>
                                <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                        <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                                    </TableCell>
                                </TableRow>
                            ) : filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 12 }}>
                                        <Typography sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                                            No users found matching your search
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                    <TableRow
                                        key={user.id}
                                        hover
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: TABLE_ROW_HOVER_BG },
                                            '&.Mui-selected': { bgcolor: PRIMARY_COLOR_01 },
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                    >
                                        <TableCell padding="checkbox" sx={{ borderBottom: 'none' }}>
                                            <Checkbox
                                                checked={selectedUsers.includes(user.id)}
                                                onChange={() => handleSelectUser(user.id)}
                                                sx={{ color: MUTED_TEXT, '&.Mui-checked': { color: ICON_COLOR } }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar
                                                    src={user.avatar}
                                                    sx={{
                                                        width: 36,
                                                        height: 36,
                                                        bgcolor: 'hsl(var(--primary) / 0.2)',
                                                        color: ICON_COLOR,
                                                        fontWeight: 700,
                                                        fontSize: '0.9rem',
                                                        border: `1px solid ${DIVIDER}`
                                                    }}
                                                >
                                                    {user.firstName?.[0] || user.username?.[0]}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ color: TEXT_COLOR, fontWeight: 700, fontSize: '0.95rem' }}>
                                                        {user.firstName} {user.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                                                        @{user.username}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Typography sx={{ color: TEXT_COLOR, fontSize: '0.9rem', fontWeight: 500 }}>
                                                {user.email}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Chip
                                                label={user.activeRole}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                    borderRadius: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    borderWidth: '1.5px',
                                                    ...(user.activeRole === 'LEARNER' && { color: SUCCESS_COLOR_MAIN, borderColor: SUCCESS_COLOR_03, bgcolor: SUCCESS_COLOR_01 }),
                                                    ...(user.activeRole === 'ADMIN' && { color: DESTRUCTIVE_COLOR_MAIN, borderColor: DESTRUCTIVE_COLOR_01, bgcolor: DESTRUCTIVE_COLOR_01 }),
                                                    ...(user.activeRole === 'SUPER_INSTRUCTOR' && { color: ICON_COLOR, borderColor: PRIMARY_COLOR_01, bgcolor: PRIMARY_COLOR_01 }),
                                                    ...(user.activeRole === 'INSTRUCTOR' && { color: MUTED_TEXT, borderColor: BORDER_COLOR_02, bgcolor: TABLE_ROW_HOVER_BG }),
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Typography sx={{ color: MUTED_TEXT, fontSize: '0.85rem', fontWeight: 600 }}>
                                                {formatDate(user.createdAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Typography sx={{ color: MUTED_TEXT, fontSize: '0.85rem', fontWeight: 600 }}>
                                                {formatDate(user.lastLoginAt)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    setAnchorEl(e.currentTarget);
                                                    setCurrentUser(user);
                                                }}
                                                sx={{ color: MUTED_TEXT, '&:hover': { color: ICON_COLOR, bgcolor: 'hsl(var(--primary) / 0.1)' } }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalUsers}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(_, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    sx={{
                        borderTop: `1px solid ${DIVIDER}`,
                        color: MUTED_TEXT,
                        '& .MuiTablePagination-selectIcon': { color: MUTED_TEXT },
                        '& .MuiIconButton-root': { color: ICON_COLOR },
                    }}
                />
            </GlassCard>

            <Menu
                anchorEl={addUserMenuAnchor}
                open={Boolean(addUserMenuAnchor)}
                onClose={() => setAddUserMenuAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                        })
                    }
                }}
            >
                <MenuItem
                    onClick={() => {
                        setAddUserMenuAnchor(null);
                        router.push('/admin/users/new');
                    }}
                >
                    Add user manually
                </MenuItem>
                <MenuItem
                    onClick={() => {
                        setAddUserMenuAnchor(null);
                        setAddUserDialogOpen(true);
                    }}
                >
                    Quick add
                </MenuItem>
            </Menu>

            {/* Actions Menu */}
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
                            bgcolor: 'hsl(var(--card))',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: 2,
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                        })
                    }
                }}
            >
                <MenuItem
                    onClick={handleEdit}
                    disabled={activeUserRole === 'SUPER_INSTRUCTOR' && currentUser?.activeRole === 'ADMIN'}
                >
                    Edit
                </MenuItem>
                <Tooltip
                    title={
                        currentUser?.id === activeUserId
                            ? "You cannot delete your own account"
                            : (activeUserRole === 'SUPER_INSTRUCTOR' && currentUser?.activeRole === 'ADMIN')
                                ? "Super Instructors cannot delete Admins"
                                : ""
                    }
                    placement="left"
                >
                    <span>
                        <MenuItem
                            onClick={handleDelete}
                            sx={{ color: 'error.main' }}
                            disabled={
                                (activeUserRole === 'SUPER_INSTRUCTOR' && (currentUser?.activeRole === 'ADMIN' || currentUser?.id === activeUserId)) ||
                                (currentUser?.id === activeUserId)
                            }
                        >
                            Delete
                        </MenuItem>
                    </span>
                </Tooltip>
            </Menu>

            {/* Add User Dialog */}
            <Dialog
                open={addUserDialogOpen}
                onClose={() => setAddUserDialogOpen(false)}
                maxWidth="sm"
                fullWidth
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
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle>Add New User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Username"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.activeRole}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, activeRole: e.target.value })}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                ...glassStyle,
                                                ...(mode === 'liquid-glass' ? {
                                                    borderRadius: '12px',
                                                    marginTop: '8px',
                                                    '& .MuiMenuItem-root': {
                                                        padding: '10px 16px',
                                                        '&:hover': {
                                                            backgroundColor: 'hsl(var(--primary) / 0.1)',
                                                        },
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'hsl(var(--primary) / 0.15)',
                                                            '&:hover': {
                                                                backgroundColor: 'hsl(var(--primary) / 0.2)',
                                                            },
                                                        },
                                                    },
                                                } : {
                                                    bgcolor: 'hsl(var(--popover))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '12px',
                                                    marginTop: '8px',
                                                }),
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="LEARNER">Learner</MenuItem>
                                    <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                    <MenuItem value="SUPER_INSTRUCTOR">Super instructor</MenuItem>
                                    {activeUserRole === 'ADMIN' && <MenuItem value="ADMIN">Administrator</MenuItem>}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: mode === 'liquid-glass' ? '1px solid hsl(var(--glass-border))' : 'none' }}>
                    <Button
                        onClick={() => setAddUserDialogOpen(false)}
                        sx={{
                            color: TEXT_COLOR,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddUser}
                        sx={{
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            '&:hover': {
                                bgcolor: PRIMARY_HOVER_BG,
                            },
                        }}
                    >
                        Add User
                    </Button>
                </DialogActions>
            </Dialog >

            {/* Edit User Dialog */}
            <Dialog
                open={editUserDialogOpen}
                onClose={() => setEditUserDialogOpen(false)}
                maxWidth="sm"
                fullWidth
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
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle>Edit User</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                fullWidth
                                label="First Name"
                                value={formData.firstName}
                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                            <TextField
                                fullWidth
                                label="Last Name"
                                value={formData.lastName}
                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <Select
                                    value={formData.activeRole}
                                    label="Role"
                                    onChange={(e) => setFormData({ ...formData, activeRole: e.target.value })}
                                    disabled={activeUserRole === 'SUPER_INSTRUCTOR' && currentUser?.activeRole === 'ADMIN'}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                ...glassStyle,
                                                ...(mode === 'liquid-glass' ? {
                                                    borderRadius: '12px',
                                                    marginTop: '8px',
                                                    '& .MuiMenuItem-root': {
                                                        padding: '10px 16px',
                                                        '&:hover': {
                                                            backgroundColor: 'hsl(var(--primary) / 0.1)',
                                                        },
                                                        '&.Mui-selected': {
                                                            backgroundColor: 'hsl(var(--primary) / 0.15)',
                                                            '&:hover': {
                                                                backgroundColor: 'hsl(var(--primary) / 0.2)',
                                                            },
                                                        },
                                                    },
                                                } : {
                                                    bgcolor: 'hsl(var(--popover))',
                                                    border: '1px solid hsl(var(--border))',
                                                    borderRadius: '12px',
                                                    marginTop: '8px',
                                                }),
                                            },
                                        },
                                    }}
                                >
                                    <MenuItem value="LEARNER">Learner</MenuItem>
                                    <MenuItem value="INSTRUCTOR">Instructor</MenuItem>
                                    <MenuItem value="SUPER_INSTRUCTOR">Super instructor</MenuItem>
                                    {activeUserRole === 'ADMIN' && <MenuItem value="ADMIN">Administrator</MenuItem>}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid >
                </DialogContent >
                <DialogActions sx={{ p: 2, borderTop: mode === 'liquid-glass' ? '1px solid hsl(var(--glass-border))' : 'none' }}>
                    <Button
                        onClick={() => setEditUserDialogOpen(false)}
                        sx={{
                            color: TEXT_COLOR,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpdateUser}
                        sx={{
                            bgcolor: ICON_COLOR,
                            color: 'hsl(var(--primary-foreground))',
                            '&:hover': {
                                bgcolor: PRIMARY_HOVER_BG,
                            },
                        }}
                    >
                        Save Changes
                    </Button>
                </DialogActions>
            </Dialog >

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
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
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.4)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle>Delete User</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete {currentUser?.firstName} {currentUser?.lastName}? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: mode === 'liquid-glass' ? '1px solid hsl(var(--glass-border))' : 'none' }}>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        sx={{
                            color: TEXT_COLOR,
                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteUser}
                        sx={{
                            bgcolor: 'error.main',
                            color: 'hsl(var(--primary-foreground))',
                            '&:hover': {
                                bgcolor: 'error.dark',
                            },
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog >
        </Box >
    );
}
