'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment, Card, CardContent,
    Chip, Paper, IconButton, CircularProgress, Alert, Menu, MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { GlassCard } from '@shared/ui/components/GlassCard';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';
import Link from '@shared/ui/AppLink';
import { apiFetch } from '@shared/http/apiFetch';
import GroupsEmptyState from '@modules/tenants/ui/GroupsEmptyState';
import { useThemeMode } from '@shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface Group {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    courseCount: number;
    createdAt: string;
}

export default function GroupsPage() {
    const router = useRouter();
    const { mode } = useThemeMode();
    const [searchQuery, setSearchQuery] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [stats, setStats] = useState({
        totalGroups: 0,
        totalMembers: 0,
        totalCourses: 0,
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, group: Group) => {
        setAnchorEl(event.currentTarget);
        setSelectedGroup(group);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedGroup(null);
    };

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const data = await apiFetch<any>('/api/groups');
            setGroups(data.data || []);

            // Calculate stats
            const totalMembers = data.data.reduce((sum: number, g: Group) => sum + g.memberCount, 0);
            const totalCourses = data.data.reduce((sum: number, g: Group) => sum + g.courseCount, 0);
            setStats({
                totalGroups: data.data.length,
                totalMembers,
                totalCourses,
            });
        } catch (err: any) {
            console.error('Group fetch error:', err);
            setError(`Failed to fetch groups: ${err.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    const filteredGroups = groups.filter(group =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    return (
        <Box sx={{ p: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, letterSpacing: '-0.02em' }}>Groups</Typography>
                <Button
                    data-testid="admin-cta-create-group"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/admin/groups/new')}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : ICON_COLOR,
                        color: mode === 'liquid-glass' ? '#FFFFFF' : 'hsl(var(--primary-foreground))',
                        borderRadius: '10px',
                        px: 3,
                        height: 44,
                        '&:hover': {
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'hsl(var(--primary) / 0.9)',
                        },
                        ...(mode === 'liquid-glass' ? {
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 4px 14px 0 rgba(0,0,0,0.1)',
                        } : {
                            boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                        })
                    }}
                >
                    Create Group
                </Button>
            </Box>

            {error && (
                <Alert
                    severity="error"
                    sx={{
                        mb: 2,
                        borderRadius: '12px',
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            bgcolor: 'rgba(255, 0, 0, 0.05)',
                            color: '#ff4444',
                            '& .MuiAlert-icon': { color: '#ff4444' }
                        } : {})
                    }}
                    onClose={() => setError('')}
                >
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                    <CircularProgress sx={{ color: ICON_COLOR }} />
                </Box>
            ) : groups.length === 0 ? (
                <GroupsEmptyState />
            ) : (
                <>
                    {/* Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <GlassCard sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    borderRadius: '24px',
                                } : {
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                })
                            }}>
                                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary) / 0.1)', color: ICON_COLOR }}>
                                    <GroupsIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_COLOR }}>{stats.totalGroups}</Typography>
                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Total Groups</Typography>
                                </Box>
                            </GlassCard>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <GlassCard sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    borderRadius: '24px',
                                } : {
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                })
                            }}>
                                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: mode === 'liquid-glass' ? 'rgba(0, 255, 0, 0.1)' : 'hsl(var(--success) / 0.1)', color: 'hsl(var(--success))' }}>
                                    <PeopleIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_COLOR }}>{stats.totalMembers}</Typography>
                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Total Members</Typography>
                                </Box>
                            </GlassCard>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <GlassCard sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2,
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    borderRadius: '24px',
                                } : {
                                    border: '1px solid rgba(141, 166, 166, 0.1)',
                                })
                            }}>
                                <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: mode === 'liquid-glass' ? 'rgba(0, 255, 255, 0.1)' : 'hsl(var(--info) / 0.1)', color: 'hsl(var(--info))' }}>
                                    <SchoolIcon />
                                </Box>
                                <Box>
                                    <Typography variant="h5" sx={{ fontWeight: 800, color: TEXT_COLOR }}>{stats.totalCourses}</Typography>
                                    <Typography variant="caption" sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Assigned Courses</Typography>
                                </Box>
                            </GlassCard>
                        </Grid>
                    </Grid>

                    {/* Search */}
                    <GlassCard sx={{
                        mb: 2,
                        p: 2,
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '16px',
                        } : {
                            border: '1px solid rgba(141, 166, 166, 0.1)',
                        })
                    }}>
                        <TextField
                            size="small"
                            placeholder="Search groups..."
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
                                        borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(141, 166, 166, 0.2)',
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
                            sx={{ width: '100%', maxWidth: 320 }}
                        />
                    </GlassCard>

                    {/* Grid */}
                    <Grid container spacing={3}>
                        {filteredGroups.map((group) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={group.id}>
                                <GlassCard
                                    interactive
                                    sx={{
                                        ...(mode === 'liquid-glass' ? {
                                            ...glassStyle,
                                            borderRadius: '24px',
                                            '&:hover': {
                                                borderColor: 'rgba(255, 255, 255, 0.6)',
                                                transform: 'translateY(-4px)',
                                                boxShadow: 'rgba(0, 0, 0, 0.35) 0px 8px 16px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                            }
                                        } : {
                                            border: '1px solid rgba(141, 166, 166, 0.1)',
                                            '&:hover': { borderColor: ICON_COLOR }
                                        })
                                    }}
                                >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 700, color: TEXT_COLOR }}>{group.name}</Typography>
                                            <Typography variant="body2" sx={{ color: MUTED_TEXT }}>
                                                {group.description || 'No description'}
                                            </Typography>
                                        </Box>
                                        <IconButton
                                            size="small"
                                            onClick={(e) => handleOpenMenu(e, group)}
                                            sx={{
                                                color: MUTED_TEXT,
                                                '&:hover': {
                                                    color: ICON_COLOR,
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                                                }
                                            }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Grid container spacing={2} sx={{ mb: 2 }}>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, display: 'block', fontWeight: 600 }}>Members</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>{group.memberCount}</Typography>
                                        </Grid>
                                        <Grid size={{ xs: 6 }}>
                                            <Typography variant="caption" sx={{ color: MUTED_TEXT, display: 'block', fontWeight: 600 }}>Courses</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 800, color: TEXT_COLOR }}>{group.courseCount}</Typography>
                                        </Grid>
                                    </Grid>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => router.push(`/admin/groups/${group.id}/users`)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(141, 166, 166, 0.2)',
                                                color: TEXT_COLOR,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: ICON_COLOR,
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(26, 84, 85, 0.05)',
                                                    transform: 'translateY(-1px)'
                                                },
                                                ...(mode === 'liquid-glass' ? {
                                                    ...glassStyle,
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                } : {})
                                            }}
                                        >
                                            Members
                                        </Button>
                                        <Button
                                            size="small"
                                            variant="outlined"
                                            fullWidth
                                            onClick={() => router.push(`/admin/groups/${group.id}/courses`)}
                                            sx={{
                                                textTransform: 'none',
                                                fontWeight: 700,
                                                borderRadius: '8px',
                                                borderColor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(141, 166, 166, 0.2)',
                                                color: TEXT_COLOR,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    borderColor: ICON_COLOR,
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(26, 84, 85, 0.05)',
                                                    transform: 'translateY(-1px)'
                                                },
                                                ...(mode === 'liquid-glass' ? {
                                                    ...glassStyle,
                                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                                } : {})
                                            }}
                                        >
                                            Courses
                                        </Button>
                                        <IconButton
                                            size="small"
                                            sx={{
                                                color: MUTED_TEXT,
                                                borderRadius: '8px',
                                                border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    color: ICON_COLOR,
                                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                                    transform: 'translateY(-1px)'
                                                },
                                                ...(mode === 'liquid-glass' ? {
                                                    ...glassStyle,
                                                } : {})
                                            }}
                                            onClick={() => router.push(`/admin/groups/${group.id}/edit`)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
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
                        <MenuItem onClick={() => { handleCloseMenu(); router.push(`/admin/groups/${selectedGroup?.id}/edit`); }}>
                            Edit Group
                        </MenuItem>
                        <MenuItem onClick={() => { handleCloseMenu(); router.push(`/admin/groups/${selectedGroup?.id}/users`); }}>
                            Manage Members
                        </MenuItem>
                        <MenuItem onClick={() => { handleCloseMenu(); router.push(`/admin/groups/${selectedGroup?.id}/courses`); }}>
                            Manage Courses
                        </MenuItem>
                        <MenuItem onClick={handleCloseMenu} sx={{ color: 'error.main' }}>
                            Delete Group
                        </MenuItem>
                    </Menu>
                </>
            )}
        </Box>
    );
}
