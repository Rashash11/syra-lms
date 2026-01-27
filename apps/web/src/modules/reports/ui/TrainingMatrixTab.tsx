'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Button,
    Menu,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Avatar,
    CircularProgress,
    Typography,
    Tooltip,
    InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DownloadIcon from '@mui/icons-material/Download';
import ViewListIcon from '@mui/icons-material/ViewList';
import { getCsrfToken } from '@/lib/client-csrf';
import { useThemeMode } from '@shared/theme/ThemeContext';
import { GlassCard } from '@shared/ui/components/GlassCard';

// Consistent styling constants
const TEXT_COLOR = '#ffffff';
const MUTED_TEXT = 'rgba(255, 255, 255, 0.7)';
const ACCENT_COLOR = '#1dd3c5'; // Vibrant cyan/teal
const PRIMARY_GRADIENT = 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)';
const WARNING_GRADIENT = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'; // Pink/Red for low progress
const SUCCESS_GRADIENT = 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'; // Green/Teal for completion
const CARD_BG = 'rgba(13, 20, 20, 0.6)';

interface TrainingMatrixData {
    users: Array<{
        userId: string;
        userName: string;
        userEmail: string;
        courses: Array<{
            courseId: string;
            courseName: string;
            progress: number;
            status: string;
        }>;
    }>;
    courses: Array<{
        id: string;
        title: string;
    }>;
}

export default function TrainingMatrixTab() {
    const { mode } = useThemeMode();
    const [data, setData] = useState<TrainingMatrixData | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [viewAnchor, setViewAnchor] = useState<null | HTMLElement>(null);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (search) params.append('search', search);

            const res = await fetch(`/api/reports/training-matrix?${params}`);
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Error fetching training matrix:', error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchData();
    }, [search, fetchData]);

    const handleExport = async () => {
        try {
            const res = await fetch('/api/reports/export/training-matrix', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-csrf-token': getCsrfToken() || ''
                },
                body: JSON.stringify({ search }),
            });

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Training_matrix.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting matrix:', error);
        }
        setExportAnchor(null);
    };

    const getProgressStyle = (progress: number) => {
        if (progress === 0) return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.1)' };
        if (progress < 50) return { bg: WARNING_GRADIENT, border: 'transparent', shadow: '0 2px 8px rgba(245, 87, 108, 0.4)' };
        if (progress < 100) return { bg: PRIMARY_GRADIENT, border: 'transparent', shadow: '0 2px 8px rgba(0, 114, 255, 0.4)' };
        return { bg: SUCCESS_GRADIENT, border: 'transparent', shadow: '0 2px 8px rgba(56, 249, 215, 0.4)' };
    };

    if (loading || !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress sx={{ color: ACCENT_COLOR }} />
            </Box>
        );
    }

    return (
        <Box>
            {/* Controls */}
            <GlassCard sx={{ 
                p: 2, 
                mb: 3, 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center',
                background: 'linear-gradient(145deg, rgba(20, 30, 48, 0.6) 0%, rgba(36, 59, 85, 0.4) 100%)'
            }}>
                <TextField
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    size="small"
                    sx={{ 
                        flex: 1,
                        '& .MuiOutlinedInput-root': {
                            color: TEXT_COLOR,
                            bgcolor: 'rgba(0,0,0,0.2)',
                            borderRadius: '10px',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&.Mui-focused fieldset': { borderColor: ACCENT_COLOR }
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
                
                <Button
                    variant="outlined"
                    startIcon={<ViewListIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setViewAnchor(e.currentTarget)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        color: TEXT_COLOR,
                        borderRadius: '10px',
                        px: 3,
                        '&:hover': { 
                            borderColor: ACCENT_COLOR, 
                            bgcolor: 'rgba(29, 211, 197, 0.1)' 
                        }
                    }}
                >
                    View
                </Button>
                
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    onClick={(e) => setExportAnchor(e.currentTarget)}
                    sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        background: PRIMARY_GRADIENT,
                        color: '#fff',
                        borderRadius: '10px',
                        px: 3,
                        boxShadow: '0 4px 14px rgba(0, 114, 255, 0.3)',
                        '&:hover': { 
                            boxShadow: '0 6px 20px rgba(0, 114, 255, 0.5)',
                            transform: 'translateY(-1px)'
                        }
                    }}
                >
                    Export
                </Button>
            </GlassCard>

            {/* View Menu */}
            <Menu 
                anchorEl={viewAnchor} 
                open={Boolean(viewAnchor)} 
                onClose={() => setViewAnchor(null)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1f2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        marginTop: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    },
                }}
            >
                <MenuItem onClick={() => setViewAnchor(null)} sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>Default view</MenuItem>
                <MenuItem onClick={() => setViewAnchor(null)} sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>Compact view</MenuItem>
            </Menu>

            {/* Export Menu */}
            <Menu 
                anchorEl={exportAnchor} 
                open={Boolean(exportAnchor)} 
                onClose={() => setExportAnchor(null)}
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1f2e',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        marginTop: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    },
                }}
            >
                <MenuItem onClick={handleExport} sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>Export to Excel</MenuItem>
            </Menu>

            {/* Matrix Table */}
            <GlassCard sx={{ overflow: 'hidden', p: 0 }}>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                    <Table sx={{ minWidth: 650 }} stickyHeader size="medium">
                        <TableHead>
                            <TableRow>
                                <TableCell 
                                    sx={{ 
                                        fontWeight: 700, 
                                        color: ACCENT_COLOR, 
                                        bgcolor: '#0f172a', 
                                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                                        zIndex: 10
                                    }}
                                >
                                    Users
                                </TableCell>
                                {data.courses.map((course) => (
                                    <TableCell 
                                        key={course.id} 
                                        align="center" 
                                        sx={{ 
                                            minWidth: 80, 
                                            fontWeight: 700, 
                                            color: MUTED_TEXT,
                                            bgcolor: '#0f172a',
                                            borderBottom: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <Tooltip title={course.title}>
                                            <Box
                                                sx={{
                                                    transform: 'rotate(-45deg)',
                                                    whiteSpace: 'nowrap',
                                                    fontSize: '0.75rem',
                                                    maxWidth: 100,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    height: 100,
                                                    display: 'flex',
                                                    alignItems: 'flex-end',
                                                    justifyContent: 'center',
                                                    pb: 1
                                                }}
                                            >
                                                {course.title}
                                            </Box>
                                        </Tooltip>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {data.users.map((user) => (
                                <TableRow
                                    key={user.userId}
                                    hover
                                    sx={{ 
                                        transition: 'background-color 0.2s',
                                        '&:hover': { backgroundColor: 'rgba(29, 211, 197, 0.05) !important' } 
                                    }}
                                >
                                    <TableCell sx={{ fontWeight: 600, color: TEXT_COLOR, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    bgcolor: 'rgba(255,255,255,0.1)',
                                                    fontSize: '0.875rem',
                                                    color: ACCENT_COLOR
                                                }}
                                            >
                                                {user.userName.charAt(0)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{user.userName}</Typography>
                                                <Typography variant="caption" sx={{ color: MUTED_TEXT }}>{user.userEmail}</Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    {user.courses.map((course) => {
                                        const style = getProgressStyle(course.progress);
                                        return (
                                            <TableCell key={course.courseId} align="center" sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <Tooltip title={`${course.courseName}: ${course.progress}%`}>
                                                    <Box
                                                        sx={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            width: 36,
                                                            height: 36,
                                                            borderRadius: '50%',
                                                            background: style.bg,
                                                            color: course.progress > 0 ? '#fff' : 'rgba(255, 255, 255, 0.3)',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            border: `1px solid ${style.border}`,
                                                            boxShadow: style.shadow || 'none',
                                                            transition: 'transform 0.2s',
                                                            '&:hover': { transform: 'scale(1.1)' }
                                                        }}
                                                    >
                                                        {course.progress > 0 ? `${course.progress}%` : ''}
                                                    </Box>
                                                </Tooltip>
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {data.users.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="h6" sx={{ color: MUTED_TEXT, mb: 1 }}>
                            No users found
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                            Try adjusting your search criteria
                        </Typography>
                    </Box>
                )}
            </GlassCard>
        </Box>
    );
}
