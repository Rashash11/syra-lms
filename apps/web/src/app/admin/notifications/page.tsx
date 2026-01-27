'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    TextField,
    InputAdornment,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Menu,
    MenuItem,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import NotificationDrawer from './components/NotificationDrawer';
import { useThemeMode } from '@/shared/theme/ThemeContext';
import { apiFetch } from '@/shared/http/apiFetch';
import { getCsrfToken } from '@/lib/client-csrf';
import { GlassCard } from '@/shared/ui/components/GlassCard';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const CARD_BG = 'hsl(var(--card) / 0.5)';

interface Notification {
    id: string;
    name: string;
    eventKey: string;
    isActive: boolean;
    recipientType: string;
    messageSubject: string;
    createdAt: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

export default function NotificationsPage() {
    const { mode } = useThemeMode();
    const [currentTab, setCurrentTab] = useState(0);
    
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'hsl(var(--glass-bg))',
        border: '1px solid hsl(var(--glass-border))',
        boxShadow: '0 0 20px -5px hsl(var(--glass-glow)), 0 8px 32px -8px hsl(var(--glass-shadow)), inset 0 0 0 1px hsl(var(--glass-border))',
    } : {};

    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [pendingData, setPendingData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

    const tabs = ['Overview', 'History', 'Pending', 'System notifications'];

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const tabMap = ['overview', 'history', 'pending', 'system'];
            const response = await fetch(
                `/api/admin/notifications?tab=${tabMap[currentTab]}&search=${searchQuery}`
            );
            const data = await response.json();

            if (currentTab === 0) {
                setNotifications(data.data || []);
            } else if (currentTab === 1) {
                setHistoryData(data.data || []);
            } else if (currentTab === 2) {
                setPendingData(data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [currentTab, searchQuery]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTab(newValue);
    };

    const handleAddNotification = () => {
        setEditingNotification(null);
        setDrawerOpen(true);
    };

    const handleEditNotification = (notification: Notification) => {
        setEditingNotification(notification);
        setDrawerOpen(true);
        handleMenuClose();
    };

    const handleToggleActive = async (notification: Notification) => {
        try {
            await fetch(`/api/admin/notifications/${notification.id}/toggle`, {
                method: 'PATCH',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            fetchData();
            handleMenuClose();
        } catch (error) {
            console.error('Error toggling notification:', error);
        }
    };

    const handleDuplicate = async (notification: Notification) => {
        try {
            await fetch(`/api/admin/notifications/${notification.id}/duplicate`, {
                method: 'POST',
                headers: { 'x-csrf-token': getCsrfToken() }
            });
            fetchData();
            handleMenuClose();
        } catch (error) {
            console.error('Error duplicating notification:', error);
        }
    };

    const handleDeleteClick = (notificationId: string) => {
        setNotificationToDelete(notificationId);
        setDeleteDialogOpen(true);
        handleMenuClose();
    };

    const handleDeleteConfirm = async () => {
        if (!notificationToDelete) return;

        try {
            await apiFetch(`/api/admin/notifications/${notificationToDelete}`, {
                method: 'DELETE',
            });
            fetchData();
            setDeleteDialogOpen(false);
            setNotificationToDelete(null);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>, notification: Notification) => {
        setAnchorEl(event.currentTarget);
        setSelectedNotification(notification);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedNotification(null);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
        setEditingNotification(null);
    };

    const handleDrawerSave = () => {
        setDrawerOpen(false);
        fetchData();
    };

    const formatEventLabel = (eventKey: string) => {
        return eventKey.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatRecipient = (recipientType: string) => {
        return recipientType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    return (
        <Box sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, mb: 1, letterSpacing: '-0.02em' }}>
                        Notifications
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                        Manage and track system notification templates and history
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={handleAddNotification}
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
                            bgcolor: 'hsl(var(--primary) / 0.9)',
                            boxShadow: '0 6px 20px hsl(var(--primary) / 0.23)'
                        }
                    }}
                >
                    Add notification
                </Button>
            </Box>

            {/* Tabs */}
            <Box sx={{ borderBottom: `1px solid ${DIVIDER}`, mb: 3 }}>
                <Tabs 
                    value={currentTab} 
                    onChange={handleTabChange}
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                            color: MUTED_TEXT,
                            minWidth: 100,
                            transition: 'all 0.2s ease',
                            '&.Mui-selected': {
                                color: ICON_COLOR,
                            },
                            '&:hover': {
                                color: TEXT_COLOR,
                                bgcolor: 'hsl(var(--primary) / 0.05)'
                            }
                        },
                        '& .MuiTabs-indicator': {
                            bgcolor: ICON_COLOR,
                            height: 3,
                            borderRadius: '3px 3px 0 0'
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab} />
                    ))}
                </Tabs>
            </Box>

            {/* Tab Content */}
            <TabPanel value={currentTab} index={0}>
                {/* Overview Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ 
                            width: 320,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                border: `1px solid ${DIVIDER}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: 'hsl(var(--card) / 0.3)',
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
                    <IconButton 
                        size="small"
                        sx={{ 
                            bgcolor: 'hsl(var(--card) / 0.2)', 
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: '10px',
                            p: 1,
                            color: TEXT_COLOR,
                            '&:hover': { bgcolor: 'hsl(var(--card) / 0.4)', borderColor: ICON_COLOR }
                        }}
                    >
                        <FilterListIcon fontSize="small" />
                    </IconButton>
                </Box>

                <GlassCard
                    p={0}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                    }}
                >
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Name</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Event</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Recipient</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notifications.map((notification) => (
                                    <TableRow 
                                        key={notification.id} 
                                        hover
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.05) !important' },
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                    >
                                        <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: 'none' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {notification.name}
                                                {!notification.isActive && (
                                                    <Chip 
                                                        label="Inactive" 
                                                        size="small" 
                                                        sx={{ 
                                                            height: 20, 
                                                            fontSize: '0.65rem', 
                                                            fontWeight: 700,
                                                            bgcolor: 'hsl(var(--muted) / 0.1)',
                                                            color: MUTED_TEXT,
                                                            border: `1px solid ${DIVIDER}`
                                                        }} 
                                                    />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>
                                            <Chip 
                                                label={formatEventLabel(notification.eventKey)} 
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
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{formatRecipient(notification.recipientType)}</TableCell>
                                        <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                            <IconButton 
                                                size="small" 
                                                onClick={(e) => handleMenuClick(e, notification)}
                                                sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'hsl(var(--card) / 0.8)' } }}
                                            >
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GlassCard>
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                {/* History Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ 
                            width: 320,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                border: `1px solid ${DIVIDER}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: 'hsl(var(--card) / 0.3)',
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
                </Box>

                <GlassCard
                    p={0}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                    }}
                >
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Notification</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Recipient</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Sent Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {historyData.map((item) => (
                                    <TableRow 
                                        key={item.id} 
                                        hover
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.05) !important' },
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                    >
                                        <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: 'none' }}>{item.notification?.name || 'Unknown'}</TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{item.recipientEmail}</TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{new Date(item.sentAt).toLocaleString()}</TableCell>
                                        <TableCell sx={{ borderBottom: 'none' }}>
                                            <Chip
                                                label={item.status}
                                                size="small"
                                                sx={{ 
                                                    height: 20,
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    bgcolor: item.status === 'SENT' ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--destructive) / 0.12)',
                                                    color: item.status === 'SENT' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
                                                    border: `1px solid ${item.status === 'SENT' ? 'hsl(var(--success) / 0.24)' : 'hsl(var(--destructive) / 0.24)'}`
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GlassCard>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                {/* Pending Tab */}
                <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        sx={{ 
                            width: 320,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'hsl(var(--card) / 0.2)',
                                border: `1px solid ${DIVIDER}`,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    borderColor: ICON_COLOR,
                                    bgcolor: 'hsl(var(--card) / 0.3)',
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
                </Box>

                <GlassCard
                    p={0}
                    sx={{
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 4,
                        border: `1px solid ${DIVIDER}`,
                    }}
                >
                    <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
                        <Table stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Notification</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Recipient</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Scheduled Time</TableCell>
                                    <TableCell sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Event</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'hsl(var(--card) / 0.8)', backdropFilter: 'blur(10px)', color: TEXT_COLOR, borderBottom: `1px solid ${DIVIDER}` }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingData.map((item) => (
                                    <TableRow 
                                        key={item.id} 
                                        hover
                                        sx={{
                                            transition: 'all 0.2s ease',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.05) !important' },
                                            borderBottom: `1px solid ${DIVIDER}`
                                        }}
                                    >
                                        <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: 'none' }}>{item.notification?.name || 'Unknown'}</TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{item.recipientEmail}</TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{new Date(item.scheduledFor).toLocaleString()}</TableCell>
                                        <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{formatEventLabel(item.notification?.eventKey || '')}</TableCell>
                                        <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                            <Button 
                                                size="small" 
                                                color="error" 
                                                variant="outlined"
                                                sx={{ 
                                                    borderRadius: '8px', 
                                                    textTransform: 'none', 
                                                    fontWeight: 600,
                                                    borderWidth: '1.5px',
                                                    '&:hover': { borderWidth: '1.5px' }
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </GlassCard>
            </TabPanel>

            <TabPanel value={currentTab} index={3}>
                {/* System Notifications Tab */}
                <Alert 
                    severity="info"
                    sx={{
                        borderRadius: '12px',
                        bgcolor: 'hsl(var(--primary) / 0.05)',
                        color: TEXT_COLOR,
                        border: `1px solid ${DIVIDER}`,
                        '& .MuiAlert-icon': { color: ICON_COLOR }
                    }}
                >
                    System notifications are predefined email templates managed by the system.
                </Alert>
            </TabPanel>

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
                            boxShadow: '0 8px 32px hsl(0 0% 0% / 0.2)',
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
                <MenuItem onClick={() => selectedNotification && handleEditNotification(selectedNotification)}>
                    Edit
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleToggleActive(selectedNotification)}>
                    {selectedNotification?.isActive ? 'Deactivate' : 'Activate'}
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleDuplicate(selectedNotification)}>
                    Duplicate
                </MenuItem>
                <MenuItem onClick={() => selectedNotification && handleDeleteClick(selectedNotification.id)} sx={{ color: 'error.main !important' }}>
                    Delete
                </MenuItem>
            </Menu>

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
                            bgcolor: 'hsl(var(--card) / 0.9)',
                            backdropFilter: 'blur(20px)',
                            border: `1px solid ${DIVIDER}`,
                            borderRadius: '24px',
                            boxShadow: '0 24px 48px -12px hsl(0 0% 0% / 0.5)',
                        }),
                        backgroundImage: 'none'
                    }
                }}
            >
                <DialogTitle sx={{ color: TEXT_COLOR, fontWeight: 700 }}>Delete Notification</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: MUTED_TEXT }}>
                        Are you sure you want to delete this notification? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setDeleteDialogOpen(false)} sx={{ color: MUTED_TEXT, fontWeight: 600 }}>Cancel</Button>
                    <Button 
                        onClick={handleDeleteConfirm} 
                        color="error" 
                        variant="contained"
                        sx={{ 
                            borderRadius: '12px',
                            fontWeight: 700,
                            px: 3,
                            bgcolor: 'error.main',
                            '&:hover': { bgcolor: 'error.dark' }
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification Drawer */}
            <NotificationDrawer
                open={drawerOpen}
                notification={editingNotification}
                onClose={handleDrawerClose}
                onSave={handleDrawerSave}
            />
        </Box>
    );
}
