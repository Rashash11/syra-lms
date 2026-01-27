'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@shared/ui/AppLink';
import {
    Box,
    Typography,
    Button,
    TextField,
    InputAdornment,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Snackbar,
    Alert,
    CircularProgress,
    Grid,
} from '@mui/material';
import { GlassCard } from '@shared/ui/components/GlassCard';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import { apiFetch } from '@shared/http/apiFetch';
import { useThemeMode } from '@shared/theme/ThemeContext';

interface Branch {
    id: string;
    name: string;
    slug: string;
    title?: string | null;
    isActive?: boolean;
    tenant?: { name: string; domain: string | null };
    defaultUserType?: { id: string; name: string } | null;
    defaultGroup?: { id: string; name: string } | null;
}

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const PRIMARY_FOREGROUND = 'hsl(var(--primary-foreground))';
const PRIMARY_HOVER_BG = 'hsl(var(--primary) / 0.9)';
const PRIMARY_COLOR_015 = 'hsl(var(--primary) / 0.15)';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
const SUCCESS_COLOR_015 = 'hsl(var(--success) / 0.15)';
const SUCCESS_COLOR_03 = 'hsl(var(--success) / 0.3)';
const INFO_COLOR_MAIN = 'hsl(var(--info))';
const INFO_COLOR_015 = 'hsl(var(--info) / 0.15)';
const WARNING_COLOR_MAIN = 'hsl(var(--warning))';
const WARNING_COLOR_015 = 'hsl(var(--warning) / 0.15)';
const BORDER_COLOR_02 = 'rgba(141, 166, 166, 0.2)';
const TABLE_ROW_HOVER_BG = 'rgba(141, 166, 166, 0.05)';
const DESTRUCTIVE_COLOR_MAIN = 'hsl(var(--destructive))';
const DESTRUCTIVE_COLOR_01 = 'hsl(var(--destructive) / 0.1)';

export default function BranchesPage() {
    const router = useRouter();
    const { mode } = useThemeMode();
    const [searchQuery, setSearchQuery] = useState('');

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [branches, setBranches] = useState<Branch[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });

    const loadBranches = useCallback(async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            qs.set('page', '1');
            qs.set('limit', '50');
            if (searchQuery.trim()) qs.set('search', searchQuery.trim());
            const res = await apiFetch<{ data: Branch[]; pagination?: { total?: number } }>(`/api/branches?${qs.toString()}`, { credentials: 'include' });
            setBranches(res.data || []);
            setTotal(res.pagination?.total ?? (res.data || []).length);
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to load branches', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        void loadBranches();
    }, [loadBranches]);

    const stats = useMemo(() => {
        const active = branches.filter(b => b.isActive).length;
        const branded = branches.filter(b => Boolean(b.title)).length;
        return [
            { label: 'Total Branches', value: total || branches.length, icon: <AccountTreeIcon />, color: 'primary' },
            { label: 'Active', value: active, icon: <PeopleIcon />, color: 'success' },
            { label: 'Branded', value: branded, icon: <SettingsIcon />, color: 'warning' },
            { label: 'Loaded', value: branches.length, icon: <SchoolIcon />, color: 'info' },
        ];
    }, [branches, total]);

    const deleteBranch = async (branch: Branch) => {
        try {
            await apiFetch(`/api/branches/${branch.id}`, { method: 'DELETE', credentials: 'include' });
            setBranches(prev => prev.filter(b => b.id !== branch.id));
            setSnackbar({ open: true, message: 'Branch deleted', severity: 'success' });
        } catch (e) {
            setSnackbar({ open: true, message: e instanceof Error ? e.message : 'Failed to delete branch', severity: 'error' });
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1.5, color: TEXT_COLOR, letterSpacing: '-0.02em' }}>
                    <AccountTreeIcon fontSize="large" sx={{ color: ICON_COLOR }} />
                    Branches
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    component={Link}
                    href="/admin/branches/create"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: ICON_COLOR,
                        color: PRIMARY_FOREGROUND,
                        borderRadius: '12px',
                        px: 3,
                        height: 44,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                            bgcolor: PRIMARY_HOVER_BG,
                            transform: 'translateY(-2px)'
                        },
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                        } : {
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                        })
                    }}
                >
                    Create Branch
                </Button>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {stats.map((stat, i) => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                        <GlassCard sx={{
                            height: '100%',
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                                borderRadius: '24px',
                            } : {
                                border: `1px solid ${DIVIDER}`,
                            })
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: 2,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : `hsl(var(--${stat.color === 'primary' ? 'primary' : stat.color === 'success' ? 'success' : stat.color === 'info' ? 'info' : 'warning'}) / 0.15)`,
                                    color: stat.color === 'primary' ? ICON_COLOR : stat.color === 'success' ? SUCCESS_COLOR_MAIN : stat.color === 'info' ? INFO_COLOR_MAIN : WARNING_COLOR_MAIN,
                                    display: 'flex'
                                }}>
                                    {stat.icon}
                                </Box>
                                <Box>
                                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                                        {stat.label}
                                    </Typography>
                                    <Typography variant="h5" sx={{ color: TEXT_COLOR, fontWeight: 800 }}>
                                        {stat.value}
                                    </Typography>
                                </Box>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <GlassCard p={0} sx={{
                ...(mode === 'liquid-glass' ? {
                    ...glassStyle,
                    borderRadius: '24px',
                } : {
                    border: `1px solid ${DIVIDER}`,
                }),
                overflow: 'hidden'
            }}>
                <Box sx={{
                    p: 2.5,
                    borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}`,
                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.02)' : TABLE_ROW_HOVER_BG
                }}>
                    <TextField
                        placeholder="Search branches..."
                        size="small"
                        fullWidth
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: MUTED_TEXT }} />
                                </InputAdornment>
                            ),
                            sx: {
                                borderRadius: '10px',
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                                color: TEXT_COLOR,
                                transition: 'all 0.2s ease',
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : BORDER_COLOR_02,
                                    border: mode === 'liquid-glass' ? 'none' : undefined
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ICON_COLOR },
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& fieldset': { border: 'none' }
                                } : {})
                            }
                        }}
                        sx={{ maxWidth: 400 }}
                    />
                </Box>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : TABLE_ROW_HOVER_BG,
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& .MuiTableCell-root': {
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                                    }
                                } : {})
                            }}>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 700, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}`, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Branch</TableCell>
                                <TableCell sx={{ color: MUTED_TEXT, fontWeight: 700, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}`, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Tenant / Domain</TableCell>
                                <TableCell align="center" sx={{ color: MUTED_TEXT, fontWeight: 700, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}`, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Status</TableCell>
                                <TableCell align="right" sx={{ color: MUTED_TEXT, fontWeight: 700, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}`, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                        <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                                    </TableCell>
                                </TableRow>
                            ) : branches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 8, color: MUTED_TEXT, borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                        No branches found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                branches.map((b) => (
                                    <TableRow
                                        key={b.id}
                                        hover
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.08) !important' : TABLE_ROW_HOVER_BG,
                                                transform: mode === 'liquid-glass' ? 'scale(1.001)' : 'none'
                                            }
                                        }}
                                    >
                                        <TableCell sx={{ borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                            <Typography variant="body2" fontWeight={700} sx={{ color: TEXT_COLOR }}>{b.name}</Typography>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>{b.slug}</Typography>
                                        </TableCell>
                                        <TableCell sx={{ borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                            <Typography variant="body2" sx={{ color: TEXT_COLOR, fontWeight: 500 }}>{b.tenant?.name || 'Main'}</Typography>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>{b.tenant?.domain || 'system'}</Typography>
                                        </TableCell>
                                        <TableCell align="center" sx={{ borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                            <Chip
                                                label={b.isActive ? 'Active' : 'Inactive'}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem',
                                                    textTransform: 'uppercase',
                                                    borderRadius: '6px',
                                                    color: b.isActive ? SUCCESS_COLOR_MAIN : MUTED_TEXT,
                                                    borderColor: b.isActive ? SUCCESS_COLOR_03 : BORDER_COLOR_02,
                                                    bgcolor: b.isActive ? (mode === 'liquid-glass' ? 'rgba(0, 255, 0, 0.1)' : SUCCESS_COLOR_015) : 'transparent'
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell align="right" sx={{ borderBottom: `1px solid ${mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : DIVIDER}` }}>
                                            <IconButton
                                                size="small"
                                                component={Link}
                                                href={`/admin/branches/${b.id}/edit`}
                                                sx={{
                                                    color: MUTED_TEXT,
                                                    '&:hover': {
                                                        color: ICON_COLOR,
                                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                                                    }
                                                }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => deleteBranch(b)}
                                                sx={{
                                                    color: MUTED_TEXT,
                                                    '&:hover': {
                                                        color: DESTRUCTIVE_COLOR_MAIN,
                                                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 0, 0, 0.1)' : DESTRUCTIVE_COLOR_01
                                                    }
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        borderRadius: '12px',
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            backgroundColor: snackbar.severity === 'success' ? 'rgba(46, 125, 50, 0.2)' : 'rgba(211, 47, 47, 0.2)',
                            color: TEXT_COLOR,
                            '& .MuiAlert-icon': {
                                color: snackbar.severity === 'success' ? SUCCESS_COLOR_MAIN : DESTRUCTIVE_COLOR_MAIN
                            }
                        } : {})
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
