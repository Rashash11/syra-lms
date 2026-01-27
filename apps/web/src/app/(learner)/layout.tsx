'use client';

import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    Chip, TextField, InputAdornment, Radio,
} from '@mui/material';
import { SyraLogo } from '@shared/ui/components/SyraLogo';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import CardMembershipOutlinedIcon from '@mui/icons-material/CardMembershipOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { apiFetch } from '@shared/http/apiFetch';
import { ThemeToggle } from '@shared/ui/components/ThemeToggle';
import { SaudiThemeButton } from '@shared/ui/components/SaudiThemeButton';
import { LiquidGlassEffect } from '@shared/ui/components/LiquidGlassEffect';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { saudiThemePalette } from '@shared/theme/colors';

const drawerWidth = 260; // Standardize with admin

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/learner' },
    { text: 'My courses', icon: <MenuBookOutlinedIcon />, path: '/learner/courses' },
    { text: 'Learning paths', icon: <ExploreOutlinedIcon />, path: '/learner/learning-paths' },
    { text: 'Catalog', icon: <ExploreOutlinedIcon />, path: '/learner/catalog' },
    { text: 'ILT sessions', icon: <EventOutlinedIcon />, path: '/learner/ilt' },
    { text: 'Certificates', icon: <CardMembershipOutlinedIcon />, path: '/learner/certificates' },
    { text: 'Achievements', icon: <EmojiEventsOutlinedIcon />, path: '/learner/achievements', disabled: true },
    { text: 'Leaderboard', icon: <LeaderboardOutlinedIcon />, path: '/learner/leaderboard', disabled: true },
    { text: 'Assignments', icon: <AssignmentOutlinedIcon />, path: '/learner/assignments' },
    { text: 'Discussions', icon: <ForumOutlinedIcon />, path: '/learner/discussions' },
];

type RoleKey = 'ADMIN' | 'INSTRUCTOR' | 'SUPER_INSTRUCTOR' | 'LEARNER';
const roleLabels: Record<RoleKey, string> = {
    ADMIN: 'Administrator',
    INSTRUCTOR: 'Instructor',
    SUPER_INSTRUCTOR: 'Super instructor',
    LEARNER: 'Learner',
};

interface UserData {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    roles: RoleKey[];
    activeRole: RoleKey;
    avatar?: string;
}

export default function LearnerLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [switching, setSwitching] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiFetch<{ user: UserData }>('/api/me');
                setUser(data.user);
            } catch (err) {
                console.error('Failed to fetch user in LearnerLayout:', err);
                router.push('/login');
            }
        };
        fetchUser();
    }, []);


    const handleRoleChange = async (role: RoleKey) => {
        if (switching || role === user?.activeRole) return;

        setSwitching(true);
        try {
            const data = await apiFetch<{ success: boolean; redirectUrl: string }>('/api/me/switch-role', {
                method: 'POST',
                body: { role },
            });

            if (data.success) {
                setUser(prev => prev ? { ...prev, activeRole: role } : null);
                setAnchorEl(null);
                router.push(data.redirectUrl);
            }
        } catch (err) {
            console.error('Failed to switch role:', err);
        } finally {
            setSwitching(false);
        }
    };

    const handleLogout = async () => {
        try {
            await apiFetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (err) {
            console.error('Logout failed:', err);
            // Fallback redirect even if API call fails
            router.push('/login');
        }
    };

    const drawerColors = {
        bg: 'hsl(var(--card))',
        active: 'hsl(var(--primary) / 0.15)',
        hover: 'hsl(var(--muted) / 0.08)',
        text: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted-foreground))',
        icon: 'hsl(var(--primary))',
        border: 'hsl(var(--border))',
    };

    const { mode } = useThemeMode();

    const drawer = (
        <LiquidGlassEffect
            active={mode === 'liquid-glass'}
            sx={{ height: '100%', borderRadius: 0 }}
            displacementScale={20}
            blurAmount={0.4}
        >
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: mode === 'liquid-glass' ? 'transparent' : 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider'
            }}>
                {/* Logo at top of sidebar */}
                <Box sx={{ height: 70, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Box sx={{ position: 'relative', width: 140, height: 40, filter: 'drop-shadow(0 0 8px rgba(26, 84, 85, 0.3))' }}>
                        <SyraLogo sx={{ width: '100%', height: '100%', color: 'hsl(var(--foreground))' }} />
                    </Box>
                </Box>

                <List sx={{ flex: 1, pt: 0, px: 1.5 }}>
                    {menuItems.map((item) => {
                        const isSelected = pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemButton
                                    selected={isSelected}
                                    disabled={item.disabled}
                                    onClick={() => !item.disabled && router.push(item.path)}
                                    sx={{
                                        height: 44,
                                        px: 1.5,
                                        borderRadius: 2,
                                        color: isSelected ? drawerColors.text : drawerColors.muted,
                                        bgcolor: isSelected ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                                        transition: 'all 0.2s ease',
                                        '&.Mui-selected': {
                                            bgcolor: 'hsl(var(--primary) / 0.12)',
                                            '&:hover': { bgcolor: 'hsl(var(--primary) / 0.15)' },
                                            '& .MuiListItemIcon-root': { color: drawerColors.icon }
                                        },
                                        '&:hover': {
                                            bgcolor: drawerColors.hover,
                                            transform: 'translateX(4px)',
                                        },
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 32, color: isSelected ? drawerColors.icon : drawerColors.muted }}>
                                        {React.cloneElement(item.icon as React.ReactElement, { sx: { fontSize: 20 } })}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        primaryTypographyProps={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}
                                    />
                                    {item.disabled && (
                                        <Chip label="OFF" size="small" sx={{ height: 16, fontSize: 9, bgcolor: 'hsl(var(--muted) / 0.1)', color: drawerColors.muted, fontWeight: 700 }} />
                                    )}
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Box>
        </LiquidGlassEffect>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: 'background.default', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    boxShadow: 'none',
                    background: 'transparent'
                }}
            >
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        ...(mode === 'liquid-glass' ? {
                            backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        } : {
                            backdropFilter: 'blur(10px)',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        })
                    }}
                >
                    <Toolbar sx={{ px: 3, gap: 2, minHeight: '64px !important', height: 64 }}>
                        <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' }, color: drawerColors.icon }}>
                            <MenuIcon />
                        </IconButton>

                        <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, color: drawerColors.icon, p: 0.5 }}>
                            <MenuIcon sx={{ fontSize: 22 }} />
                        </IconButton>

                        <Box sx={{ flexGrow: 1 }} />

                        <TextField
                            placeholder="Search courses..."
                            size="small"
                            sx={{
                                width: '100%', maxWidth: 400,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'hsl(var(--card))',
                                    height: 40,
                                    borderRadius: 20,
                                    border: `1px solid ${drawerColors.border}`,
                                    '& fieldset': { border: 'none' },
                                    '&:hover': { bgcolor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' },
                                }
                            }}
                            InputProps={{
                                endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: drawerColors.icon }} /></InputAdornment>
                            }}
                        />

                        <Box sx={{ flexGrow: 1 }} />

                        <IconButton sx={{ color: drawerColors.muted }}><NotificationsOutlinedIcon /></IconButton>

                        <SaudiThemeButton />
                        <ThemeToggle />

                        <Box
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                                bgcolor: 'hsl(var(--primary) / 0.10)', border: `1px solid ${drawerColors.border}`, borderRadius: 20,
                                px: 1, py: 0.5, height: 40,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.15)', borderColor: 'hsl(var(--border))' }
                            }}
                        >
                            <Avatar sx={{ width: 30, height: 30, bgcolor: 'hsl(var(--primary))', fontSize: 13, fontWeight: 700 }}>
                                {user?.firstName ? user.firstName[0] : 'U'}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}>
                                <Typography variant="body2" fontWeight={700} fontSize={13} color={drawerColors.text}>
                                    {user ? `${user.firstName} ${user.lastName}` : 'Learner'}
                                </Typography>
                            </Box>
                            <KeyboardArrowDownIcon sx={{ color: drawerColors.muted, fontSize: 16 }} />
                        </Box>

                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{
                            sx: {
                                width: 240,
                                mt: 1.5,
                                ...(mode === 'liquid-glass' ? {
                                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                    borderRadius: '24px',
                                } : {
                                    bgcolor: 'hsl(var(--card))',
                                    backdropFilter: 'blur(20px)',
                                    border: `1px solid ${drawerColors.border}`,
                                    borderRadius: 3,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                                })
                            }
                        }}>
                            {user?.activeRole !== 'LEARNER' && (
                                <>
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Switch role</Typography>
                                    </Box>
                                    {(Object.keys(roleLabels) as RoleKey[]).map((role) => (
                                        <MenuItem key={role} onClick={() => handleRoleChange(role)} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}>
                                            <Radio checked={user?.activeRole === role} size="small" sx={{ p: 0.5, mr: 1, color: drawerColors.icon, '&.Mui-checked': { color: drawerColors.icon } }} />
                                            <Typography variant="body2" fontSize={13} fontWeight={500}>{roleLabels[role]}</Typography>
                                        </MenuItem>
                                    ))}
                                    <Divider sx={{ my: 1, opacity: 0.5 }} />
                                </>
                            )}
                            <MenuItem sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                            <Divider sx={{ my: 1, opacity: 0.5 }} />
                            <MenuItem onClick={handleLogout} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}>
                                <LogoutIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} />
                                <Typography variant="body2" fontSize={13}>Log out</Typography>
                            </MenuItem>
                        </Menu>
                    </Toolbar>
                </Box>
            </AppBar>

            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, border: 'none' } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', border: 'none', background: 'transparent' } }} open>
                    {drawer}
                </Drawer>
            </Box>

            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                mt: 8,
                position: 'relative'
            }}>
                {children}
            </Box>
        </Box>
    );
}
