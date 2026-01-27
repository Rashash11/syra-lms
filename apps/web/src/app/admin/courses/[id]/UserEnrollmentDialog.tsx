import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, InputAdornment, List, ListItem, ListItemButton,
    ListItemText, ListItemAvatar, Avatar, Checkbox,
    Typography, Box, CircularProgress, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { apiFetch } from '@shared/http/apiFetch';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const BG_COLOR = 'hsl(var(--card))';

interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    roles: string[];
}

interface UserEnrollmentDialogProps {
    open: boolean;
    onClose: () => void;
    onEnroll: (userIds: string[]) => Promise<void>;
    enrolledUserIds: string[];
}

export default function UserEnrollmentDialog({
    open,
    onClose,
    onEnroll,
    enrolledUserIds
}: UserEnrollmentDialogProps) {
    const { mode } = useThemeMode();
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            fetchUsers();
            setSelected([]);
            setSearch('');
        }
    }, [open]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            // Fetch all users - in a real app might want pagination handled here or search query passed to API
            const data = await apiFetch<any>('/api/users?limit=100');
            setUsers(data.data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (userId: string) => {
        const currentIndex = selected.indexOf(userId);
        const newChecked = [...selected];

        if (currentIndex === -1) {
            newChecked.push(userId);
        } else {
            newChecked.splice(currentIndex, 1);
        }

        setSelected(newChecked);
    };

    const handleSubmit = async () => {
        if (selected.length === 0) return;

        setSubmitting(true);
        try {
            await onEnroll(selected);
            onClose();
        } catch (error) {
            console.error('Error enrolling users:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Filter users based on search and exclude already enrolled
    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        const searchLower = search.toLowerCase();

        const matchesSearch = fullName.includes(searchLower) || email.includes(searchLower);
        const isNotEnrolled = !enrolledUserIds.includes(user.id);

        return matchesSearch && isNotEnrolled;
    });

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{
                sx: {
                    ...(mode === 'liquid-glass' ? {
                        ...glassStyle,
                        borderRadius: '24px',
                    } : {
                        bgcolor: 'hsl(var(--card) / 0.8)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                        boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)',
                    }),
                    backgroundImage: 'none'
                }
            }}
        >
            <DialogTitle sx={{ fontWeight: 800, color: TEXT_COLOR, px: 3, pt: 3 }}>
                Enroll Users
            </DialogTitle>
            <DialogContent sx={{ px: 3, py: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search users..."
                        size="small"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ 
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : 'hsl(var(--card) / 0.2)',
                                border: mode === 'liquid-glass' ? 'none' : `1px solid ${DIVIDER}`,
                                transition: 'all 0.2s ease',
                                '&:hover': { bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--card) / 0.3)' },
                                '&.Mui-focused': { 
                                    borderColor: ICON_COLOR,
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'hsl(var(--card) / 0.4)'
                                },
                                ...(mode === 'liquid-glass' ? {
                                    ...glassStyle,
                                    '& fieldset': { border: 'none' }
                                } : {}),
                                '& fieldset': mode === 'liquid-glass' ? { border: 'none' } : {}
                            }
                        }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: MUTED_TEXT }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
                        <CircularProgress size={32} sx={{ color: ICON_COLOR }} />
                    </Box>
                ) : (
                    <List sx={{ maxHeight: 400, overflow: 'auto', pr: 1 }}>
                        {filteredUsers.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <Typography sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                                    No eligible users found
                                </Typography>
                            </Box>
                        ) : (
                            filteredUsers.map((user) => {
                                const labelId = `checkbox-list-label-${user.id}`;
                                const isSelected = selected.indexOf(user.id) !== -1;
                                return (
                                    <ListItem
                                        key={user.id}
                                        disablePadding
                                        sx={{ 
                                            mb: 1, 
                                            borderRadius: '12px',
                                            transition: 'all 0.2s ease',
                                            bgcolor: isSelected ? (mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.1)' : 'hsl(var(--primary) / 0.05)') : 'transparent',
                                            '&:hover': { 
                                                bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.15)' : 'hsl(var(--card) / 0.4)',
                                                transform: 'translateY(-2px)'
                                            },
                                            ...(mode === 'liquid-glass' && isSelected ? {
                                                ...glassStyle,
                                                border: `1px solid ${ICON_COLOR}`,
                                            } : mode === 'liquid-glass' ? {
                                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                            } : {})
                                        }}
                                    >
                                        <ListItemButton onClick={() => handleToggle(user.id)} sx={{ borderRadius: '12px' }}>
                                            <ListItemAvatar>
                                                <Avatar 
                                                    src={user.avatar || undefined}
                                                    sx={{ 
                                                        bgcolor: 'hsl(var(--primary) / 0.1)',
                                                        color: ICON_COLOR,
                                                        fontWeight: 700
                                                    }}
                                                >
                                                    {user.firstName[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                id={labelId}
                                                primary={`${user.firstName} ${user.lastName}`}
                                                primaryTypographyProps={{ fontWeight: 700, color: TEXT_COLOR }}
                                                secondary={user.email}
                                                secondaryTypographyProps={{ color: MUTED_TEXT }}
                                            />
                                            <Checkbox
                                                edge="end"
                                                checked={isSelected}
                                                sx={{ color: DIVIDER, '&.Mui-checked': { color: ICON_COLOR } }}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                );
                            })
                        )}
                    </List>
                )}
            </DialogContent>
            <DialogActions sx={{ 
                p: 3, 
                borderTop: mode === 'liquid-glass' ? 'none' : `1px solid ${DIVIDER}`,
                ...(mode === 'liquid-glass' ? {
                    bgcolor: 'rgba(255, 255, 255, 0.03)',
                    borderBottomLeftRadius: '24px',
                    borderBottomRightRadius: '24px',
                } : {})
            }}>
                <Button 
                    onClick={onClose} 
                    disabled={submitting}
                    sx={{ color: MUTED_TEXT, fontWeight: 600, textTransform: 'none' }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={selected.length === 0 || submitting}
                    sx={{
                        bgcolor: ICON_COLOR,
                        color: 'white',
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '10px',
                        px: 3,
                        boxShadow: '0 4px 14px 0 hsl(var(--primary) / 0.39)',
                        '&:hover': { 
                            bgcolor: 'hsl(var(--primary) / 0.9)',
                            boxShadow: '0 6px 20px rgba(26, 84, 85, 0.23)'
                        },
                        '&.Mui-disabled': {
                            bgcolor: 'hsl(var(--muted) / 0.2)',
                            color: MUTED_TEXT
                        },
                        ...(mode === 'liquid-glass' ? {
                            ...glassStyle,
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                        } : {})
                    }}
                >
                    {submitting ? 'Enrolling...' : `Enroll ${selected.length > 0 ? `(${selected.length})` : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
