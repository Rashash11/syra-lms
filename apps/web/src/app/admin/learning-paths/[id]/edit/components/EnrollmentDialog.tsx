'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, InputAdornment, List, ListItem, ListItemButton,
    ListItemAvatar, Avatar, ListItemText, Typography, Button, Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { apiFetch, ApiFetchError } from '@shared/http/apiFetch';
import { useToast } from '@/shared/providers/ToastProvider';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';

interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
}

interface EnrollmentDialogProps {
    open: boolean;
    onClose: () => void;
    pathId: string;
    onSuccess?: () => void;
    excludeUserIds?: string[];
}

export default function EnrollmentDialog({ open, onClose, pathId, onSuccess, excludeUserIds = [] }: EnrollmentDialogProps) {
    const { mode } = useThemeMode();

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [enrolling, setEnrolling] = useState(false);
    const [error, setError] = useState('');
    const { showToast } = useToast();

    // Fetch available users for enrollment
    const fetchAvailableUsers = useCallback(async (search: string = '') => {
        console.log('[EnrollmentDialog] fetching users', { search, excludeUserIds });
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const data = await apiFetch<any>(`/api/users?${params}`);
            console.log('[EnrollmentDialog] fetched users', data);
            const users = Array.isArray(data) ? data : (data.users || data.data || []);
            const filteredUsers = users.filter((u: any) => !excludeUserIds.includes(u.id));
            setAvailableUsers(filteredUsers.map((u: any) => ({
                id: u.id,
                name: `${u.firstName} ${u.lastName}`,
                email: u.email,
                avatar: u.avatar,
            })));
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }, [excludeUserIds]);

    useEffect(() => {
        if (open) {
            void fetchAvailableUsers(userSearchQuery);
        }
    }, [fetchAvailableUsers, open, userSearchQuery]);

    // Handle enrollment
    const handleEnrollUsers = async () => {
        if (selectedUsers.length === 0) return;

        setEnrolling(true);
        setError('');

        try {
            await apiFetch(`/api/learning-paths/${pathId}/enrollments`, {
                method: 'POST',
                body: {
                    userIds: selectedUsers,
                    role: 'LEARNER',
                },
            });
            showToast(`Successfully enrolled ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`, 'success');
            if (onSuccess) onSuccess();
            onClose();
            setSelectedUsers([]);
            setUserSearchQuery('');
        } catch (error) {
            console.error('[EnrollmentDialog] Enrollment error:', error);
            const msg = error instanceof ApiFetchError ? error.message : 'Failed to enroll users';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setEnrolling(false);
        }
    };

    const handleClose = () => {
        onClose();
        setSelectedUsers([]);
        setUserSearchQuery('');
        setError('');
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            aria-labelledby="enroll-dialog-title"
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
            <DialogTitle id="enroll-dialog-title" sx={{ color: TEXT_COLOR, fontWeight: 700 }}>Enroll Users to Learning Path</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 2, 
                            borderRadius: '12px',
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                            } : {})
                        }}
                    >
                        {error}
                    </Alert>
                )}
                <TextField
                    fullWidth
                    placeholder="Search users..."
                    size="small"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: MUTED_TEXT }} />
                            </InputAdornment>
                        ),
                    }}
                    sx={{ 
                        mb: 2, 
                        mt: 1,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: 'rgba(255, 255, 255, 0.05)',
                            '& fieldset': { borderColor: mode === 'liquid-glass' ? 'transparent' : DIVIDER },
                            '&:hover fieldset': { borderColor: mode === 'liquid-glass' ? 'transparent' : 'hsl(var(--primary))' },
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                            } : {})
                        }
                    }}
                />
                <List sx={{ maxHeight: 400, overflow: 'auto' }} data-testid="user-list">
                    {availableUsers.map((user) => (
                        <ListItem
                            key={user.id}
                            disablePadding
                            data-testid={`user-item-${user.email}`}
                        >
                            <ListItemButton
                                selected={selectedUsers.includes(user.id)}
                                onClick={() => {
                                    setSelectedUsers(prev =>
                                        prev.includes(user.id)
                                            ? prev.filter(id => id !== user.id)
                                            : [...prev, user.id]
                                    );
                                }}
                                sx={{
                                    borderRadius: '12px',
                                    mx: 1,
                                    mb: 0.5,
                                    '&.Mui-selected': {
                                        bgcolor: 'hsl(var(--primary) / 0.1)',
                                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.2)' }
                                    }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar src={user.avatar} sx={{ bgcolor: 'hsl(var(--primary) / 0.2)', color: 'hsl(var(--primary))' }}>
                                        {user.name.charAt(0)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={<Typography sx={{ color: TEXT_COLOR, fontWeight: 600 }}>{user.name}</Typography>}
                                    secondary={<Typography variant="caption" sx={{ color: MUTED_TEXT }}>{user.email}</Typography>}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                    {availableUsers.length === 0 && (
                        <Typography variant="body2" sx={{ p: 4, textAlign: 'center', color: MUTED_TEXT }}>
                            No users found
                        </Typography>
                    )}
                </List>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 1 }}>
                <Button onClick={handleClose} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>
                    Cancel
                </Button>
                <Button
                    onClick={handleEnrollUsers}
                    variant="contained"
                    disabled={selectedUsers.length === 0 || enrolling}
                    sx={{
                        borderRadius: '12px',
                        fontWeight: 700,
                        px: 3,
                        bgcolor: 'hsl(var(--primary))',
                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.9)' }
                    }}
                >
                    {enrolling ? 'Enrolling...' : `Enroll ${selectedUsers.length} user${selectedUsers.length !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
