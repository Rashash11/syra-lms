'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, InputAdornment, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, IconButton, Menu, MenuItem,
    Chip, CircularProgress, Card, CardContent, Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import GroupIcon from '@mui/icons-material/Group';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import Link from '@shared/ui/AppLink';

interface Group {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    createdAt: string;
    _count?: { members: number };
}

export default function SuperInstructorGroupsPage() {
    const { mode } = useThemeMode();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/groups');
            if (res.ok) {
                const data = await res.json();
                setGroups(Array.isArray(data) ? data : (data.data || []));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = groups.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(search.toLowerCase()))
    );

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
                        <GroupIcon sx={{ fontSize: 32 }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 800, color: 'hsl(var(--foreground))', letterSpacing: '-0.02em' }}>Groups</Typography>
                        <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>Manage learner cohorts and organizations</Typography>
                    </Box>
                </Box>
                <Button
                    component={Link}
                    href="/super-instructor/groups/new"
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
                    Add Group
                </Button>
            </Box>

            <Box className="glass-card" sx={{ p: 2, mb: 3, display: 'flex', gap: 2 }}>
                <TextField
                    placeholder="Search groups by name or description..."
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

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                </Box>
            ) : filtered.length === 0 ? (
                <Box className="glass-card" sx={{ p: 8, textAlign: 'center', borderRadius: 4 }}>
                    <GroupIcon sx={{ fontSize: 48, color: 'hsl(var(--muted-foreground))', opacity: 0.5, mb: 2 }} />
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 500 }}>No groups found</Typography>
                </Box>
            ) : (
                <TableContainer className="glass-card" sx={{ borderRadius: 4, overflow: 'hidden' }}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.paper' }}>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Group</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price</TableCell>
                                <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Members</TableCell>
                                <TableCell align="right" sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((group) => (
                                <TableRow key={group.id} sx={{ '&:hover': { bgcolor: 'hsl(var(--primary) / 0.03)' } }}>
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>
                                            {group.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 13, fontWeight: 500 }}>{group.description || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={group.price ? `$${group.price}` : 'Free'}
                                            size="small"
                                            sx={{
                                                bgcolor: 'hsl(var(--card) / 0.6)',
                                                color: 'hsl(var(--foreground))',
                                                fontWeight: 600,
                                                fontSize: 11,
                                                borderRadius: 1.5,
                                                border: '1px solid hsl(var(--border) / 0.15)'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 600 }}>{group._count?.members || 0}</TableCell>
                                    <TableCell align="right">
                                        <IconButton onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedGroup(group); }} sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--primary))' } }}>
                                            <MoreVertIcon sx={{ fontSize: 20 }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
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
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}>Edit Group</MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 500 }}>View Members</MenuItem>
                <MenuItem onClick={() => setAnchorEl(null)} sx={{ fontSize: 13, py: 1, px: 2, fontWeight: 600, color: 'hsl(var(--destructive))' }}>Delete</MenuItem>
            </Menu>
        </Box>
    );
}
