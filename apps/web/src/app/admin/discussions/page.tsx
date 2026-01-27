'use client';

import React from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, InputAdornment, IconButton } from '@mui/material';
import { GlassCard } from '@/shared/ui/components/GlassCard';
import { useThemeMode } from '@/shared/theme/ThemeContext';

const ICON_COLOR = 'hsl(var(--primary))';
const TEXT_COLOR = 'hsl(var(--foreground))';
const MUTED_TEXT = 'hsl(var(--muted-foreground))';
const DIVIDER = 'hsl(var(--border) / 0.1)';
const CARD_BG = 'hsl(var(--card) / 0.5)';
const PRIMARY_COLOR = 'hsl(var(--primary))';
const PRIMARY_COLOR_01 = 'hsl(var(--primary) / 0.1)';
const PRIMARY_COLOR_02 = 'hsl(var(--primary) / 0.2)';
const SUCCESS_COLOR_01 = 'hsl(var(--success) / 0.1)';
const SUCCESS_COLOR_02 = 'hsl(var(--success) / 0.2)';
const SUCCESS_COLOR_MAIN = 'hsl(var(--success))';
const ERROR_COLOR_01 = 'hsl(var(--destructive) / 0.1)';
const ERROR_COLOR_02 = 'hsl(var(--destructive) / 0.2)';
const ERROR_COLOR_MAIN = 'hsl(var(--destructive))';
const INFO_COLOR_01 = 'hsl(var(--info) / 0.1)';
const INFO_COLOR_02 = 'hsl(var(--info) / 0.2)';
const INFO_COLOR_MAIN = 'hsl(var(--info))';
const CARD_BG_02 = 'hsl(var(--card) / 0.2)';
const CARD_BG_03 = 'hsl(var(--card) / 0.3)';
const CARD_BG_08 = 'hsl(var(--card) / 0.8)';
const PRIMARY_COLOR_005 = 'hsl(var(--primary) / 0.05)';
const ERROR_COLOR_01_RGBA = 'rgba(244, 67, 54, 0.1)';

import Grid from '@mui/material/GridLegacy';
import SearchIcon from '@mui/icons-material/Search';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import PushPinIcon from '@mui/icons-material/PushPin';

const discussions = [
    { id: '1', title: 'JavaScript Best Practices', author: 'John Doe', course: 'Advanced JavaScript', replies: 23, status: 'active' },
    { id: '2', title: 'React vs Vue debate', author: 'Jane Smith', course: 'React Fundamentals', replies: 56, status: 'active' },
    { id: '3', title: 'Question about homework', author: 'Bob Johnson', course: 'Node.js Backend', replies: 5, status: 'locked' },
    { id: '4', title: 'Important Announcement', author: 'Admin', course: 'General', replies: 0, status: 'pinned' },
];

export default function DiscussionsPage() {
    const { mode } = useThemeMode();
    const glassStyle = mode === 'liquid-glass' ? {
        backdropFilter: 'url("#liquid-glass-ua6213iyf_filter") blur(19px) brightness(1.1) saturate(1)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: 'rgba(0, 0, 0, 0.25) 0px 4px 8px, rgba(0, 0, 0, 0.15) 0px -10px 25px inset, rgba(255, 255, 255, 0.74) 0px -1px 4px 1px inset',
    } : {};

    return (
        <Box sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, mb: 1, letterSpacing: '-0.02em' }}>
                        Discussions
                    </Typography>
                    <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 500 }}>
                        Manage and moderate course discussion threads
                    </Typography>
                </Box>
            </Box>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                {[
                    { label: 'Total Threads', value: discussions.length, icon: <ForumIcon />, color: 'primary' },
                    { label: 'Active', value: discussions.filter(d => d.status === 'active').length, icon: <PeopleIcon />, color: 'success' },
                    { label: 'Reported', value: 0, icon: <ReportIcon />, color: 'error' },
                ].map((stat) => (
                    <Grid item xs={12} sm={4} key={stat.label}>
                        <GlassCard sx={{ 
                            p: 3, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 2.5, 
                            border: `1px solid ${DIVIDER}`,
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                                borderRadius: '24px',
                            } : {})
                        }}>
                            <Box sx={{ 
                                width: 56,
                                height: 56,
                                borderRadius: '16px', 
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: stat.color === 'primary' ? PRIMARY_COLOR_01 : stat.color === 'success' ? SUCCESS_COLOR_01 : ERROR_COLOR_01,
                                color: stat.color === 'primary' ? ICON_COLOR : stat.color === 'success' ? SUCCESS_COLOR_MAIN : ERROR_COLOR_MAIN,
                                border: `1px solid ${stat.color === 'primary' ? PRIMARY_COLOR_02 : stat.color === 'success' ? SUCCESS_COLOR_02 : ERROR_COLOR_02}`
                            }}>
                                {stat.icon}
                            </Box>
                            <Box>
                                <Typography variant="h4" sx={{ fontWeight: 800, color: TEXT_COLOR, lineHeight: 1 }}>{stat.value}</Typography>
                                <Typography variant="body2" sx={{ color: MUTED_TEXT, fontWeight: 600, mt: 0.5 }}>{stat.label}</Typography>
                            </Box>
                        </GlassCard>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField
                    size="small"
                    placeholder="Search discussions..."
                    InputProps={{ 
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{ color: MUTED_TEXT, fontSize: 20 }} />
                            </InputAdornment>
                        ) 
                    }}
                    sx={{ 
                        width: 320,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            bgcolor: CARD_BG_02,
                            border: `1px solid ${DIVIDER}`,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                borderColor: ICON_COLOR,
                                bgcolor: CARD_BG_03,
                            },
                            '&.Mui-focused': {
                                borderColor: ICON_COLOR,
                                boxShadow: `0 0 0 4px ${ICON_COLOR}20`,
                            },
                            ...(mode === 'liquid-glass' ? {
                                ...glassStyle,
                                '& fieldset': { border: 'none' }
                            } : {})
                        }
                    }}
                />
            </Box>

            <GlassCard
                p={0}
                sx={{
                    width: '100%',
                    overflow: 'hidden',
                    borderRadius: mode === 'liquid-glass' ? '24px' : 4,
                    border: `1px solid ${DIVIDER}`,
                    ...(mode === 'liquid-glass' ? {
                        ...glassStyle,
                    } : {})
                }}
            >
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Thread</TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Course</TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Author</TableCell>
                                <TableCell align="center" sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Replies</TableCell>
                                <TableCell sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Status</TableCell>
                                <TableCell align="right" sx={{ 
                                    fontWeight: 700, 
                                    bgcolor: mode === 'liquid-glass' ? 'rgba(255, 255, 255, 0.05)' : CARD_BG_08, 
                                    backdropFilter: mode === 'liquid-glass' ? 'none' : 'blur(10px)', 
                                    color: TEXT_COLOR, 
                                    borderBottom: `1px solid ${DIVIDER}`,
                                    ...(mode === 'liquid-glass' ? glassStyle : {})
                                }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {discussions.map((thread) => (
                                <TableRow 
                                    key={thread.id} 
                                    hover
                                    sx={{
                                        transition: 'all 0.2s ease',
                                        '&:hover': { bgcolor: PRIMARY_COLOR_005 },
                                        borderBottom: `1px solid ${DIVIDER}`
                                    }}
                                >
                                    <TableCell sx={{ color: TEXT_COLOR, fontWeight: 600, borderBottom: 'none' }}>
                                        <Typography fontWeight={600} sx={{ color: TEXT_COLOR }}>{thread.title}</Typography>
                                    </TableCell>
                                    <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>
                                        <Chip 
                                            label={thread.course} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: CARD_BG, 
                                                color: MUTED_TEXT,
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                border: `1px solid ${DIVIDER}`
                                            }} 
                                        />
                                    </TableCell>
                                    <TableCell sx={{ color: MUTED_TEXT, borderBottom: 'none' }}>{thread.author}</TableCell>
                                    <TableCell align="center" sx={{ color: TEXT_COLOR, fontWeight: 700, borderBottom: 'none' }}>{thread.replies}</TableCell>
                                    <TableCell sx={{ borderBottom: 'none' }}>
                                        <Chip
                                            label={thread.status}
                                            size="small"
                                            sx={{ 
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                bgcolor: thread.status === 'active' ? SUCCESS_COLOR_01 : thread.status === 'pinned' ? INFO_COLOR_01 : CARD_BG_02,
                                                color: thread.status === 'active' ? SUCCESS_COLOR_MAIN : thread.status === 'pinned' ? INFO_COLOR_MAIN : MUTED_TEXT,
                                                border: `1px solid ${thread.status === 'active' ? SUCCESS_COLOR_02 : thread.status === 'pinned' ? INFO_COLOR_02 : DIVIDER}`
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="right" sx={{ borderBottom: 'none' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                                            <IconButton size="small" sx={{ color: ICON_COLOR, '&:hover': { bgcolor: PRIMARY_COLOR_01 } }}><PushPinIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" sx={{ color: TEXT_COLOR, '&:hover': { bgcolor: CARD_BG_08 } }}><LockIcon fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" sx={{ '&:hover': { bgcolor: ERROR_COLOR_01_RGBA } }}><DeleteIcon fontSize="small" /></IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </GlassCard>
        </Box>
    );
}
