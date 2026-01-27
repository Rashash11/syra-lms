'use client';

export const dynamic = 'force-dynamic';

// Re-trigger build
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
    ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider,
    Chip, Badge, TextField, InputAdornment, Button, Radio, Switch, CircularProgress,
    Collapse,
} from '@mui/material';
import Image from 'next/image';
import { SyraLogo } from '@shared/ui/components/SyraLogo';
import Link from '@shared/ui/AppLink';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import HomeIcon from '@mui/icons-material/Home';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import RouteIcon from '@mui/icons-material/Route';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { usePermissions, clearPermissionsCache } from '@/hooks/usePermissions';
import { apiFetch } from '@shared/http/apiFetch';
import { ThemeToggle } from '@shared/ui/components/ThemeToggle';
import { SaudiThemeButton } from '@shared/ui/components/SaudiThemeButton';
import { saudiThemePalette } from '@shared/theme/colors';
import { LiquidGlassEffect } from '@shared/ui/components/LiquidGlassEffect';
import { SmokeCursor } from '@shared/ui/components/SmokeCursor';
import { LightRays } from '@shared/ui/components/LightRays';
import { useThemeMode } from '@shared/theme/ThemeContext';

// NCOSH Design System Unified Palette
const SIDEBAR_BG = 'hsl(var(--card))';
const SIDEBAR_BG_SOLID = 'hsl(var(--card))';
const ACTIVE_BG = 'hsl(var(--primary) / 0.15)';
const HOVER_BG = 'hsl(var(--muted) / 0.08)';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const ICON_COLOR = 'hsl(var(--primary))';
const DIVIDER = 'hsl(var(--border))';

const drawerWidth = 260;

const menuItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/admin' },
    { text: 'Users', icon: <PeopleOutlineIcon />, path: '/admin/users', permission: 'user:read' },
    { text: 'Courses', icon: <MenuBookOutlinedIcon />, path: '/admin/courses', permission: 'course:read' },
    { text: 'Learning paths', icon: <RouteIcon />, path: '/admin/learning-paths', permission: 'learning_path:read' },
    { text: 'Course store', icon: <StorefrontOutlinedIcon />, path: '/admin/course-store', hasArrow: true, hasBadge: true },
    { text: 'Groups', icon: <GroupsOutlinedIcon />, path: '/admin/groups', permission: 'group:read' },
    { text: 'Branches', icon: <AccountTreeOutlinedIcon />, path: '/admin/branches', hasBadge: true, permission: 'branches:read' },
    { text: 'Automations', icon: <AutoFixHighOutlinedIcon />, path: '/admin/automations', hasBadge: true, permission: 'automations:read' },
    { text: 'Notifications', icon: <NotificationsNoneOutlinedIcon />, path: '/admin/notifications', permission: 'notifications:read' },
    {
        text: 'Reports',
        icon: <AssessmentOutlinedIcon />,
        path: '/admin/reports',
        permission: 'reports:read',
        subItems: [
            { text: 'Overview', path: '/admin/reports?tab=overview' },
            { text: 'Training Matrix', path: '/admin/reports?tab=matrix' },
            { text: 'Timeline', path: '/admin/reports?tab=timeline' },
        ]
    },
    { text: 'Skills', icon: <EmojiObjectsOutlinedIcon />, path: '/admin/skills', hasBadge: true, permission: 'skills:read' },
    { text: 'Assignments', icon: <AssignmentOutlinedIcon />, path: '/admin/assignments', permission: 'assignment:read' },
    { text: 'Account & Settings', icon: <SettingsOutlinedIcon />, path: '/admin/settings', hasArrow: true },
    { text: 'Subscription', icon: <CreditCardOutlinedIcon />, path: '/admin/subscription' },
    { text: 'Sessions', icon: <SecurityOutlinedIcon />, path: '/admin/security/sessions', permission: 'security:sessions:read' },
    { text: 'Audit Log', icon: <HistoryOutlinedIcon />, path: '/admin/security/audit', permission: 'security:audit:read' },
];

type RoleKey = 'ADMIN' | 'INSTRUCTOR' | 'SUPER_INSTRUCTOR' | 'LEARNER';
const roleLabels: Record<RoleKey, string> = {
    'ADMIN': 'Administrator',
    'INSTRUCTOR': 'Instructor',
    'SUPER_INSTRUCTOR': 'Super instructor',
    'LEARNER': 'Learner'
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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { mode, setTheme } = useThemeMode();
    const [mobileOpen, setMobileOpen] = useState(false);

    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'hsl(var(--glass-bg))',
        border: '1px solid hsl(var(--glass-border))',
        boxShadow: '0 0 20px -5px hsl(var(--glass-glow)), 0 8px 32px -8px hsl(var(--glass-shadow)), inset 0 0 0 1px hsl(var(--glass-border))',
    } : {};

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
    const [user, setUser] = useState<UserData | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [switching, setSwitching] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { can, loading, refresh } = usePermissions();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const data = await apiFetch<{ user?: UserData }>('/api/me', { credentials: 'include' });
                if (!data.user) return;
                setUser(data.user);
                if (data.user.activeRole === 'SUPER_INSTRUCTOR') {
                    const restrictedPaths = ['/admin/settings', '/admin/subscription', '/admin/automations', '/admin/branches'];
                    if (restrictedPaths.some(path => pathname.startsWith(path))) {
                        router.replace('/admin/403');
                    }
                }
            } catch (err) {
                // Only log if it's not a noise error (handled by ThemeRegistry)
                // but we can also be more specific here to avoid logging HTML
                if (err instanceof Error && err.message.includes('<!DOCTYPE html>')) {
                    // Silently fail for HTML responses (likely auth redirects/404s)
                    return;
                }
                console.error('Failed to fetch user:', err);
            } finally {
                setLoadingUser(false);
            }
        };
        fetchUser();
    }, [pathname, router]);

    const handleRoleChange = async (role: RoleKey) => {
        if (switching || role === user?.activeRole) return;

        setSwitching(true);
        try {
            const data = await apiFetch<{ success: boolean; redirectUrl: string }>('/api/me/switch-role', {
                method: 'POST',
                body: { role },
                credentials: 'include',
            });

            if (data.success) {
                clearPermissionsCache();
                refresh();
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
        await apiFetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        }).catch(() => undefined);
        clearPermissionsCache();
        window.location.href = '/login';
    };

    const handleSubmenuToggle = (text: string) => {
        setOpenSubmenus(prev => ({
            ...prev,
            [text]: !prev[text]
        }));
    };

    // Removed forced 'liquid-glass' theme effect
    // useEffect(() => {
    //     setTheme('liquid-glass');
    // }, [setTheme]);

    const drawer = (
        <LiquidGlassEffect
            active={mode === 'liquid-glass'}
            displacementScale={0}
            aberrationIntensity={0}
            blurAmount={0.2}
            sx={{
                height: '100%',
                borderRadius: 0,
                bgcolor: mode === 'liquid-glass' ? 'transparent' : mode === 'saudi' ? saudiThemePalette.background.drawer : 'background.paper',
                overflow: 'hidden' // Ensure LiquidGlassEffect itself doesn't cause overflow
            }}
        >
            <Box sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'transparent', // Let LiquidGlassEffect handle it
                overflow: 'hidden' // Ensure the flex container clips overflow
            }}>
                {/* Logo at top of sidebar */}
                <Box sx={{ height: 70, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', flexShrink: 0 }}>
                    <Box sx={{ position: 'relative', width: 140, height: 40, filter: 'drop-shadow(0 0 8px hsl(0 0% 100% / 0.3))' }}>
                        <SyraLogo sx={{ width: '100%', height: '100%', color: 'hsl(var(--foreground))' }} />
                    </Box>
                </Box>

                <List sx={{
                    flex: 1,
                    pt: 0,
                    px: 1.5,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    // Custom scrollbar that appears on hover
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'transparent transparent',
                    '&:hover': {
                        scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) transparent',
                    },
                    '&::-webkit-scrollbar': {
                        width: '5px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        backgroundColor: 'transparent',
                        borderRadius: '20px',
                    },
                    '&:hover::-webkit-scrollbar-thumb': {
                        backgroundColor: 'hsl(var(--muted-foreground) / 0.3)',
                    },
                }}>
                    {menuItems.filter(item => {
                        if (item.permission && !loading && user) {
                            const isAdmin = user.activeRole === 'ADMIN';
                            if (!isAdmin && !can(item.permission)) return false;
                        }
                        if (user?.activeRole === 'SUPER_INSTRUCTOR') {
                            if (['Account & Settings', 'Subscription', 'Automations', 'Branches'].includes(item.text)) return false;
                        }
                        return true;
                    }).map((item) => {
                        const hasSubItems = 'subItems' in item && (item as any).subItems;
                        const isExpanded = openSubmenus[item.text];
                        const isActive = pathname === item.path || (hasSubItems && pathname.startsWith(item.path));

                        return (
                            <React.Fragment key={item.text}>
                                <ListItem disablePadding sx={{ mb: 0.2, display: 'block' }}>
                                    <ListItemButton
                                        onClick={() => hasSubItems ? handleSubmenuToggle(item.text) : router.push(item.path)}
                                        role="link"
                                        aria-label={item.text}
                                        selected={isActive}
                                        sx={{
                                            height: 44,
                                            px: 1.5,
                                            borderRadius: 24,
                                            color: isActive ? TEXT_COLOR : MUTED_TEXT,
                                            border: '1px solid',
                                            borderColor: isActive ? 'hsl(var(--primary) / 0.30)' : DIVIDER,
                                            bgcolor: isActive ? 'hsl(var(--primary) / 0.12)' : 'transparent',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: 'none',
                                            '& .MuiListItemIcon-root': { transition: 'transform 0.2s ease' },
                                            '&.Mui-selected': {
                                                '&:hover': { bgcolor: 'hsl(var(--primary) / 0.15)' },
                                                '& .MuiListItemIcon-root': { color: ICON_COLOR }
                                            },
                                            '&:hover': {
                                                bgcolor: HOVER_BG,
                                                borderColor: 'hsl(var(--border))',
                                                transform: 'translateX(6px) scale(1.02)',
                                                boxShadow: '0 8px 24px -8px hsl(var(--glass-shadow))',
                                                '& .MuiListItemIcon-root': { transform: 'translateX(2px) scale(1.05)' }
                                            },
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 28, color: isActive ? ICON_COLOR : MUTED_TEXT, transition: 'color 0.2s' }}>
                                            {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{ fontSize: 13, fontWeight: isActive ? 600 : 500, letterSpacing: '0.01em' }}
                                        />
                                        {(item as any).hasBadge && (
                                            <Box sx={{
                                                width: 6, height: 6, borderRadius: '50%',
                                                bgcolor: 'hsl(var(--secondary))', ml: 0.5,
                                                boxShadow: '0 0 8px hsl(var(--secondary) / 0.5)'
                                            }} />
                                        )}
                                        {(item as any).hasArrow && !hasSubItems && <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.4 }} />}
                                        {hasSubItems && (isExpanded ? <ExpandLess sx={{ fontSize: 16, opacity: 0.6 }} /> : <ExpandMore sx={{ fontSize: 16, opacity: 0.6 }} />)}
                                    </ListItemButton>

                                    {hasSubItems && (
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <List component="div" disablePadding>
                                                {(item as any).subItems.map((subItem: any) => {
                                                    const isSubActive = pathname === subItem.path.split('?')[0] &&
                                                        (!subItem.path.includes('?') || searchParams.toString().includes(subItem.path.split('?')[1]));

                                                    return (
                                                        <ListItemButton
                                                            key={subItem.text}
                                                            onClick={() => router.push(subItem.path)}
                                                            sx={{
                                                                pl: 4,
                                                                minHeight: 36,
                                                                borderRadius: 24,
                                                                mb: 0.2,
                                                                mt: 0.2,
                                                                color: isSubActive ? ICON_COLOR : MUTED_TEXT,
                                                                bgcolor: isSubActive ? 'hsl(var(--primary) / 0.08)' : 'transparent',
                                                                '&:hover': {
                                                                    bgcolor: HOVER_BG,
                                                                    color: TEXT_COLOR,
                                                                }
                                                            }}
                                                        >
                                                            <ListItemText
                                                                primary={subItem.text}
                                                                primaryTypographyProps={{
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: isSubActive ? 600 : 400
                                                                }}
                                                            />
                                                        </ListItemButton>
                                                    );
                                                })}
                                            </List>
                                        </Collapse>
                                    )}
                                </ListItem>
                            </React.Fragment>
                        );
                    })}
                </List>

                {/* Demo mode toggle at bottom */}
                <Box sx={{ p: 1.5, borderTop: `1px solid ${DIVIDER}` }}>
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        cursor: 'pointer',
                        p: 1, borderRadius: 2,
                        '&:hover': { bgcolor: HOVER_BG }
                    }}>
                        <PlayCircleOutlineIcon sx={{ color: ICON_COLOR, fontSize: 18 }} />
                        <Typography sx={{ color: TEXT_COLOR, fontSize: 13, flex: 1, fontWeight: 500 }}>Demo mode</Typography>
                        <InfoOutlinedIcon sx={{ color: MUTED_TEXT, fontSize: 16 }} />
                    </Box>
                </Box>
            </Box>
        </LiquidGlassEffect>
    );

    const isStandalonePage = pathname?.startsWith('/admin/courses/new/edit') ||
        pathname?.startsWith('/admin/learning-paths/new') ||
        (pathname?.includes('/learning-paths/') && pathname?.endsWith('/edit'));

    if (isStandalonePage) {
        return <>{children}</>;
    }

    const bypassAdminGuard = process.env.NEXT_PUBLIC_E2E_DISABLE_LOGIN_REDIRECT === '1';

    if (loadingUser && !user && !bypassAdminGuard) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!user || user.activeRole !== 'ADMIN') {
        if (bypassAdminGuard) {
            return <>{children}</>;
        }
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
                <Box className="glass-card" sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Access Denied</Typography>
                    <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', mb: 3 }}>
                        You are not authorized to access the admin portal.
                    </Typography>
                    <Button variant="contained" onClick={() => router.push('/login')} sx={{ textTransform: 'none' }}>
                        Go to login
                    </Button>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            display: 'flex',
            minHeight: '100vh',
            background: mode === 'liquid-glass'
                ? 'transparent' // Transparent to show the LiquidMeshBackground from RootLayout
                : 'background.default'
        }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    bgcolor: mode === 'liquid-glass' ? 'transparent' : 'background.paper',
                    color: 'text.primary',
                    // Removed borderBottom for seamless glass look
                    boxShadow: 'none',
                }}
            >
                <LiquidGlassEffect
                    active={mode === 'liquid-glass'}
                    displacementScale={0}
                    aberrationIntensity={0}
                    blurAmount={0.2}
                    sx={{ width: '100%', height: '100%', borderRadius: 0 }}
                >
                    <Toolbar sx={{ px: 3, gap: 2, minHeight: '64px !important', height: 64 }}>
                        <IconButton edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ display: { sm: 'none' }, color: ICON_COLOR }}>
                            <MenuIcon />
                        </IconButton>

                        <IconButton sx={{ display: { xs: 'none', sm: 'flex' }, color: ICON_COLOR, p: 0.5 }}>
                            <MenuIcon sx={{ fontSize: 22 }} />
                        </IconButton>

                        <Box sx={{ flexGrow: 1 }} />

                        {/* Search - Glass pill style */}
                        <TextField
                            placeholder="Search anything..."
                            size="small"
                            sx={{
                                width: '100%', maxWidth: 400,
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'hsl(var(--card) / 0.4)',
                                    height: 40,
                                    borderRadius: 20,
                                    transition: 'all 0.2s',
                                    border: `1px solid ${DIVIDER}`,
                                    '& fieldset': { border: 'none' },
                                    '&:hover': { bgcolor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' },
                                    '&.Mui-focused': { bgcolor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', boxShadow: 'none' },
                                    ...(mode === 'liquid-glass' ? {
                                        ...glassStyle,
                                    } : {})
                                },
                            }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: ICON_COLOR, fontSize: 20 }} /></InputAdornment>
                            }}
                        />

                        <Box sx={{ flexGrow: 1 }} />

                        <IconButton
                            size="small"
                            component={Link}
                            href="/admin/notifications"
                            sx={{ color: MUTED_TEXT, '&:hover': { color: ICON_COLOR } }}
                        >
                            <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
                        </IconButton>

                        <SaudiThemeButton />
                        <ThemeToggle />

                        {/* User Menu - Glass style */}
                        <Box
                            onClick={(e) => setAnchorEl(e.currentTarget)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                                bgcolor: mode === 'saudi' ? saudiThemePalette.background.glassButton : 'hsl(var(--primary) / 0.10)',
                                border: `1px solid ${mode === 'saudi' ? saudiThemePalette.border.button : DIVIDER}`,
                                borderRadius: 20,
                                px: 1, py: 0.5, height: 40,
                                transition: 'all 0.2s',
                                '&:hover': { bgcolor: mode === 'saudi' ? saudiThemePalette.background.glassButtonHover : 'hsl(var(--primary) / 0.15)', borderColor: DIVIDER }
                            }}
                        >
                            <Avatar sx={{ width: 30, height: 30, bgcolor: mode === 'saudi' ? saudiThemePalette.primary.main : 'hsl(var(--primary))', color: mode === 'saudi' ? saudiThemePalette.primary.contrastText : undefined, fontSize: 13, fontWeight: 700, boxShadow: '0 0 10px hsl(var(--primary) / 0.4)' }}>
                                {user?.firstName?.[0]?.toUpperCase() || 'A'}
                            </Avatar>
                            <Box sx={{ display: { xs: 'none', lg: 'block' }, mx: 0.5 }}>
                                <Typography variant="body2" fontWeight={700} fontSize={13} color={mode === 'saudi' ? saudiThemePalette.text.primary : TEXT_COLOR}>
                                    {user ? `${user.firstName} ${user.lastName}` : 'Admin'}
                                </Typography>
                            </Box>
                            <KeyboardArrowDownIcon sx={{ color: mode === 'saudi' ? saudiThemePalette.text.muted : MUTED_TEXT, fontSize: 16 }} />
                        </Box>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => setAnchorEl(null)}
                            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            PaperProps={{
                                sx: {
                                    width: 240,
                                    mt: 1.5,
                                    ...(mode === 'liquid-glass' ? {
                                        ...glassStyle,
                                        borderRadius: '24px',
                                    } : mode === 'saudi' ? {
                                        ...glassStyle,
                                        borderRadius: '16px',
                                    } : {
                                        bgcolor: 'hsl(var(--card))',
                                        backdropFilter: 'blur(20px)',
                                        border: `1px solid ${DIVIDER}`,
                                        borderRadius: 3,
                                        boxShadow: '0 10px 40px hsl(0 0% 0% / 0.5)'
                                    }),
                                    color: mode === 'saudi' ? saudiThemePalette.text.primary : undefined
                                }
                            }}
                        >
                            {/* ... menu items (style them slightly better if needed) */}
                            <Box sx={{ px: 2, py: 1.5 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em', textTransform: 'uppercase' }}>Switch role</Typography>
                            </Box>
                            {user?.roles?.map((roleKey) => (
                                <MenuItem
                                    key={roleKey}
                                    onClick={() => handleRoleChange(roleKey)}
                                    sx={{ py: 1, mx: 1, borderRadius: 1.5 }}
                                    disabled={switching}
                                >
                                    <Radio checked={user.activeRole === roleKey} size="small" sx={{ p: 0.5, mr: 1, color: ICON_COLOR, '&.Mui-checked': { color: ICON_COLOR } }} />
                                    <Typography variant="body2" fontSize={13} fontWeight={500}>{roleLabels[roleKey]}</Typography>
                                    {switching && user.activeRole !== roleKey && <CircularProgress size={14} sx={{ ml: 'auto', color: ICON_COLOR }} />}
                                </MenuItem>
                            ))}
                            <Divider sx={{ my: 1, opacity: 0.5 }} />
                            <MenuItem
                                onClick={() => {
                                    setAnchorEl(null);
                                    if (!user?.id) return;
                                    router.push(`/admin/users/${user.id}/edit`);
                                }}
                                sx={{ py: 1, mx: 1, borderRadius: 1.5 }}
                            >
                                <PersonOutlineIcon sx={{ mr: 1.5, fontSize: 18, color: ICON_COLOR }} />
                                <Typography variant="body2" fontSize={13}>My profile</Typography>
                            </MenuItem>
                            <MenuItem onClick={handleLogout} sx={{ py: 1, mx: 1, borderRadius: 1.5, color: 'hsl(0 72% 51%)' }}><LogoutIcon sx={{ mr: 1.5, fontSize: 18 }} /><Typography variant="body2" fontSize={13} fontWeight={600}>Log out</Typography></MenuItem>
                        </Menu>
                    </Toolbar>
                </LiquidGlassEffect>
            </AppBar>

            {/* Sidebar Container */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={() => setMobileOpen(false)}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            border: 'none',
                            bgcolor: mode === 'liquid-glass' ? 'transparent' : 'background.paper',
                            overflow: 'hidden' // Prevent full drawer scroll, rely on List scroll
                        }
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                            border: 'none',
                            background: 'transparent',
                            overflow: 'hidden' // Prevent full drawer scroll, rely on List scroll
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3, md: 4 },
                width: { sm: `calc(100% - ${drawerWidth}px)` },
                mt: 8,
                maxWidth: '100%',
                position: 'relative'
            }}>
                {/* Background Layer Stack */}
                <div className="bg-noise" />
                <div className="bg-grid" />
                <LightRays
                    raysOrigin="top-center"
                    raysColor="hsl(var(--primary))"
                    raysSpeed={0.5}
                    lightSpread={0.5}
                    rayLength={1.5}
                    pulsating={true}
                    mouseInfluence={0.05}
                    style={{
                        zIndex: -1,
                        opacity: 0.8, // Reduced opacity
                        pointerEvents: 'none',
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh'
                    }}
                />
                {/* Second LightRays removed for performance */}

                <SmokeCursor />
                {children}
            </Box>
        </Box>
    );
}
