'use client';

import * as React from 'react';
import { styled, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { SyraLogo } from '../components/SyraLogo';

import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Badge from '@mui/material/Badge';
import MailIcon from '@mui/icons-material/Mail';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';
import InputBase from '@mui/material/InputBase';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiFetch } from '@shared/http/apiFetch';
import { ThemeToggle } from '../components/ThemeToggle';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { saudiThemePalette } from '@shared/theme/colors';

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
    width: drawerWidth,
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
    transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    overflowX: 'hidden',
    width: `calc(${theme.spacing(7)} + 1px)`,
    [theme.breakpoints.up('sm')]: {
        width: `calc(${theme.spacing(8)} + 1px)`,
    },
});

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing(0, 1),
    ...theme.mixins.toolbar,
}));

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
    ({ theme, open }) => ({
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        ...(open && {
            ...openedMixin(theme),
            '& .MuiDrawer-paper': openedMixin(theme),
        }),
        ...(!open && {
            ...closedMixin(theme),
            '& .MuiDrawer-paper': closedMixin(theme),
        }),
    }),
);

const menuItems = [
    { text: 'Home', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Courses', icon: <SchoolIcon />, path: '/courses', permission: 'course:read' },
    { text: 'Users', icon: <PeopleIcon />, path: '/users', permission: 'user:read' },
    { text: 'Candidates', icon: <PersonSearchIcon />, path: '/candidates', permission: 'user:read' },
    { text: 'Assignments', icon: <HistoryIcon />, path: '/admin/assignments', permission: 'assignment:create' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/courses', permission: 'course:create' },
    { text: 'Audit Log', icon: <HistoryIcon />, path: '/admin/security/audit', permission: 'security:audit:read' },
    {
        text: 'Reports',
        icon: <AssessmentIcon />,
        path: '/admin/reports',
        permission: 'reports:read',
        subItems: [
            { text: 'Overview', path: '/admin/reports?tab=overview' },
            { text: 'Training Matrix', path: '/admin/reports?tab=matrix' },
            { text: 'Timeline', path: '/admin/reports?tab=timeline' },
        ]
    },
];

const bottomMenuItems = [
    { text: 'Settings', icon: <SettingsIcon />, path: '/admin/settings', permission: 'settings:read' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(true);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { can } = usePermissions();
    const { mode } = useThemeMode();

    const [openSubmenus, setOpenSubmenus] = React.useState<Record<string, boolean>>({});

    const handleSubmenuToggle = (text: string) => {
        if (!open) setOpen(true);
        setOpenSubmenus(prev => ({
            ...prev,
            [text]: !prev[text]
        }));
    };

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = async () => {
        handleMenuClose();
        await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        window.location.href = '/login';
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

    const isLiquid = mode === 'liquid-glass';

    return (
        <Box sx={{ display: 'flex' }}>
            <AppBar
                position="fixed"
                open={open}
                elevation={0}
                className={isLiquid ? 'liquid-glass glass-z3' : ''}
                sx={{
                  bgcolor: isLiquid ? 'transparent' : 'background.paper',
                  borderBottom: isLiquid ? 'none' : '1px solid',
                  borderColor: 'divider',
                  color: 'text.primary',
                  borderRadius: 0,
                  mt: isLiquid ? 2 : 0,
                  mx: isLiquid ? 2 : 0,
                  width: isLiquid ? `calc(100% - ${open ? 280 : 100}px - 32px)` : undefined,
                  left: isLiquid ? (open ? 280 : 100) : undefined,
                  transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
                    <IconButton
                        color="inherit"
                        aria-label="toggle drawer"
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2, color: '#1dd3c5' }}
                    >
                        {open ? <ChevronLeftIcon /> : <MenuIcon />}
                    </IconButton>
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', px: 4 }}>
                        {isLiquid ? (
                            <Box 
                                className="glass-pill" 
                                sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    width: '100%', 
                                    maxWidth: 400,
                                    height: 40,
                                    mx: 'auto'
                                }}
                            >
                                <Box className="glass-bubble" sx={{ mr: 1, width: 28, height: 28 }}>
                                    <SearchIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
                                </Box>
                                <InputBase
                                    placeholder="Search everything..."
                                    sx={{ 
                                        ml: 1, 
                                        flex: 1, 
                                        color: 'rgba(255,255,255,0.9)',
                                        fontSize: '0.875rem',
                                        '& input::placeholder': {
                                            color: 'rgba(255,255,255,0.4)',
                                            opacity: 1
                                        }
                                    }}
                                />
                            </Box>
                        ) : (
                            <Box sx={{ position: 'relative', width: 120, height: 40 }}>
                                <SyraLogo sx={{ width: '100%', height: '100%', color: 'rgba(255,255,255,0.95)' }} />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <ThemeToggle />
                        <Tooltip title="Messages">
                            <IconButton 
                                color="inherit" 
                                className={isLiquid ? 'glass-bubble' : ''} 
                                sx={{ 
                                    color: 'rgba(255,255,255,0.7)',
                                    borderRadius: isLiquid ? '50%' : '8px',
                                    width: 40, height: 40,
                                    p: 0,
                                    border: isLiquid ? 'none' : undefined,
                                    bgcolor: 'transparent'
                                }}
                            >
                                <Badge badgeContent={4} color="secondary">
                                    <MailIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Notifications">
                            <IconButton 
                                color="inherit" 
                                className={isLiquid ? 'glass-bubble' : ''} 
                                sx={{ 
                                    color: 'rgba(255,255,255,0.7)',
                                    borderRadius: isLiquid ? '50%' : '8px',
                                    width: 40, height: 40,
                                    p: 0,
                                    border: isLiquid ? 'none' : undefined,
                                    bgcolor: 'transparent'
                                }}
                            >
                                <Badge badgeContent={17} color="secondary">
                                    <NotificationsIcon />
                                </Badge>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Account">
                            <IconButton 
                                onClick={handleProfileMenuOpen} 
                                className={isLiquid ? 'glass-bubble' : ''}
                                sx={{ 
                                    p: 0, 
                                    ml: 1,
                                    width: 40, height: 40,
                                    border: isLiquid ? 'none' : undefined
                                }}
                            >
                                <Avatar sx={{ 
                                    width: isLiquid ? 32 : 40, 
                                    height: isLiquid ? 32 : 40, 
                                    bgcolor: 'rgba(29, 211, 197, 0.2)', 
                                    color: '#1dd3c5',
                                    border: isLiquid ? 'none' : '1px solid rgba(29, 211, 197, 0.4)',
                                    fontWeight: 700,
                                    fontSize: isLiquid ? '0.8rem' : undefined
                                }}>A</Avatar>
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        className={isLiquid ? 'liquid-glass' : ''}
                        PaperProps={{
                            className: isLiquid ? 'liquid-glass' : '',
                            sx: {
                                mt: 1.5,
                                ...(isLiquid ? {
                                    backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.4)',
                                    boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
                                    borderRadius: '24px',
                                } : {
                                    bgcolor: 'hsl(var(--card))',
                                    border: `1px solid ${drawerColors.border}`,
                                    borderRadius: 3,
                                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                }),
                                color: 'rgba(255,255,255,0.9)'
                            }
                        }}
                    >
                        <MenuItem onClick={handleMenuClose} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5 }}>Profile</MenuItem>
                        <MenuItem onClick={handleMenuClose} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5 }}>My Account</MenuItem>
                        <Divider sx={{ my: 1, opacity: 0.1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <MenuItem onClick={handleLogout} sx={{ px: 2, py: 1, mx: 1, borderRadius: 1.5, color: '#ef4444' }}>
                            <ListItemIcon><LogoutIcon fontSize="small" sx={{ color: 'inherit' }} /></ListItemIcon>
                            <Typography fontWeight={600}>Logout</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                variant="permanent"
                open={open}
                className={isLiquid ? 'liquid-glass glass-z3' : ''}
                sx={{
                  '& .MuiDrawer-paper': {
                    bgcolor: isLiquid ? 'transparent' : 'background.paper',
                    borderRight: isLiquid ? 'none' : '1px solid',
                    borderColor: 'divider',
                    borderRadius: 0,
                    margin: isLiquid ? 2 : 0,
                    height: isLiquid ? 'calc(100% - 32px)' : '100%',
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                  }
                }}
              >
                <DrawerHeader>
                    {open && (
                        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                            <Box sx={{ position: 'relative', width: 120, height: 40 }}>
                                <SyraLogo sx={{ width: '100%', height: '100%', color: 'rgba(255,255,255,0.95)' }} />
                            </Box>
                        </Box>

                    )}
                </DrawerHeader>
                <Divider sx={{ opacity: 0.05, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <List sx={{ 
                    flexGrow: 1, 
                    px: 1, 
                    mt: 1,
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'transparent transparent',
                    '&:hover': {
                        scrollbarColor: 'rgba(160, 160, 160, 0.3) transparent',
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
                        backgroundColor: 'rgba(160, 160, 160, 0.3)',
                    },
                }}>
                    {menuItems.filter(item => !item.permission || can(item.permission)).map((item) => {
                        const hasSubItems = 'subItems' in item && (item as any).subItems;
                        const isExpanded = openSubmenus[item.text];
                        const isActive = pathname === item.path || (hasSubItems && pathname.startsWith(item.path));

                        return (
                            <React.Fragment key={item.text}>
                                <ListItem disablePadding sx={{ display: 'block', mb: 0.5 }}>
                                    <ListItemButton
                                        onClick={() => hasSubItems ? handleSubmenuToggle(item.text) : router.push(item.path)}
                                        className={isActive ? 'lms-active' : ''}
                                        sx={{
                                            minHeight: 48,
                                            justifyContent: open ? 'initial' : 'center',
                                            px: 2.5,
                                            borderRadius: '16px',
                                            color: isActive ? '#1dd3c5' : 'rgba(255,255,255,0.6)',
                                            transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                            '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                                                transition: 'transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
                                            },
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.08)',
                                                color: '#ffffff',
                                                '& .MuiListItemIcon-root, & .MuiListItemText-root': {
                                                    transform: open ? 'translateX(4px)' : 'none',
                                                }
                                            },
                                            '&.lms-active': {
                                                '& .MuiListItemIcon-root': {
                                                    color: '#1dd3c5',
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 0,
                                                mr: open ? 3 : 'auto',
                                                justifyContent: 'center',
                                                color: 'inherit',
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={item.text}
                                            sx={{
                                                opacity: open ? 1 : 0,
                                                '& .MuiTypography-root': {
                                                    fontWeight: isActive ? 600 : 500,
                                                    fontSize: '0.9rem'
                                                }
                                            }}
                                        />
                                        {hasSubItems && open && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
                                    </ListItemButton>
                                    
                                    {hasSubItems && (
                                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                            <List component="div" disablePadding role="menu">
                                                {(item as any).subItems.map((subItem: any) => {
                                                    const isSubActive = pathname === subItem.path.split('?')[0] && 
                                                        (!subItem.path.includes('?') || searchParams.toString().includes(subItem.path.split('?')[1]));
                                                    
                                                    return (
                                                        <ListItemButton
                                                            key={subItem.text}
                                                            onClick={() => router.push(subItem.path)}
                                                            sx={{
                                                                pl: 4,
                                                                minHeight: 40,
                                                                borderRadius: '12px',
                                                                mb: 0.5,
                                                                color: isSubActive ? '#1dd3c5' : 'rgba(255,255,255,0.5)',
                                                                '&:hover': {
                                                                    bgcolor: 'rgba(255,255,255,0.05)',
                                                                    color: '#ffffff',
                                                                }
                                                            }}
                                                        >
                                                            <ListItemText 
                                                                primary={subItem.text} 
                                                                sx={{
                                                                    '& .MuiTypography-root': {
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: isSubActive ? 600 : 400
                                                                    }
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
                <Divider sx={{ opacity: 0.05, bgcolor: 'rgba(255,255,255,0.1)' }} />
                <List sx={{ px: 1, pb: 2 }}>
                    {bottomMenuItems.filter(item => !item.permission || can(item.permission)).map((item) => (
                        <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                            <ListItemButton
                                onClick={() => router.push(item.path)}
                                className={pathname === item.path ? 'lms-active' : ''}
                                sx={{
                                    minHeight: 48,
                                    justifyContent: open ? 'initial' : 'center',
                                    px: 2.5,
                                    borderRadius: '16px',
                                    color: pathname === item.path ? '#1dd3c5' : 'rgba(255,255,255,0.6)',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,255,255,0.08)',
                                        color: '#ffffff',
                                    },
                                }}
                            >
                                <ListItemIcon
                                    sx={{
                                        minWidth: 0,
                                        mr: open ? 3 : 'auto',
                                        justifyContent: 'center',
                                        color: 'inherit',
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.text}
                                    sx={{
                                        opacity: open ? 1 : 0,
                                        '& .MuiTypography-root': {
                                            fontWeight: pathname === item.path ? 600 : 500,
                                            fontSize: '0.9rem'
                                        }
                                    }}
                                />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Drawer>

            <Box component="main" sx={{
                flexGrow: 1,
                p: isLiquid ? 4 : { xs: 2, sm: 3 },
                pt: isLiquid ? 14 : 0,
                bgcolor: isLiquid ? 'transparent' : 'background.default',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                minHeight: '100vh',
                position: 'relative'
            }}>
                <DrawerHeader />
                {children}
            </Box>
        </Box>
    );
}
