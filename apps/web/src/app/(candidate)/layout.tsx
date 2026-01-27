'use client';

import React, { useState } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    TextField, InputAdornment,
} from '@mui/material';
import { SyraLogo } from '@shared/ui/components/SyraLogo';
import { usePathname, useRouter } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HomeIcon from '@mui/icons-material/Home';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { LiquidGlassEffect } from '@shared/ui/components/LiquidGlassEffect';
import { useThemeMode } from '@shared/theme/ThemeContext';

const drawerWidth = 260;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/candidate' },
    { text: 'My exams', icon: <QuizOutlinedIcon />, path: '/candidate/exams' },
    { text: 'Exam history', icon: <HistoryOutlinedIcon />, path: '/candidate/history' },
    { text: 'My profile', icon: <PersonOutlineIcon />, path: '/candidate/profile' },
    { text: 'Onboarding', icon: <ChecklistOutlinedIcon />, path: '/candidate/onboarding' },
    { text: 'Help & Support', icon: <HelpOutlineIcon />, path: '/candidate/help' },
];

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const pathname = usePathname();
    const router = useRouter();
    const { mode } = useThemeMode();

    const drawerColors = {
        bg: 'hsl(var(--card))',
        active: 'hsl(var(--primary) / 0.15)',
        hover: 'hsl(var(--muted) / 0.08)',
        text: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted-foreground))',
        icon: 'hsl(var(--primary))',
        border: 'hsl(var(--border))',
    };

    const drawer = (
        <LiquidGlassEffect active={mode === 'liquid-glass'} sx={{ height: '100%', borderRadius: 0 }}>
        <Box sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'transparent',
            borderRight: `1px solid ${drawerColors.border}`
        }}>
            {/* Logo at top of sidebar */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, height: 70 }}>
                <Box sx={{ position: 'relative', width: 140, height: 40, filter: 'drop-shadow(0 0 8px rgba(26, 84, 85, 0.3))' }}>
                    <SyraLogo sx={{ width: '100%', height: '100%', color: 'hsl(var(--foreground))' }} />
                </Box>
            </Box>

            <List sx={{ flex: 1, pt: 0, px: 1.5 }}>
                {menuItems.map((item) => {
                    const isSelected = pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <LiquidGlassEffect active={mode === 'liquid-glass'} cornerRadius={24} displacementScale={12} blurAmount={0.2} sx={{ width: '100%', borderRadius: 24 }}>
                            <ListItemButton
                                selected={isSelected}
                                onClick={() => router.push(item.path)}
                                sx={{
                                    height: 44,
                                    px: 1.5,
                                    borderRadius: 24,
                                    color: isSelected ? drawerColors.text : drawerColors.muted,
                                    border: '1px solid',
                                    borderColor: isSelected ? 'hsl(var(--primary) / 0.30)' : drawerColors.border,
                                    bgcolor: isSelected ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: 'none',
                                    '& .MuiListItemIcon-root': { transition: 'transform 0.2s ease' },
                                    '&.Mui-selected': {
                                        '&:hover': { bgcolor: 'hsl(var(--primary) / 0.15)' },
                                        '& .MuiListItemIcon-root': { color: drawerColors.icon }
                                    },
                                    '&:hover': {
                                        bgcolor: drawerColors.hover,
                                        borderColor: 'hsl(var(--border))',
                                        transform: 'translateX(6px) scale(1.02)',
                                        boxShadow: '0 8px 24px -8px hsl(var(--glass-shadow))',
                                        '& .MuiListItemIcon-root': { transform: 'translateX(2px) scale(1.05)' }
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
                            </ListItemButton>
                            </LiquidGlassEffect>
                        </ListItem>
                    );
                })}
            </List>
        </Box>
        </LiquidGlassEffect>
    );

    return (
        <Box sx={{ display: 'flex', bgcolor: 'hsl(var(--background))', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))',
                    borderBottom: `1px solid ${drawerColors.border}`,
                    boxShadow: 'none',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                }}
            >
                <Toolbar sx={{ px: 3, gap: 2, minHeight: '64px !important', height: 64 }}>
                    <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' }, color: drawerColors.icon }}>
                        <MenuIcon />
                    </IconButton>

                    <TextField
                        placeholder="Search..."
                        size="small"
                        sx={{
                            flex: 1, maxWidth: 400,
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
                            endAdornment: <InputAdornment position="end"><SearchIcon sx={{ color: drawerColors.icon, fontSize: 20 }} /></InputAdornment>
                        }}
                    />

                    <Box sx={{ flexGrow: 1 }} />

                    <IconButton sx={{ color: drawerColors.muted }}><NotificationsOutlinedIcon /></IconButton>

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
                        <Avatar sx={{ width: 30, height: 30, bgcolor: 'hsl(var(--primary))', fontSize: 13, fontWeight: 700 }}>C</Avatar>
                        <Box sx={{ display: { xs: 'none', md: 'block' }, mx: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} fontSize={13} color={drawerColors.text}>Test Candidate</Typography>
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
                                bgcolor: 'rgba(13, 20, 20, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: `1px solid ${drawerColors.border}`,
                                borderRadius: 3,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.5)'
                            })
                        }
                    }}>
                        <MenuItem onClick={() => router.push('/candidate/profile')} sx={{ py: 1, mx: 1, borderRadius: 1.5 }}><PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: drawerColors.icon }} /><Typography variant="body2" fontSize={13}>My profile</Typography></MenuItem>
                        <Divider sx={{ my: 1, opacity: 0.5 }} />
                        <MenuItem onClick={() => { window.location.href = '/login'; }} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
                    </Menu>
                </Toolbar>
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
