'use client';

import React from 'react';
import {
    Box,
    Typography,
    Select,
    MenuItem,
    IconButton,
    Button,
    FormControl,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { NotificationsSectionProps } from './types';

const NOTIFICATION_TYPES = [
    { value: 'notification', label: 'Notification' },
    { value: 'email', label: 'Email' },
];

const TIME_OPTIONS = [
    { value: 5, label: '5 minutes before' },
    { value: 10, label: '10 minutes before' },
    { value: 15, label: '15 minutes before' },
    { value: 30, label: '30 minutes before' },
    { value: 60, label: '1 hour before' },
    { value: 120, label: '2 hours before' },
    { value: 1440, label: '1 day before' },
    { value: 10080, label: '1 week before' },
];

export default function NotificationsSection({
    notifications,
    onAddNotification,
    onRemoveNotification,
    onUpdateNotification,
}: NotificationsSectionProps) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <NotificationsIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography sx={{ color: 'text.primary', fontWeight: 500 }}>
                    Notifications
                </Typography>
            </Box>

            {/* Notification Rows */}
            <Box sx={{ ml: 4, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {notifications.map((notification) => (
                    <Box
                        key={notification.id}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                            <Select
                                value={notification.type}
                                onChange={(e) =>
                                    onUpdateNotification(notification.id, { type: e.target.value as 'email' | 'notification' })
                                }
                                sx={{
                                    bgcolor: 'background.paper',
                                    '& .MuiSelect-select': { py: 0.75 }
                                }}
                            >
                                {NOTIFICATION_TYPES.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl size="small" sx={{ flex: 1 }}>
                            <Select
                                value={notification.minutesBefore}
                                onChange={(e) =>
                                    onUpdateNotification(notification.id, { minutesBefore: e.target.value as number })
                                }
                                sx={{
                                    bgcolor: 'background.paper',
                                    '& .MuiSelect-select': { py: 0.75 }
                                }}
                            >
                                {TIME_OPTIONS.map((t) => (
                                    <MenuItem key={t.value} value={t.value}>
                                        {t.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <IconButton
                            size="small"
                            onClick={() => onRemoveNotification(notification.id)}
                            sx={{ color: 'text.secondary' }}
                        >
                            <CloseIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                    </Box>
                ))}

                {/* Add Notification Button */}
                <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={onAddNotification}
                    sx={{
                        textTransform: 'none',
                        color: 'primary.main',
                        justifyContent: 'flex-start',
                        px: 0,
                        '&:hover': { bgcolor: 'transparent' }
                    }}
                >
                    Add notification
                </Button>
            </Box>
        </Box>
    );
}
