'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Menu, MenuItem, Skeleton, Dialog, DialogTitle,
    DialogContent, DialogActions, Select
} from '@mui/material';
import { useThemeMode } from '@shared/theme/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GroupsIcon from '@mui/icons-material/Groups';
import { apiFetch } from '@shared/http/apiFetch';

interface Group {
    id: string;
    name: string;
    description: string | null;
    price: number | null;
    _count: {
        members: number;
        courses: number;
    };
}

export default function GroupsPage() {
    const { mode } = useThemeMode();
    const [groups, setGroups] = useState<Group[]>([]);

    const TEXT_COLOR = mode === 'liquid-glass' ? '#FFFFFF' : 'text.primary';
    const SECONDARY_TEXT = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary';
    const DIVIDER = mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.12)' : 'divider';

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', description: '', price: '' });

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);

            const res = await fetch(`/api/instructor/groups?${params.toString()}`);
            const data = await res.json();
            if (data.data) {
                setGroups(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        void fetchGroups();
    }, [fetchGroups]);

    const handleAddGroup = async () => {
        try {
            const data = await apiFetch<{ success: boolean }>('/api/instructor/groups', {
                method: 'POST',
                body: newGroup,
            });
            if (data.success) {
                setOpenAddDialog(false);
                setNewGroup({ name: '', description: '', price: '' });
                fetchGroups();
            }
        } catch (error) {
            console.error('Failed to create group:', error);
        }
    };

    return (
        <Box>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={600} color={TEXT_COLOR}>
                    Groups
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenAddDialog(true)}
                    sx={{
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                        color: '#FFFFFF',
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { 
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'primary.dark' 
                        },
                        ...(mode === 'liquid-glass' ? {
                            backdropFilter: 'blur(4px)',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                        } : {})
                    }}
                >
                    Add group
                </Button>
            </Box>

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : '#6B778C', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        width: 240,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 3,
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--card) / 0.6)',
                            border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                            '& fieldset': { border: 'none' },
                            '& input': { color: TEXT_COLOR }
                        }
                    }}
                />
                <Select
                    size="small"
                    defaultValue="mass-actions"
                    endAdornment={<KeyboardArrowDownIcon sx={{ mr: 1, color: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.7)' : '#6B778C' }} />}
                    MenuProps={{
                        PaperProps: {
                            sx: {
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& .MuiMenuItem-root': { color: TEXT_COLOR },
                                    '& .MuiMenuItem-root:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' },
                                } : {})
                            }
                        }
                    }}
                    sx={{
                        minWidth: 160,
                        borderRadius: 1.5,
                        bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--card) / 0.6)',
                        color: TEXT_COLOR,
                        border: mode === 'liquid-glass' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                        '& fieldset': { border: 'none' },
                        '& .MuiSelect-select': { color: TEXT_COLOR }
                    }}
                >
                    <MenuItem value="mass-actions">Mass actions</MenuItem>
                    <MenuItem value="delete">Delete selected</MenuItem>
                    <MenuItem value="export">Export selected</MenuItem>
                </Select>
            </Box>

            {/* Table */}
            {loading ? (
                <Box>
                    {[1, 2, 3].map(i => (
                        <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1, borderRadius: 1, opacity: mode === 'liquid-glass' ? 0.3 : 1 }} />
                    ))}
                </Box>
            ) : groups.length > 0 ? (
                <TableContainer 
                    component={Paper} 
                    sx={{ 
                        boxShadow: 'none', 
                        borderRadius: 2,
                        ...(mode === 'liquid-glass' ? glassStyle : {
                            border: '1px solid',
                            borderColor: 'divider'
                        })
                    }}
                >
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.6)' }}>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR, py: 2, borderBottom: `1px solid ${DIVIDER}` }}>Group</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Description</TableCell>
                                <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR, textAlign: 'right', borderBottom: `1px solid ${DIVIDER}` }}>Price</TableCell>
                                <TableCell sx={{ width: 50, borderBottom: `1px solid ${DIVIDER}` }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {groups.map((group, index) => (
                                <TableRow
                                    key={group.id}
                                    sx={{
                                        bgcolor: index % 2 === 1 
                                            ? (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.02)' : 'hsl(var(--card) / 0.6)')
                                            : 'transparent',
                                        '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.6)' },
                                        '& .MuiTableCell-root': { borderBottom: `1px solid ${DIVIDER}` }
                                    }}
                                >
                                    <TableCell sx={{ color: TEXT_COLOR, fontWeight: 500 }}>
                                        {group.name}
                                    </TableCell>
                                    <TableCell sx={{ color: SECONDARY_TEXT }}>
                                        {group.description || '-'}
                                    </TableCell>
                                    <TableCell sx={{ color: TEXT_COLOR, textAlign: 'right' }}>
                                        {group.price ? `$${group.price}` : '-'}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton size="small" sx={{ color: TEXT_COLOR }}>
                                            <MoreHorizIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <GroupsIcon sx={{ fontSize: 64, color: DIVIDER, mb: 2 }} />
                    <Typography variant="h6" color={TEXT_COLOR} gutterBottom>
                        No groups found
                    </Typography>
                    <Typography variant="body2" color={SECONDARY_TEXT}>
                        Create your first group to get started
                    </Typography>
                </Box>
            )}

            {/* Add Group Dialog */}
            <Dialog 
                open={openAddDialog} 
                onClose={() => setOpenAddDialog(false)} 
                maxWidth="sm" 
                fullWidth
                PaperProps={{
                    sx: {
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            borderRadius: '24px',
                            '& .MuiDialogTitle-root': { color: TEXT_COLOR },
                            '& .MuiDialogContent-root': { color: TEXT_COLOR },
                            '& .MuiDialogActions-root': { borderTop: `1px solid ${DIVIDER}` },
                        } : {})
                    }
                }}
            >
                <DialogTitle>Add Group</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                        <TextField
                            label="Group Name"
                            fullWidth
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            sx={{
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: DIVIDER },
                                    '&:hover fieldset': { borderColor: SECONDARY_TEXT },
                                }
                            }}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            value={newGroup.description}
                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                            sx={{
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: DIVIDER },
                                    '&:hover fieldset': { borderColor: SECONDARY_TEXT },
                                }
                            }}
                        />
                        <TextField
                            label="Price"
                            fullWidth
                            type="number"
                            value={newGroup.price}
                            onChange={(e) => setNewGroup({ ...newGroup, price: e.target.value })}
                            sx={{
                                '& .MuiInputLabel-root': { color: SECONDARY_TEXT },
                                '& .MuiOutlinedInput-root': {
                                    color: TEXT_COLOR,
                                    '& fieldset': { borderColor: DIVIDER },
                                    '&:hover fieldset': { borderColor: SECONDARY_TEXT },
                                }
                            }}
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button 
                        onClick={() => setOpenAddDialog(false)}
                        sx={{ color: TEXT_COLOR }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleAddGroup}
                        disabled={!newGroup.name}
                        sx={{
                            bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.2)' : 'primary.main',
                            color: '#FFFFFF',
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { 
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'primary.dark' 
                            },
                            '&.Mui-disabled': {
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'action.disabledBackground',
                                color: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.3)' : 'action.disabled'
                            }
                        }}
                    >
                        Add Group
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
