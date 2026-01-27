'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, Menu, MenuItem, ToggleButtonGroup, ToggleButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Tooltip,
    Card, CardContent, CardActions, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import FolderIcon from '@mui/icons-material/Folder';
import { useRouter } from 'next/navigation';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import Link from '@shared/ui/AppLink';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@shared/http/apiFetch';
import { getCsrfToken } from '@/lib/client-csrf';
import EnrollmentDialog from './[id]/edit/components/EnrollmentDialog';
import { useToast } from '@/shared/providers/ToastProvider';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const CARD_BG_LIGHT = 'hsl(var(--card) / 0.2)';
const CARD_BG_MEDIUM = 'hsl(var(--card) / 0.3)';
const PRIMARY_HOVER_BG = 'hsl(var(--primary) / 0.9)';
const PRIMARY_SHADOW = 'rgba(26, 84, 85, 0.23)';
const CARD_BG_OPAQUE = 'hsl(var(--card) / 0.8)';
const SHADOW_COLOR = 'rgba(0,0,0,0.4)';

interface LearningPath {
    id: string;
    name: string;
    code: string;
    category: string;
    courseCount: number;
    status: string;
    updatedAt: string;
    createdAt: string;
}

type SortField = 'name' | 'code' | 'category' | 'courses' | 'updatedAt';

export default function LearningPathsPage() {
    const { mode } = useThemeMode();
    const router = useRouter();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const { can, loading: permissionsLoading } = usePermissions();
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
    const [enrollPathId, setEnrollPathId] = useState<string | null>(null);
    const { showToast } = useToast();

    // Permission checks
    const FORCE_E2E = process.env.NEXT_PUBLIC_E2E_FORCE_ADMIN_CTA === '1';
    const canCreate = FORCE_E2E || can('learning_path:create');
    const canDelete = FORCE_E2E || can('learning_path:delete');

    const fetchLearningPaths = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: searchQuery,
                status: statusFilter,
                sortBy,
                sortOrder,
            });
            const data = await apiFetch<any>(`/api/learning-paths?${params}`);
            setLearningPaths(data.learningPaths || data.data || []);
        } catch (error) {
            console.error('Failed to fetch learning paths:', error);
            showToast('Failed to load learning paths', 'error');
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, sortBy, sortOrder, showToast]);

    useEffect(() => {
        fetchLearningPaths();
    }, [fetchLearningPaths]);

    const handleSort = (field: SortField) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, path: LearningPath) => {
        setAnchorEl(event.currentTarget);
        setSelectedPath(path);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPath(null);
    };

    const handleEdit = () => {
        if (selectedPath) {
            const id = selectedPath.id;
            handleMenuClose();
            router.push(`/admin/learning-paths/${id}/edit`);
        } else {
            handleMenuClose();
        }
    };

    const handleManage = () => {
        if (selectedPath) {
            const id = selectedPath.id;
            handleMenuClose();
            router.push(`/admin/learning-paths/${id}/edit?drawer=users`);
        } else {
            handleMenuClose();
        }
    };

    const handleDelete = () => {
        // Don't close menu or clear selectedPath yet - need it for the dialog
        setAnchorEl(null); // Close menu only
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedPath) return;

        setDeleting(true);
        try {
            await apiFetch(`/api/learning-paths/${selectedPath.id}`, {
                method: 'DELETE',
            });
            await fetchLearningPaths();
            setDeleteDialogOpen(false);
            setSelectedPath(null);
            showToast('Learning path deleted successfully', 'success');
        } catch (error: any) {
            console.error('Failed to delete learning path:', error);
            const msg = error.details?.error || error.message || 'Failed to delete learning path';
            showToast(msg, 'error');
        } finally {
            setDeleting(false);
        }
    };

    const cancelDelete = () => {
        setDeleteDialogOpen(false);
        setSelectedPath(null);
    };

    const handleEnroll = (path: LearningPath) => {
        console.log('[ListPage] handleEnroll clicked', path.id);
        setEnrollPathId(path.id);
        setEnrollDialogOpen(true);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        } else if (diffDays < 30) {
            return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'published':
                return 'success';
            case 'draft':
                return 'warning';
            case 'inactive':
                return 'default';
            default:
                return 'default';
        }
    };

    const renderSortIcon = (field: SortField) => {
        if (sortBy !== field) return null;
        return sortOrder === 'asc' ? (
            <ArrowUpwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
        ) : (
            <ArrowDownwardIcon sx={{ fontSize: 16, ml: 0.5 }} />
        );
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, mb: 1, letterSpacing: '-0.02em' }}>
                        Learning Paths
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                        Manage and organize your curriculum structures
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {/* Search */}
                    <TextField
                        size="small"
                        placeholder="Search learning paths..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{
                            width: 320,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: CARD_BG_LIGHT,
                                border: `1px solid ${DIVIDER}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: CARD_BG_MEDIUM,
                                },
                                '&.Mui-focused': {
                                    borderColor: ICON_COLOR,
                                    boxShadow: `0 0 0 4px ${ICON_COLOR}20`,
                                }
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

                    {/* View Toggle */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(e, newMode) => newMode && setViewMode(newMode)}
                        size="small"
                        sx={{
                            height: 44,
                            bgcolor: CARD_BG_LIGHT,
                            borderRadius: '12px',
                            p: 0.5,
                            border: `1px solid ${DIVIDER}`,
                            '& .MuiToggleButton-root': {
                                border: 'none',
                                borderRadius: '8px',
                                px: 2,
                                color: MUTED_TEXT,
                                transition: 'all 0.2s ease',
                                '&.Mui-selected': {
                                    bgcolor: ICON_COLOR,
                                    color: 'white',
                                    '&:hover': { bgcolor: ICON_COLOR }
                                },
                                '&:hover': { bgcolor: CARD_BG_MEDIUM }
                            }
                        }}
                    >
                        <ToggleButton value="list">
                            <ViewListIcon fontSize="small" />
                        </ToggleButton>
                        <ToggleButton value="grid">
                            <ViewModuleIcon fontSize="small" />
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Add Button */}
                    {canCreate && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            disabled={loading || permissionsLoading}
                            component={Link}
                            href="/admin/learning-paths/new"
                            data-testid="admin-cta-add-learning-path"
                            sx={{
                                bgcolor: ICON_COLOR,
                                color: 'white',
                                fontWeight: 700,
                                textTransform: 'none',
                                borderRadius: '12px',
                                px: 3,
                                height: 44,
                                boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                                '&:hover': {
                                    bgcolor: PRIMARY_HOVER_BG,
                                    boxShadow: `0 6px 20px ${PRIMARY_SHADOW}`
                                }
                            }}
                        >
                            Add Path
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Table View */}
            {viewMode === 'list' && (
                <GlassCard
                    p={0}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                    }}
                >
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            color: TEXT_COLOR,
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                        onClick={() => handleSort('name')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Name
                                            {renderSortIcon('name')}
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            color: TEXT_COLOR,
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                        onClick={() => handleSort('code')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Code
                                            {renderSortIcon('code')}
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            color: TEXT_COLOR,
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                        onClick={() => handleSort('category')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Category
                                            {renderSortIcon('category')}
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            color: TEXT_COLOR,
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                        onClick={() => handleSort('courses')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Courses
                                            {renderSortIcon('courses')}
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            cursor: 'pointer',
                                            fontWeight: 700,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            color: TEXT_COLOR,
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                        onClick={() => handleSort('updatedAt')}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            Last Updated
                                            {renderSortIcon('updatedAt')}
                                        </Box>
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            width: 80,
                                            bgcolor: CARD_BG_OPAQUE,
                                            backdropFilter: 'blur(10px)',
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                    ></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: `1px solid ${DIVIDER}`, bgcolor: CARD_BG_OPAQUE, backdropFilter: 'blur(10px)' }}>
                                            <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                                            <Typography variant="body2" sx={{ mt: 2, color: MUTED_TEXT }}>Loading paths...</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : learningPaths.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center" sx={{ py: 8, borderBottom: `1px solid ${DIVIDER}`, bgcolor: CARD_BG_OPAQUE, backdropFilter: 'blur(10px)' }}>
                                            <Typography sx={{ color: MUTED_TEXT }}>
                                                No learning paths found
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    learningPaths.map((path) => (
                                        <TableRow
                                            key={path.id}
                                            hover
                                            sx={{
                                                transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: CARD_BG_LIGHT },
                                                borderBottom: `1px solid ${DIVIDER}`
                                            }}
                                        >
                                            <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: `1px solid ${DIVIDER}` }}>
                                                {path.name}
                                            </TableCell>
                                            <TableCell sx={{ color: MUTED_TEXT, borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Chip
                                                    label={path.code}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: CARD_BG_LIGHT,
                                                        color: MUTED_TEXT,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        border: `1px solid ${DIVIDER}`
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: MUTED_TEXT, borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Chip
                                                    label={path.category || 'General'}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: 'hsl(var(--primary) / 0.1)',
                                                        color: ICON_COLOR,
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        border: `1px solid ${DIVIDER}`
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {path.courseCount} Courses
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ color: MUTED_TEXT, borderBottom: `1px solid ${DIVIDER}` }}>{formatDate(path.updatedAt)}</TableCell>
                                            <TableCell align="right" sx={{ borderBottom: `1px solid ${DIVIDER}` }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                                    <Tooltip title="Enroll to learning path">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEnroll(path)}
                                                            sx={{ color: ICON_COLOR, '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' } }}
                                                        >
                                                            <PersonAddIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuOpen(e, path)}
                                                        sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'hsl(var(--card) / 0.8)' } }}
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GlassCard>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
                <Grid container spacing={3}>
                    {loading ? (
                        Array.from(new Array(6)).map((_, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                                <GlassCard sx={{ height: 240, display: 'flex', flexDirection: 'column', gap: 2, p: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                        <Box sx={{ width: 24, height: 24, borderRadius: 1, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                    </Box>
                                    <Box sx={{ width: '80%', height: 24, borderRadius: 1, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                    <Box sx={{ width: '40%', height: 16, borderRadius: 1, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                    <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between' }}>
                                        <Box sx={{ width: '30%', height: 16, borderRadius: 1, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                        <Box sx={{ width: '20%', height: 16, borderRadius: 1, bgcolor: 'hsl(var(--card) / 0.5)', animation: 'pulse 2s infinite' }} />
                                    </Box>
                                </GlassCard>
                            </Grid>
                        ))
                    ) : learningPaths.length === 0 ? (
                        <Grid size={{ xs: 12 }}>
                            <GlassCard sx={{ textAlign: 'center', py: 12 }}>
                                <FolderIcon sx={{ fontSize: 48, color: MUTED_TEXT, mb: 2, opacity: 0.5 }} />
                                <Typography variant="h6" sx={{ color: TEXT_COLOR, mb: 1 }}>No learning paths found</Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT }}>Try adjusting your search or filters</Typography>
                            </GlassCard>
                        </Grid>
                    ) : (
                        learningPaths.map((path) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={path.id}>
                                <GlassCard
                                    sx={{
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: CARD_BG_LIGHT,
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        border: `1px solid ${DIVIDER}`,
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: `0 12px 24px -8px ${SHADOW_COLOR}`,
                                            borderColor: 'hsl(var(--primary) / 0.3)',
                                            '& .path-actions': { opacity: 1 }
                                        }
                                    }}
                                >
                                    <Box sx={{ p: 3, flexGrow: 1 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                                            <Box
                                                sx={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 2,
                                                    bgcolor: 'hsl(var(--primary) / 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: ICON_COLOR,
                                                    border: `1px solid ${DIVIDER}`
                                                }}
                                            >
                                                <FolderIcon />
                                            </Box>
                                            <Box className="path-actions" sx={{ opacity: 0.6, transition: 'opacity 0.2s ease', display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Enroll to learning path">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEnroll(path)}
                                                        sx={{ color: ICON_COLOR, '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' } }}
                                                    >
                                                        <PersonAddIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, path)}
                                                    sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'hsl(var(--card) / 0.8)' } }}
                                                >
                                                    <MoreVertIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>

                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: TEXT_COLOR, lineHeight: 1.3 }}>
                                            {path.name}
                                        </Typography>

                                        <Typography variant="body2" sx={{ color: MUTED_TEXT, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1, fontWeight: 500 }}>
                                            <LibraryBooksIcon sx={{ fontSize: 16, color: ICON_COLOR }} />
                                            {path.courseCount} Courses
                                        </Typography>

                                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={path.category || 'General'}
                                                size="small"
                                                sx={{
                                                    bgcolor: 'hsl(var(--card) / 0.5)',
                                                    color: MUTED_TEXT,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    border: `1px solid ${DIVIDER}`,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}
                                            />
                                            <Chip
                                                label={path.status}
                                                size="small"
                                                sx={{
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                    bgcolor: path.status === 'published' ? 'rgba(76, 175, 80, 0.1)' : 'hsl(var(--muted) / 0.1)',
                                                    color: path.status === 'published' ? '#4caf50' : MUTED_TEXT,
                                                    border: `1px solid ${path.status === 'published' ? 'rgba(76, 175, 80, 0.2)' : DIVIDER}`
                                                }}
                                            />
                                        </Box>
                                    </Box>

                                    <Box sx={{ p: 2, px: 3, borderTop: `1px solid ${DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'hsl(var(--card) / 0.2)' }}>
                                        <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                            Updated {formatDate(path.updatedAt)}
                                        </Typography>
                                        <Button
                                            size="small"
                                            component={Link}
                                            href={`/admin/learning-paths/${path.id}/edit`}
                                            sx={{
                                                color: ICON_COLOR,
                                                fontWeight: 700,
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.1)' }
                                            }}
                                        >
                                            View Details
                                        </Button>
                                    </Box>
                                </GlassCard>
                            </Grid>
                        ))
                    )}
                </Grid>
            )}

            {/* Actions Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(10px)',
                            border: `1px solid ${DIVIDER}`,
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
                <MenuItem onClick={handleEdit}>Edit</MenuItem>
                <MenuItem onClick={handleManage}>Manage</MenuItem>
                {canDelete && (
                    <MenuItem onClick={handleDelete} sx={{ color: 'error.main !important' }}>Delete</MenuItem>
                )}
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="delete-dialog-title"
                PaperProps={{
                    sx: {
                        ...glassStyle,
                        ...(mode === 'liquid-glass' ? {
                            borderRadius: '24px',
                        } : {
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: '24px',
                            boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle id="delete-dialog-title" sx={{ color: TEXT_COLOR, fontWeight: 700 }}>
                    Delete Learning Path?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: MUTED_TEXT }}>
                        Are you sure you want to delete "{selectedPath?.name}"? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={cancelDelete} disabled={deleting} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        color="error"
                        variant="contained"
                        disabled={deleting}
                        sx={{
                            borderRadius: '12px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: 'error.main',
                            '&:hover': { bgcolor: 'error.dark' }
                        }}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <EnrollmentDialog
                open={enrollDialogOpen}
                onClose={() => setEnrollDialogOpen(false)}
                pathId={enrollPathId || ''}
            />
        </Box>
    );
}
