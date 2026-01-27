'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box, Typography, Button, TextField, InputAdornment,
    IconButton, Menu, MenuItem, Checkbox,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Chip, ButtonGroup, Skeleton, Tooltip, Snackbar, Alert,
    CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import GridViewIcon from '@mui/icons-material/GridView';
import ListIcon from '@mui/icons-material/List';

interface LearningPath {
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    status: string;
    category: string | null;
    courseCount: number;
    updatedAt: string;
}

export default function LearningPathsPage() {
    const router = useRouter();
    const [paths, setPaths] = useState<LearningPath[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [sortConfig, setSortConfig] = useState<{ key: keyof LearningPath, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuPath, setMenuPath] = useState<LearningPath | null>(null);

    // Snackbar
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    const fetchPaths = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ search });
            const res = await fetch(`/api/instructor/learning-paths?${params}`);
            const data = await res.json();
            setPaths(data.data || []);
        } catch (error) {
            console.error('Error fetching learning paths:', error);
            setSnackbar({ open: true, message: 'Failed to fetch learning paths', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchPaths();
    }, [fetchPaths]);

    const handleSort = (key: keyof LearningPath) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedPaths = [...paths].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === null || valB === null) return 0;
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const formatLastUpdated = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    return (
        <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700} color="text.primary">Learning paths</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
                        <Button
                            onClick={() => setViewMode('list')}
                            sx={{ color: viewMode === 'list' ? 'text.primary' : 'text.secondary', borderColor: 'divider', bgcolor: viewMode === 'list' ? 'hsl(var(--card) / 0.6)' : 'transparent' }}
                        >
                            <ListIcon fontSize="small" />
                        </Button>
                        <Button
                            onClick={() => setViewMode('grid')}
                            sx={{ color: viewMode === 'grid' ? 'text.primary' : 'text.secondary', borderColor: 'divider', bgcolor: viewMode === 'grid' ? 'hsl(var(--card) / 0.6)' : 'transparent' }}
                        >
                            <GridViewIcon fontSize="small" />
                        </Button>
                    </ButtonGroup>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/instructor/learning-paths/new')}
                        sx={{
                            bgcolor: 'primary.main',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                            '&:hover': { bgcolor: 'primary.dark' }
                        }}
                    >
                        Add learning path
                    </Button>
                </Box>
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        width: 250,
                        '& .MuiOutlinedInput-root': {
                            bgcolor: 'hsl(var(--card) / 0.6)',
                            border: 'none',
                            borderRadius: 1,
                            '& fieldset': { border: 'none' }
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: '#6B778C', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                />
                <IconButton sx={{ color: 'text.secondary' }}>
                    <FilterListIcon />
                </IconButton>
            </Box>

            {/* Table */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid hsl(var(--border))', borderRadius: 2 }}>
                <Table>
                    <TableHead sx={{ bgcolor: 'hsl(var(--card) / 0.6)' }}>
                        <TableRow>
                            <TableCell
                                sx={{ fontWeight: 700, color: 'text.primary', cursor: 'pointer', borderBottom: '1px solid hsl(var(--border))', pl: 3 }}
                                onClick={() => handleSort('name')}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    Name
                                    {sortConfig.key === 'name' && (
                                        sortConfig.direction === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid hsl(var(--border))' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid hsl(var(--border))' }}>Category</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid hsl(var(--border))' }}>Number of courses</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.primary', borderBottom: '1px solid hsl(var(--border))' }}>Last updated on</TableCell>
                            <TableCell align="right" sx={{ borderBottom: '1px solid hsl(var(--border))', pr: 3 }} />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <TableRow key={i}>
                                    <TableCell sx={{ pl: 3 }}><Skeleton variant="text" width={150} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={50} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={40} /></TableCell>
                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}><Skeleton variant="circular" width={24} height={24} /></TableCell>
                                </TableRow>
                            ))
                        ) : sortedPaths.length > 0 ? (
                            sortedPaths.map((path, index) => (
                                <TableRow
                                    key={path.id}
                                    hover
                                    sx={{
                                        '&:nth-of-type(even)': { bgcolor: 'hsl(var(--card) / 0.6)' },
                                        '&:hover': { bgcolor: 'hsl(var(--card) / 0.6) !important' }
                                    }}
                                >
                                    <TableCell sx={{ pl: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="body2" fontWeight={600} color="primary.main" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                                                {path.name}
                                            </Typography>
                                            {(path.status === 'inactive' || path.status === 'DRAFT') && (
                                                <Chip
                                                    label="Inactive"
                                                    size="small"
                                                    sx={{
                                                        height: 20,
                                                        fontSize: 10,
                                                        fontWeight: 700,
                                                        bgcolor: 'hsl(var(--card) / 0.6)',
                                                        color: 'text.primary',
                                                        borderRadius: 1
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{path.code || '-'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{path.category || '-'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{path.courseCount || '-'}</TableCell>
                                    <TableCell sx={{ color: 'text.secondary', fontSize: 13 }}>{formatLastUpdated(path.updatedAt)}</TableCell>
                                    <TableCell align="right" sx={{ pr: 3 }}>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setAnchorEl(e.currentTarget);
                                                setMenuPath(path);
                                            }}
                                        >
                                            <MoreHorizIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} sx={{ py: 6, textAlign: 'center' }}>
                                    <Typography color="text.secondary">No learning paths found matching your criteria.</Typography>
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
                PaperProps={{ sx: { minWidth: 150, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } }}
            >
                <MenuItem onClick={() => {
                    if (menuPath) router.push(`/instructor/learning-paths/${menuPath.id}/edit`);
                    setAnchorEl(null);
                }}>
                    <EditIcon sx={{ mr: 1, fontSize: 18, color: '#6B778C' }} /> Edit
                </MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
                    <DeleteIcon sx={{ mr: 1, fontSize: 18 }} /> Delete
                </MenuItem>
            </Menu>

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
